// emailService.js
const nodemailer = require('nodemailer');

async function sendResolutionEmail(toEmail, toName, complaintId, department) {
  if (!toEmail) {
    console.log('[EmailService] No email provided, skipping notification.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'timpo4834@gmail.com',
        pass: process.env.GMAIL_PASS || 'TBD'
      },
    });

    const info = await transporter.sendMail({
      from: '"CivicMatrix Admin" <timpo4834@gmail.com>',
      to: toEmail,
      subject: `Complaint #${complaintId} Resolved`,
      text: `Dear ${toName},\n\nYour complaint #${complaintId} has been successfully resolved by the ${department}.\n\nThank you for making our city better!\n\nCivicMatrix Team`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0A0A14; color: #fff; padding: 30px; border-radius: 8px;">
          <h2 style="color: #30D158;">Complaint Resolved ✅</h2>
          <p>Dear <strong>${toName}</strong>,</p>
          <p>We are pleased to inform you that your complaint <strong>#${complaintId}</strong> has been successfully resolved.</p>
          <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #aaa;">Assigned Department:</p>
            <h3 style="margin: 5px 0 0 0; color: #0A84FF;">${department}</h3>
          </div>
          <p>This action has been verified by our field inspectors. You can view the final status in your Citizen Profile.</p>
          <br>
          <p style="color: #888; font-size: 12px;">Thank you for making our city better!<br>— The CivicMatrix Verification Team</p>
        </div>
      `,
    });

    console.log('------------------------------------------------');
    console.log('[EmailService] Gmail Resolution Email Successfully Sent to', toEmail);
    console.log('------------------------------------------------');

  } catch (err) {
    console.error('[EmailService] Error sending email:', err);
  }
}

module.exports = { sendResolutionEmail };
