import nodemailer from 'nodemailer';
import { config as configDotenv } from 'dotenv';

configDotenv(); // Load environment variables

// Function to send an email
export async function sendEmail(to, subject, text, html) {
    try {
        // Create a transporter object using SMTP transport
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER, // SMTP user
                pass: process.env.SMTP_PASS, // SMTP password
            },
        });

        // Set up email data
        let mailOptions = {
            from: `"Your Name" <${process.env.SMTP_USER}>`, // Sender address
            to, // List of recipients
            subject, // Subject line
            text, // Plain text body
            html, // HTML body
        };

        // Send email with defined transport object
        let info = await transporter.sendMail(mailOptions);

        console.log('Message sent: %s', info.messageId);
        return info.messageId;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
