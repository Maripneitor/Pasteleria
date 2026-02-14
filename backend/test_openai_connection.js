/**
 * Script de Prueba - Conexión con OpenAI API
 * Ejecutar con: node backend/test_openai_connection.js
 */

const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function testConnection() {
    console.log('🔍 Probando conexión con OpenAI...\n');
    console.log(`Modelo: ${MODEL}`);
    console.log(`API Key: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Faltante'}\n`);

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPEN AI_API_KEY no está configurada en .env');
        process.exit(1);
    }

    try {
        const startTime = Date.now();

        const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: [
                { role: 'user', content: '¿Estás funcionando? Responde brevemente en español.' }
            ],
            max_tokens: 100,
            temperature: 0
        });

        const endTime = Date.now();
        const response = completion.choices[0].message.content;

        console.log('✅ Conexión exitosa con OpenAI\n');
        console.log(`⏱️ Tiempo de respuesta: ${endTime - startTime}ms`);
        console.log(`💬 Respuesta de IA:\n  "${response}"\n`);
        console.log(`📊 Tokens usados: ${completion.usage.total_tokens}`);
        console.log(`   - Prompt: ${completion.usage.prompt_tokens}`);
        console.log(`   - Completion: ${completion.usage.completion_tokens}\n`);

        return true;

    } catch (error) {
        console.error('❌ Error de conexión:\n');

        if (error.status === 401) {
            console.error('  - API Key inválida o revocada');
            console.error('  - Verifica OPENAI_API_KEY en .env');
        } else if (error.status === 429) {
            console.error('  - Límite de rate excedido');
            console.error('  - Espera unos segundos e intenta de nuevo');
        } else if (error.status === 500) {
            console.error('  - Error del servidor de OpenAI');
            console.error('  - Intenta más tarde');
        } else {
            console.error(`  - ${error.message}`);
        }

        return false;
    }
}

// Ejecutar test
testConnection()
    .then(success => {
        if (success) {
            console.log('🎉 Todo funcionando correctamente!');
            process.exit(0);
        } else {
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('💥 Error inesperado:', err);
        process.exit(1);
    });
