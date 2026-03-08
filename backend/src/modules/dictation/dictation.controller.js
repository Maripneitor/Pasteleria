const OpenAI = require('openai');
const { getInitialExtraction } = require('../../../services/aiExtractorService');
const fs = require('fs');
const os = require('os');
const path = require('path');
const asyncHandler = require('../../core/asyncHandler');

let openai;

function getOpenAIClient() {
    if (!openai) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables.');
        }
        openai = new OpenAI();
    }
    return openai;
}

exports.processDictation = asyncHandler(async (req, res) => {
    console.log("🎤 Recibida solicitud para procesar dictado...");

    if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ningún archivo de audio.' });
    }

    let tempFilePath = null;

    try {
        // === 1. Transcribir Audio con Whisper ===
        console.log("Transcribiendo audio con Whisper...");

        tempFilePath = path.join(os.tmpdir(), `dictation-${Date.now()}.webm`);
        await fs.promises.writeFile(tempFilePath, req.file.buffer);

        const client = getOpenAIClient();
        const transcription = await client.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(tempFilePath),
        });

        // Eliminar archivo temporal después de usarlo
        try {
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                await fs.promises.unlink(tempFilePath);
            }
        } catch (unlinkErr) {
            console.warn("No se pudo eliminar el archivo de audio temporal:", unlinkErr.message);
        }

        const transcribedText = transcription.text;
        console.log("Texto Transcrito:", transcribedText);

        if (!transcribedText || transcribedText.trim() === '') {
            throw new Error("La transcripción no produjo texto.");
        }

        // === 2. Extraer Datos con el Servicio Existente ===
        console.log("Extrayendo datos del texto transcrito...");
        const extractedData = await getInitialExtraction(transcribedText);

        res.status(200).json(extractedData);

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { await fs.promises.unlink(tempFilePath); } catch (e) { }
        }
        throw error;
    }
});
