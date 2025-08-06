/**
 * Email Utilities
 * Handles sending emails via Nodemailer
 */

const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');
require('dotenv').config();

// Create reusable transporter object
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // Use 'true' if your port is 465 (SSL), 'false' for 587 (TLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      // This is often needed for self-signed certs or specific server configurations.
      // For production, ensure your SMTP server has a valid certificate.
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
});

// Verify transporter connection (good for debugging)
transporter.verify((error) => {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email transporter is ready to send messages');
    }
});

/**
 * Send contact form email or general dynamic email.
 * This function is now designed to accept a formData object that includes:
 * - `to`: The recipient email address (this will be dynamic)
 * - `subject`: The subject of the email (this will be dynamic)
 * - `message`: The main content of the email (this will be dynamic)
 * - `name`: The name associated with the sender/registrant (used in HTML template)
 * - `replyTo`: Optional email address for reply-to header.
 *
 * @param {object} formData - Data containing email details
 * @param {string} formData.to - The recipient's email address.
 * @param {string} formData.subject - The subject line for the email.
 * @param {string} formData.message - The main text content for the email body.
 * @param {string} [formData.name] - Optional name to include in the email's HTML body.
 * @param {string} [formData.replyTo] - Optional email address to set as the 'Reply-To' header.
 * @returns {Promise<void>}
 */
const sendContactEmail = async (formData) => {
    try {
        // --- START DEBUG LOG ---
        console.log(`DEBUG: sendContactEmail received data for recipient: ${formData.email} with subject: "${formData.subject}"`);
        // --- END DEBUG LOG ---

        // Construct the HTML content dynamically based on the passed formData.message
        // This template is generic enough to be used for both admin and user confirmations
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background-color: #2E86AB; color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px; }
                    .content { padding: 20px; background-color: #f9f9f9; border-bottom: 1px solid #eee; }
                    .footer { padding: 15px; text-align: center; font-size: 12px; color: #777; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>${formData.subject}</h2>
                    </div>
                    <div class="content">
                        ${formData.name ? `<p><strong>Name:</strong> ${formData.name}</p>` : ''}
                        <p>${formData.message.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="footer">
                        <p>This email was sent from the Melba Community Service website.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: `"Melba Community Service Website" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: formData.email, // <--- THIS IS THE KEY FIX: Uses the email from formData
            subject: formData.subject, // Uses the subject from formData
            text: htmlToText(htmlContent),
            html: htmlContent, // Uses the dynamically generated HTML content
            replyTo: formData.replyTo || formData.email // Allows reply to sender or the email itself
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${formData.email} with subject: "${formData.subject}"`);
    } catch (err) {
        console.error(`Error sending email to ${formData.email} with subject: "${formData.subject}":`, err);
        throw err;
    }
};

/**
 * Send password reset email
 * This function is a specific wrapper around `sendContactEmail` for password reset functionality.
 * It constructs the HTML content and then calls the generic `sendContactEmail` function.
 *
 * @param {string} email - User's email address to send the reset link to.
 * @param {string} resetToken - The unique token for password reset.
 * @returns {Promise<void>} - A promise that resolves if the email is sent successfully, or rejects on error.
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
                        <p>You requested to reset your password for the Melba Community Service admin panel.</p>
                        <p>Please click the button below to reset your password:</p>
                        <p><a href="${resetUrl}" class="button">Reset Password</a></p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <p><small>This link will expire in 1 hour.</small></p>
                    </div>
                    <div class="footer">
                        <p>Melba Community Service Admin Team</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Use the generic sendContactEmail function
        await sendContactEmail({
            to: email,
            subject: 'Password Reset Request - Melba Community Service Admin',
            html: htmlContent,
            message: `You requested to reset your password for the Melba Community Service admin panel. Please click the button below to reset your password: ${resetUrl}` // Added for text version if htmlToText fails
        });
        console.log('Password reset email sent successfully');
    } catch (err) {
        console.error('Error sending password reset email:', err);
        throw err;
    }
};

module.exports = {
    sendContactEmail, // Export the generic sendContactEmail function
    sendPasswordResetEmail // Keep exporting this specific function if needed for clarity/organization
};
