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
    // 🛡️ BLOQUEO DE DESARROLLO (Degradación Elegante)
    if (process.env.NODE_ENV === 'development') {
        console.log('\n=======================================');
        console.log('✉️ [MOCK EMAIL INTERCEPTADO - Entorno DEV]');
        console.log(`Destinatario: ${to}`);
        console.log(`Asunto:       ${subject}`);
        console.log(`Adjuntos:     ${attachments ? attachments.length : 0}`);
        console.log('=======================================\n');

        // Retornamos éxito para que no crashee, pero no mandamos a SMTP
        return { success: true, message: 'Mock email printed to console', messageId: 'mock-id-dev' };
    }

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