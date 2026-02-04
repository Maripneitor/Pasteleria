require('dotenv').config({ path: '.env' }); // Assumes execution from server root
const nodemailer = require('nodemailer');

async function testSmtp() {
    console.log('Testing SMTP Connection...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Verified Successfully!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:', error.message);
        process.exit(1);
    }
}

testSmtp();
