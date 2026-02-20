const nodemailer = require('nodemailer');

/**
 * Sends a PDF report via email.
 * Recieves a file via multer (memory storage) and destination email.
 */
exports.sendBalanceEmail = async (req, res) => {
    try {
        const pdfFile = req.file; // Provided by multer
        const { emailDestino, fecha, titulo } = req.body;

        if (!pdfFile) {
            return res.status(400).json({ message: 'No se recibió el archivo PDF' });
        }

        // Configuration using environment variables for security
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const reportTitle = titulo || 'Reporte de Balance General';

        const mailOptions = {
            from: `"Pastelería La Fiesta" <${process.env.EMAIL_USER}>`,
            to: emailDestino,
            subject: `${reportTitle} - ${fecha || new Date().toLocaleDateString()}`,
            text: `Hola, adjuntamos el reporte contable generado el día ${fecha || new Date().toLocaleDateString()}.`,
            attachments: [
                {
                    filename: `Reporte_${fecha || 'digital'}.pdf`,
                    content: pdfFile.buffer
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ ok: true, message: 'Correo enviado con éxito' });

    } catch (error) {
        console.error('[Email Controller] Error:', error);
        res.status(500).json({
            ok: false,
            message: 'Error al enviar correo',
            details: error.message
        });
    }
};
