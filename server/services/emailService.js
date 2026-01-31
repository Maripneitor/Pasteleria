const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendEmail = async ({ to, subject, html, attachments = [] }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Pastelería La Fiesta" <no-reply@pasteleria.com>',
            to,
            subject,
            html,
            attachments,
        });
        console.log('📧 Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
};