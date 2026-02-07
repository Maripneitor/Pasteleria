const nodemailer = require('nodemailer');

let transporter = null;

// Determine transport based on env
const createTransport = () => {
    // Return cached if exists
    if (transporter) return transporter;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        console.log(`📧 Using SMTP Transport (${SMTP_HOST})`);
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    } else {
        console.warn('⚠️ SMTP credentials missing. Using MOCK Transport (Logs Only).');
        transporter = {
            sendMail: async (mailOptions) => {
                console.log('--- 📧 MOCK EMAIL SENT ---');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                // console.log('HTML:', mailOptions.html && mailOptions.html.substring(0, 50) + '...');
                return { messageId: 'mock-id-' + Date.now() };
            }
        };
    }
    return transporter;
};

module.exports = createTransport;
