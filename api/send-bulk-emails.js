const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { contacts, template, selectedAccount } = req.body;

    // 8 Gmail accounts configuration
    const emailAccounts = [
      {
        id: 1,
        name: 'Account 1',
        email: 'aprajita@vidzy.in',
        password: 'kdjabrjmwzoatheb',
        active: true
      },
      {
        id: 2,
        name: 'Account 2',
        email: 'aman@vidzy.in',
        password: 'hpooftkcjrynuapd',
        active: false
      },
      {
        id: 3,
        name: 'Account 3',
        email: 'khushigupta@vidzy.in',
        password: 'gjtwjnklwevclovw',
        active: false
      },
      {
        id: 4,
        name: 'Account 4',
        email: 'vasu@vidzy.in',
        password: 'zgtmovcxrebpjnaf',
        active: false
      },
      {
        id: 5,
        name: 'Account 5',
        email: 'arshad@vidzy.in',
        password: 'bxngwhiqhqmtzbrh',
        active: false
      },
      {
        id: 6,
        name: 'Account 6',
        email: 'mayank@vidzy.in',
        password: 'nzqbgunjxqnbnsqk',
        active: false
      },
      {
        id: 7,
        name: 'Account 7',
        email: 'vibhanshu@vidzy.in',
        password: 'bwmigdrkpumvbcrp',
        active: false
      },
    {
    id: 8, 
    name: 'Account 8',
    email: 'diya@mywallbrands.shop',
    password: 'vzjpebxiyjrxaaia', 
    active: false
    },
    {
    id: 9, 
    name: 'Account 9',
    email: 'ananya@mywallsocial.shop',
    password: 'jxduvxqlhihasgtk', 
    active: false
    },
    {
    id: 10, 
    name: 'Account 10',
    email: 'riya@mywallsocial.shop',
    password: 'viyfmswqfalqpiyo', 
    active: false
    },
    {
    id: 11, 
    name: 'Account 11',
    email: 'ishita@mywallsocial.shop',
    password: 'ihgmfczeyubdnjsf', 
    active: false
    },
    {
    id: 12, 
    name: 'Account 12',
    email: 'saanvi@mywallsocial.shop',
    password: 'xuvexdnfvksxpqnf', 
    active: false
    },
    {
    id: 13, 
    name: 'Account 13',
    email: 'tanvi@mywallsocial.shop',
    password: 'bfxjpwzikiudadbt', 
    active: false
    },
    {
    id: 14, 
    name: 'Account 14',
    email: 'kavya@mywallsocial.shop',
    password: 'ikhdyffpmyrxgbbw', 
    active: false
    },
    {
    id: 15, 
    name: 'Account 15',
    email: 'myra@mywallsocial.shop',
    password: 'gfjkmcqajeluickp', 
    active: false
    },
    {
    id: 16, 
    name: 'Account 16',
    email: 'ira@mywallsocial.shop',
    password: 'srqpofgwocdmblis', 
    active: false
    },
    {
    id: 17, 
    name: 'Account 17',
    email: 'charvi@mywallsocial.shop',
    password: 'wnexoygjyatfwzqm', 
    active: false
    },
    {
    id: 18, 
    name: 'Account 18',
    email: 'diya@mywallbrands.shop',
    password: 'meewibndkcrjsrfw', 
    active: false
    },
    {
    id: 19, 
    name: 'Account 19',
    email: 'ananya@mywallbrands.shop',
    password: 'jtvkbpvmqbrqhrlq', 
    active: false
    },
    {
    id: 20, 
    name: 'Account 20',
    email: 'riya@mywallbrands.shop',
    password: 'axomyzxcfkigcgmt', 
    active: false
    },
    {
    id: 21, 
    name: 'Account 21',
    email: 'ishita@mywallbrands.shop',
    password: 'tmvqeyoibqhvprpe', 
    active: false
    },
    {
    id: 22, 
    name: 'Account 22',
    email: 'saanvi@mywallbrands.shop',
    password: 'kqfkpcwjsylfyuqo', 
    active: false
    },
    {
    id: 23, 
    name: 'Account 23',
    email: 'tanvi@mywallbrands.shop',
    password: 'kstdneatqihewqqn', 
    active: false
    },
    {
    id: 24, 
    name: 'Account 24',
    email: 'kavya@mywallbrands.shop',
    password: 'rkuaeccpifittxxz', 
    active: false
    },
    {
    id: 25, 
    name: 'Account 25',
    email: 'myra@mywallbrands.shop',
    password: 'zxvuvygkyxwuxffn', 
    active: false
    },
    {
    id: 26, 
    name: 'Account 26',
    email: 'ira@mywallbrands.shop',
    password: 'cjdnliijkchmgrtv', 
    active: false
    },
    {
    id: 27, 
    name: 'Account 27',
    email: 'charvi@mywallbrands.shop',
    password: 'ngceozdoxmaymmmy', 
    active: false
    },
    {
    id: 28, 
    name: 'Account 28',
    email: 'diya@mywallstudio.shop',
    password: 'vpucgukdypymwzqx', 
    active: false
    },
    {
    id: 29, 
    name: 'Account 29',
    email: 'ananya@mywallstudio.shop',
    password: 'oglhiqyramhvzahn', 
    active: false
    },
    {
    id: 30, 
    name: 'Account 30',
    email: 'riya@mywallstudio.shop',
    password: 'ljopgovgknpwldiv', 
    active: false
    },
    {
    id: 31, 
    name: 'Account 31',
    email: 'ira@mywallstudio.shop',
    password: 'rxjybwjdbwwfmlgi', 
    active: false
    },
    {
    id: 32, 
    name: 'Account 32',
    email: 'charvi@mywallstudio.shop',
    password: 'nrhwoiuiiekfflye', 
    active: false
    },
    {
  id: 33,
  name: 'Account 33',
  email: 'anvi@grynowinfluence.shop',
  password: 'puxgifpfininrdez',
  active: false
},
{
  id: 34,
  name: 'Account 34',
  email: 'charvi@grynowinfluence.shop',
  password: 'frvbvandhbgvfcnn',
  active: false
},
{
  id: 35,
  name: 'Account 35',
  email: 'ira@grynowinfluence.shop',
  password: 'hsjxycgghxjzckcy',
  active: false
},
{
  id: 36,
  name: 'Account 36',
  email: 'myra@grynowinfluence.shop',
  password: 'uomdavlywyahxqkf',
  active: false
},
{
  id: 37,
  name: 'Account 37',
  email: 'kavya@grynowinfluence.shop',
  password: 'kjefdqfsaolkslts',
  active: false
},
{
  id: 38,
  name: 'Account 38',
  email: 'tanvi@grynowinfluence.shop',
  password: 'nbvjfvzsxovhybko',
  active: false
},
{
  id: 39,
  name: 'Account 39',
  email: 'riya@grynowinfluence.shop',
  password: 'uiaonyoctycvhcxo',
  active: false
},
{
  id: 40,
  name: 'Account 40',
  email: 'saanvi@grynowinfluence.shop',
  password: 'inthxtokghhnuyww',
  active: false
}
    

    ];

    // Select account based on frontend selection or use first active
    let currentAccount;
    if (selectedAccount) {
      currentAccount = emailAccounts.find(acc => acc.id === selectedAccount);
    } else {
      currentAccount = emailAccounts.find(acc => acc.active);
    }

    if (!currentAccount) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active email account found' 
      });
    }

    console.log(`🚀 Using account: ${currentAccount.email}`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: currentAccount.email,
        pass: currentAccount.password
      }
    });

    const results = {
      total: contacts.length,
      sent: 0,
      failed: 0,
      errors: [],
      usedAccount: currentAccount.email,
      accountSwitches: []
    };

    // Auto-rotation settings
    const emailsPerAccount = 40; // Gmail safe limit per hour
    let emailsSentFromCurrentAccount = 0;
    let currentAccountIndex = emailAccounts.findIndex(acc => acc.id === currentAccount.id);

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      try {
        // Auto-switch account if limit reached
        if (emailsSentFromCurrentAccount >= emailsPerAccount && emailAccounts.length > 1) {
          console.log(`📧 Switching account after ${emailsSentFromCurrentAccount} emails`);
          
          // Find next available account
          currentAccountIndex = (currentAccountIndex + 1) % emailAccounts.length;
          currentAccount = emailAccounts[currentAccountIndex];
          emailsSentFromCurrentAccount = 0;
          
          // Create new transporter for new account
          const newTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: currentAccount.email,
              pass: currentAccount.password
            }
          });
          
          results.accountSwitches.push({
            switchAt: i,
            newAccount: currentAccount.email
          });
          
          console.log(`🔄 Switched to: ${currentAccount.email}`);
        }

        // Personalize email content
        let personalizedSubject = template.subject;
        let personalizedContent = template.content;
        
        Object.keys(contact).forEach(key => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          personalizedSubject = personalizedSubject.replace(regex, contact[key] || '');
          personalizedContent = personalizedContent.replace(regex, contact[key] || '');
        });

        // ADDED: Convert text to HTML with preserved spacing
        const htmlContent = convertTextToHTML(personalizedContent);

        // Send email
        await transporter.sendMail({
          from: currentAccount.email,
          to: contact.email,
          subject: personalizedSubject,
          html: htmlContent  // Use HTML with preserved formatting
        });

        results.sent++;
        emailsSentFromCurrentAccount++;
        console.log(`✅ Email ${i + 1}/${contacts.length} sent to ${contact.email} from ${currentAccount.email}`);
        
        // Delay between emails (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        results.failed++;
        results.errors.push({
          email: contact.email || 'unknown',
          error: error.message,
          account: currentAccount.email
        });
        console.log(`❌ Failed: ${contact.email} - ${error.message}`);
      }
    }

    results.successRate = results.total > 0 ? Math.round((results.sent / results.total) * 100) : 0;

    return res.status(200).json({ 
      success: true, 
      results: results
    });

  } catch (error) {
    console.error('Bulk email error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};

// ADDED: Function to convert text to HTML with preserved spacing
function convertTextToHTML(text) {
  if (!text) return '';
  
  return text
    // Convert line breaks to <br> tags
    .replace(/\r?\n/g, '<br>')
    // Convert multiple spaces to &nbsp; to preserve spacing
    .replace(/  +/g, function(spaces) {
      return '&nbsp;'.repeat(spaces.length);
    })
    // Wrap in a div with proper CSS for spacing preservation
    .replace(/^/, '<div style="white-space: pre-wrap; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">')
    .replace(/$/, '</div>');
}


