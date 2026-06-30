import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendPaymentAdminAlert = async (
  orderId: string,
  amount: number,
  customerName: string,
  customerEmail: string,
  customerPhone: string
) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!adminEmail) {
      console.warn('No ADMIN_EMAIL or SMTP_USER defined. Skipping payment alert.');
      return;
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #8b5cf6; margin: 0;">ResinVerse</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Payment Received Successfully 🎉</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Order Summary</h2>
          <table style="width: 100%; text-align: left; border-collapse: collapse;">
            <tr>
              <th style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Order ID</th>
              <td style="padding: 8px 0; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0;">#${orderId.slice(-6).toUpperCase()}</td>
            </tr>
            <tr>
              <th style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #e2e8f0;">Total Amount</th>
              <td style="padding: 8px 0; font-weight: bold; color: #10b981; border-bottom: 1px solid #e2e8f0;">₹${amount.toFixed(2)}</td>
            </tr>
            <tr>
              <th style="padding: 8px 0; color: #64748b;">Status</th>
              <td style="padding: 8px 0; font-weight: bold; color: #8b5cf6;">PAID</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
          <h2 style="color: #0f172a; font-size: 20px; margin-top: 0;">Customer Details</h2>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #3b82f6;">${customerEmail}</a></p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/admin" style="background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View in Admin Panel</a>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: \`"ResinVerse Alerts" <\${process.env.SMTP_USER}>\`,
      to: adminEmail,
      subject: \`💰 Payment Received! Order #\${orderId.slice(-6).toUpperCase()} - ₹\${amount}\`,
      html: htmlContent,
    });

    console.log('Payment alert email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send payment alert email:', error);
  }
};
