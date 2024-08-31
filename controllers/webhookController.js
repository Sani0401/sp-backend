import supabase from "../Config/supabaseConfig.js";
import nodemailer from 'nodemailer';
import { config as configDotenv } from 'dotenv';

configDotenv(); 


async function sendEmail(to, subject, text, html) {
    try {
     
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', 
            auth: {
                user: process.env.SMTP_USER, 
                pass: process.env.SMTP_PASS, 
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        
        let mailOptions = {
            from: `"Sani" <${process.env.SMTP_USER}>`, 
            to, 
            subject, 
            text,
            html, 
        };

        let info = await transporter.sendMail(mailOptions);

        console.log('Message sent: %s', info.messageId);
        return info.messageId;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

export default async function webhookController(req, res) {
    try {
        console.log("This is the body data: ",req.body);
        
        const { requestID } = req.body; 
        const { data: fileStatus, error: fileStatusError } = await supabase
            .from('fileStatus')
            .select('file_name, status')
            .eq('request_id', requestID)
            .single();

        if (fileStatusError || !fileStatus) {
            console.error('Error fetching file status:', fileStatusError);
            return res.status(400).json({ message: 'Invalid request ID or error fetching file status' });
        }

        
        if (fileStatus.status === true) {
            
            const emailRecipient = 'sanihussain.work@gmail.com';
            const subject = 'File Processing Complete';
            const text = `The processing of your file "${fileStatus.file_name}" (Request ID: ${requestID}) is complete.`;
            const html = `<p>The processing of your file "<strong>${fileStatus.file_name}</strong>" (Request ID: <strong>${requestID}</strong>) is complete.</p>`;

            try {
                await sendEmail(emailRecipient, subject, text, html);
                console.log('Email sent successfully.');
                return res.status(200).json({ message: 'Email notification sent successfully.' });
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                return res.status(500).json({ message: 'Error sending email notification', error: emailError });
            }
        } else {
            return res.status(200).json({ message: 'Processing not yet complete.' });
        }
    } catch (error) {
        console.error('Error in webhook controller:', error);
        return res.status(500).json({ message: 'Internal server error', error });
    }
}
