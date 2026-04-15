// backend/scripts/qa/inyectar_borrador_pisos.js
const { Folio, sequelize } = require('../../models'); 

async function runTest() {
    try {
        console.log("🔌 Conectando a la base de datos...");
        await sequelize.authenticate();

        // Creamos un folio simulando que la IA lo acaba de procesar
        const mockFolio = await Folio.create({
            cliente_nombre: "Dev Tester (Pisos)",
            cliente_telefono: "9610000000",
            fecha_entrega: "2026-12-31",
            hora_entrega: "15:00",
            numero_personas: 50,
            forma: "Redondo",
            tipo_folio: "Base/Especial",
            is_delivery: false,
            ubicacion_entrega: "Sucursal",
            
            // 🔥 AQUÍ ESTÁ LA CARGA ÚTIL QUE ESTAMOS PROBANDO EN REACT
            detallesPisos: [
                { personas: "20", panes: ["Vainilla"], rellenos: ["Fresa", "Cajeta"], notas: "Piso base color rosa" },
                { personas: "20", panes: ["Chocolate"], rellenos: ["Nutella"], notas: "Piso del medio con chispas" },
                { personas: "10", panes: ["Zanahoria"], rellenos: ["Queso Crema"], notas: "Piso superior, liso" }
            ],
            
            origen: 'WhatsApp Bot',
            status: 'DRAFT', // Estado clave para que el frontend lo levante en el Wizard
            estatus_produccion: 'Pendiente',
            estatus_pago: 'Pendiente',
            tenantId: 1
        });

        console.log(`\n✅ ¡Borrador inyectado con éxito!`);
        console.log(`🎂 Folio ID: #${mockFolio.id}`);
        console.log(`🚀 Siguiente paso: Ve a tu Frontend, busca los folios en Borrador (Draft), abre el #${mockFolio.id} y verifica que el StepB lea los 3 pisos correctamente.\n`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Error inyectando la prueba:", error);
        process.exit(1);
    }
}

runTest();