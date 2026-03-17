// Test SMS sending with Twilio
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testSMS() {
  const phone = '+12255628719'; // Your Twilio number
  const testPhone = '+15145574811'; // Replace with YOUR phone number to receive the test SMS
  
  console.log('Testing SMS with Twilio...');
  console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID);
  console.log('From number:', process.env.TWILIO_PHONE_NUMBER);
  console.log('To number:', testPhone);
  
  const message = '🎉 Test message from Janine game! Your claim code: TEST99';
  
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString('base64')}`,
        },
        body: new URLSearchParams({
          To: testPhone,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Twilio error:', data);
      console.error('Status:', response.status);
      console.error('Error code:', data.code);
      console.error('Error message:', data.message);
    } else {
      console.log('✅ SMS sent successfully!');
      console.log('Message SID:', data.sid);
      console.log('Status:', data.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSMS();
