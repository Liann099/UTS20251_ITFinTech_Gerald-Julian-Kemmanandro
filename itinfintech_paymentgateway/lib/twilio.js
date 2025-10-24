// lib/twilio.js
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
// For WhatsApp sandbox, we use the specific sandbox number as the "From"
const fromNumber = process.env.TWILIO_WHATSAPP_SANDBOX_NUMBER || 'whatsapp:+14155238886'; 

if (!accountSid || !authToken) {
  throw new Error('Twilio credentials are required. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env.local file');
}

const client = twilio(accountSid, authToken);

export const sendWhatsAppVerification = async (toPhoneNumber, code) => {
  try {
    const toNumber = `whatsapp:+${toPhoneNumber.replace(/\D/g, '')}`;
    
    // The from number should be the sandbox number
    const message = await client.messages.create({
      body: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      from: fromNumber, // Using the WhatsApp sandbox number
      to: toNumber // Send to the user's WhatsApp number
    });
    
    console.log('WhatsApp verification code sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp verification code:', error);
    throw error;
  }
};

// For production (when you have your own WhatsApp number approved)
export const sendWhatsAppVerificationProduction = async (toPhoneNumber, code) => {
  try {
    // In production, you would use your own WhatsApp-enabled Twilio number
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    if (!fromNumber) {
      throw new Error('Production WhatsApp number not configured');
    }
    
    const message = await client.messages.create({
      body: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:+${toPhoneNumber.replace(/\D/g, '')}`
    });
    
    console.log('WhatsApp verification code sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp verification code:', error);
    throw error;
  }
};

// Fallback to SMS if needed
export const sendSMSVerification = async (toPhoneNumber, code) => {
  try {
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioNumber) {
      throw new Error('Twilio phone number not configured');
    }
    
    const message = await client.messages.create({
      body: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
      from: twilioNumber,
      to: `+${toPhoneNumber.replace(/\D/g, '')}`
    });
    
    console.log('SMS verification code sent:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending SMS verification code:', error);
    throw error;
  }
};