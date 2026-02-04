console.log("RUNNER namespace =", process.env.REDIS_NAMESPACE);

const {
  sleep,
  convertTextToHTML,
  createTransporter,
  looksLikeAccountLevelFailure,
  applyMerge,
  loadAccountsConfig,
  redisGet,
  redisSet,
  redisSetNx,
  redisDel
} = require("../api/_shared");

const EMAILS_PER_ACCOUNT = 30;           
const PER_EMAIL_DELAY_MIN_MS = 30 * 1000;
const PER_EMAIL_DELAY_MAX_MS = 90 * 1000;
const ONE_HOUR = 60 * 60 * 1000;        
const DAILY_LIMIT = 300;               
const MAX_RETRY = 1;
const LOCK_TTL_SECONDS = 29 * 60;

/**
 * Picks random value (array or string)
 */
function pickRandom(value) {
  if (Array.isArray(value)) {
    return value[Math.floor(Math.random() * value.length)];
  }
  return value;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function randomDelayMs() {
  const min = PER_EMAIL_DELAY_MIN_MS;
  const max = PER_EMAIL_DELAY_MAX_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getIndiaTimeParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  return { hour, minute };
}

function isWithinIndiaSendWindow(date = new Date()) {
  const { hour, minute } = getIndiaTimeParts(date);
  if (hour < 9) return false;
  if (hour > 19) return false;
  if (hour === 20 && minute > 0) return false;
  return true;
}

function accountGroup(email) {
  const domain = String(email || "").split("@")[1] || "";
  const d = domain.toLowerCase();
  if (d.includes("vidzy")) return "vidzy";
  if (d.includes("grynow")) return "grynow";
  return null;
}

(async function runAutoTick() {
  try {
    const lockOk = await redisSetNx("auto:campaign:lock", Date.now(), LOCK_TTL_SECONDS);
    if (!lockOk) {
      console.log("??? Lock active, exiting");
      process.exit(0);
    }
    console.log("???? Auto Tick Runner started");

    async function processGroup(groupId) {
      const activeId = await redisGet(`auto:campaign:active:${groupId}`);
      if (!activeId) {
        console.log(`?????? No active campaign (${groupId})`);
        return;
      }

      const campaignKey = `auto:campaign:${activeId}`;
      const retryKey = `auto:campaign:${activeId}:retry`;
      const statsKey = `auto:campaign:${activeId}:stats`;
      const eventsKey = `auto:campaign:${activeId}:events`;
      const lastSendKey = `auto:campaign:${activeId}:lastSendAt`;
      const liveKey = `auto:campaign:${activeId}:live`;

      const campaign = await redisGet(campaignKey);
      if (!campaign || campaign.status !== "running") {
        console.log(`?????? Campaign not running (${groupId})`);
        return;
      }

      if (!isWithinIndiaSendWindow()) {
        console.log("Outside India send window (09:00-20:00 IST)");
        await redisSet(liveKey, {
          currentAccountId: null,
          currentEmail: null,
          currentSenderName: null,
          state: "paused_outside_window",
          updatedAt: Date.now()
        });
        return;
      }

      /**
       * ?????? 1-HOUR GAP BETWEEN BATCHES
       */
      const lastSendAt = await redisGet(lastSendKey);
      const now = Date.now();
      if (lastSendAt && now - Number(lastSendAt) < ONE_HOUR) {
        console.log(`??? Batch cooldown active (${groupId})`);
        return;
      }

      const runtime = (await redisGet("accounts:runtime")) || {};
      const accounts = loadAccountsConfig();

      const connectedAccounts = accounts.filter(
        (a) => runtime[String(a.id)]?.connected !== false && accountGroup(a.email) === groupId
      );

      if (connectedAccounts.length === 0) {
        console.log(`??? No connected accounts (${groupId})`);
        return;
      }

      let retryQueue = (await redisGet(retryKey)) || [];
      let cursor = campaign.cursor || 0;
      const contacts = campaign.contacts;
      const total = contacts.length;

      /**
       * Create jobs
       */
      const jobs = connectedAccounts.map(acc => ({
        account: acc,
        queue: []
      }));

      /**
       * Retry queue first
       */
      for (const job of jobs) {
        while (job.queue.length < EMAILS_PER_ACCOUNT && retryQueue.length > 0) {
          job.queue.push(retryQueue.shift());
        }
      }

      /**
       * New contacts
       */
      for (const job of jobs) {
        while (job.queue.length < EMAILS_PER_ACCOUNT && cursor < total) {
          job.queue.push({ contact: contacts[cursor], retry: 0 });
          cursor++;
        }
      }

      /**
       * Save cursor
       */
      campaign.cursor = cursor;
      campaign.updatedAt = Date.now();
      await redisSet(campaignKey, campaign);
      await redisSet(retryKey, retryQueue);

      const stats = (await redisGet(statsKey)) || {
        totalSent: 0,
        totalFailed: 0,
        byAccount: {}
      };

      /**
       * Process accounts
       */
      await Promise.all(
        jobs.map(async ({ account, queue }) => {
          if (!queue.length) return;

          const accId = String(account.id);
          const today = todayKey();
          const dailyKey = `auto:account:${accId}:dailyCount:${today}`;
          let dailyCount = Number(await redisGet(dailyKey)) || 0;

          // ??? DAILY LIMIT CHECK
          if (dailyCount >= DAILY_LIMIT) {
            console.log(`??? Daily limit reached for ${account.email}`);
            return;
          }

          stats.byAccount[accId] ||= {
            email: account.email,
            senderName: account.senderName,
            sent: 0,
            failed: 0,
            lastSentAt: null
          };

          const transporter = createTransporter(account);

          for (const item of queue) {
            if (dailyCount >= DAILY_LIMIT) {
              console.log(`??? Daily limit reached mid-batch for ${account.email}`);
              break;
            }

            const { contact, retry } = item;
            const to = contact.email;
            if (!to) continue;

            try {
              if (!isWithinIndiaSendWindow()) {
                console.log("Outside India send window (09:00-20:00 IST)");
                await redisSet(liveKey, {
                  currentAccountId: null,
                  currentEmail: null,
                  currentSenderName: null,
                  state: "paused_outside_window",
                  updatedAt: Date.now()
                });
                return;
              }

              await redisSet(liveKey, {
                currentAccountId: accId,
                currentEmail: to,
                currentSenderName: account.senderName,
                state: "sending",
                updatedAt: Date.now()
              });

              const randomBrand = pickRandom(campaign.brandName);
              const randomSubject = pickRandom(campaign.template.subject);
              const randomBody = pickRandom(campaign.template.content);

              const vars = {
                ...contact,
                brandName: randomBrand,
                senderName: account.senderName
              };

              const subject = applyMerge(randomSubject, vars);
              const body = applyMerge(randomBody, vars);
              const html = convertTextToHTML(body);

              const info = await transporter.sendMail({
                from: `"${account.senderName}" <${account.email}>`,
                to,
                subject,
                html
              });

              dailyCount++;
              await redisSet(dailyKey, dailyCount);

              if (retry > 0) {
                if (stats.totalFailed > 0) stats.totalFailed--;
                if (stats.byAccount[accId].failed > 0) stats.byAccount[accId].failed--;
              }

              stats.totalSent++;
              stats.byAccount[accId].sent++;
              stats.byAccount[accId].lastSentAt = Date.now();

              await redisSet(statsKey, stats);

              console.log(
                `SENT ${to} | accepted=${(info.accepted || []).length} rejected=${(info.rejected || []).length} response=${info.response || ""}`
              );

              const ev = (await redisGet(eventsKey)) || [];
              ev.push({
                ts: Date.now(),
                status: "sent",
                from: account.email,
                to,
                subject,
                accepted: info.accepted || [],
                rejected: info.rejected || [],
                response: info.response || "",
                messageId: info.messageId || ""
              });
              await redisSet(eventsKey, ev.slice(-300));

              await sleep(randomDelayMs());
            } catch (err) {
              stats.totalFailed++;
              stats.byAccount[accId].failed++;
              await redisSet(statsKey, stats);

              if (looksLikeAccountLevelFailure(err)) {
                runtime[accId] = { connected: false, lastError: err.message };
                await redisSet("accounts:runtime", runtime);
                break;
              }

              if (retry < MAX_RETRY) {
                retryQueue.push({ contact, retry: retry + 1 });
              }

              const ev = (await redisGet(eventsKey)) || [];
              ev.push({
                ts: Date.now(),
                status: "failed",
                from: account.email,
                to,
                error: err.message
              });
              await redisSet(eventsKey, ev.slice(-300));

              await sleep(randomDelayMs());
            }
          }
        })
      );

      await redisSet(retryKey, retryQueue);
      await redisSet(statsKey, stats);

      // ??? batch timestamp
      await redisSet(lastSendKey, Date.now());

      /**
       * Finish campaign
       */
      if (campaign.cursor >= total && retryQueue.length === 0) {
        campaign.status = "completed";
        campaign.updatedAt = Date.now();
        await redisSet(campaignKey, campaign);
        await redisDel(`auto:campaign:active:${groupId}`);

        const ev = (await redisGet(eventsKey)) || [];
        ev.push({
          ts: Date.now(),
          status: "campaign_completed",
          campaignId: campaign.id
        });
        await redisSet(eventsKey, ev.slice(-300));
      }
    }

    for (const groupId of ["vidzy", "grynow"]) {
      await processGroup(groupId);
    }

    process.exit(0);
  } catch (err) {
    console.error("???? Auto Tick Runner crashed:", err);
    process.exit(1);
  }
})();
