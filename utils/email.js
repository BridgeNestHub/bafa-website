/**
 * Email Utilities
 * Handles sending emails via Nodemailer
 */

const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

// Temporarily comment this out to prevent a startup crash.
// We will uncomment this once the EMAIL_PASSWORD is correct.
// transporter.verify((error) => {
//     if (error) {
//         console.error('Email transporter verification failed:', error);
//     } else {
//         console.log('Email transporter is ready to send messages');
//     }
// });

/**
 * Send contact form email
 * @param {object} formData - Contact form data
 * @param {string} formData.name - Sender's name
 * @param {string} formData.email - Sender's email
 * @param {string} formData.message - Message content
 * @returns {Promise<void>}
 */
const sendContactEmail = async (formData) => {
    try {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2E86AB; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #777; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>New Contact Message from BAFA Website</h2>
                    </div>
                    <div class="content">
                        <p><strong>Name:</strong> ${formData.name}</p>
                        <p><strong>Email:</strong> ${formData.email}</p>
                        <p><strong>Message:</strong></p>
                        <p>${formData.message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the BAFA website contact form.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"BAFA Website" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            subject: `New Contact Message from ${formData.name}`,
            text: htmlToText(htmlContent),
            html: htmlContent,
            replyTo: formData.email
        };

        await transporter.sendMail(mailOptions);
        console.log('Contact email sent successfully');
    } catch (err) {
        console.error('Error sending contact email:', err);
        throw err;
    }
};

/**
 * Send password reset email
 * @param {object} user - User object
 * @param {string} resetToken - Password reset token
 * @returns {Promise<void>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
    try {
        const resetUrl = `${process.env.BASE_URL}/admin/reset-password?token=${resetToken}`;
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2E86AB; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #2E86AB; color: white; text-decoration: none; border-radius: 5px; }
                    .footer { padding: 10px; text-align: center; font-size: 12px; color: #777; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Password Reset Request</h2>
                    </div>
                    <div class="content">
                        <p>You requested to reset your password for the BAFA admin panel.</p>
                        <p>Please click the button below to reset your password:</p>
                        <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p><small>This link will expire in 1 hour.</small></p>
                    </div>
                    <div class="footer">
                        <p>BAFA Admin Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"BAFA Admin" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset Request - BAFA Admin',
            text: htmlToText(htmlContent),
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent successfully');
    } catch (err) {
        console.error('Error sending password reset email:', err);
        throw err;
    }
};

module.exports = {
    sendContactEmail,
    sendPasswordResetEmail
};
