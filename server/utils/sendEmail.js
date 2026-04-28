const sendEmail = ({ to, subject, text }) => {
  console.log('\n========================================================');
  console.log('📧 MOCK EMAIL DISPATCHED');
  console.log('========================================================');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('--------------------------------------------------------');
  console.log(text);
  console.log('========================================================\n');
  
  // In a real application, you would use a service like SendGrid, Mailgun, 
  // or nodemailer with an SMTP server here.
  return Promise.resolve(true);
};

module.exports = sendEmail;
