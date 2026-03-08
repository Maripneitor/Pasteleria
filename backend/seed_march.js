require('dotenv').config();
const { sequelize } = require('./config/database');
const FolioService = require('./src/modules/folios/folio.service');
const { Tenant, User, CakeFlavor, Filling } = require('./models');

const generateMockOrders = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Get default tenant
    const tenant = await Tenant.findOne();
    if (!tenant) throw new Error('No tenant found. Please run initial seeder first.');
    const tenantId = tenant.id;

    // Get a user (admin or owner)
    const user = await User.findOne({ where: { tenantId } });
    
    // Get flavors and fillings
    const flavors = await CakeFlavor.findAll({ where: { tenantId } });
    const fillings = await Filling.findAll({ where: { tenantId } });

    if (flavors.length === 0 || fillings.length === 0) {
       console.log("No flavors or fillings found, creating basic ones.");
       await CakeFlavor.create({ name: 'Vainilla', description: 'Vainilla clasica', status: 'Activo', defaultPrice: 100, isPremium: false, tenantId });
       await Filling.create({ name: 'Fresa', description: 'Mermelada', status: 'Activo', defaultPrice: 50, isPremium: false, tenantId });
    }
    
    const flavorId = flavors.length > 0 ? flavors[0].id : null;
    const fillingId = fillings.length > 0 ? fillings[0].id : null;

    const startDate = new Date('2026-03-08');
    const endDate = new Date('2026-03-30');

    let totalCreated = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        console.log(`Generating orders for ${dateStr}...`);
        
        for (let i = 0; i < 5; i++) {
            const timeStr = `${10 + i}:00`; // 10:00 to 14:00
            
            const folioData = {
                tipo_folio: i % 2 === 0 ? 'Normal' : 'Base',
                cliente_nombre: `Cliente Ficticio ${i} - ${dateStr}`,
                cliente_telefono: `555000${Math.floor(1000 + Math.random() * 9000)}`,
                fecha_entrega: dateStr,
                hora_entrega: timeStr,
                costo_base: 500 + (Math.random() * 500),
                anticipo: 250,
                estatus_pago: 'Pendiente',
                estatus_produccion: 'Pendiente',
                flavorIds: flavorId ? [flavorId] : [],
                fillingIds: fillingId ? [fillingId] : [],
                peopleCount: 15 + Math.floor(Math.random() * 20),
                aplicar_comision_cliente: true
            };

            if (folioData.tipo_folio === 'Base') {
                folioData.pisos = [{
                    personas: 10,
                    panes: flavors.length > 0 ? flavors[0].name : 'Vainilla',
                    rellenos: fillings.length > 0 ? fillings[0].name : 'Fresa',
                    notas: 'Forma redonda, piso abajo'
                }, {
                    personas: 15,
                    panes: flavors.length > 1 ? flavors[1].name : 'Chocolate',
                    rellenos: fillings.length > 1 ? fillings[1].name : 'Cajeta',
                    notas: 'Forma cuadrada, piso alto'
                }];
            }

            try {
                // Generar y guardar usando el servicio
                await FolioService.createFolio(folioData, user, tenantId, null);
                totalCreated++;
            } catch (err) {
                console.error(`Error creating order on ${dateStr}:`, err.message);
            }
        }
    }

    console.log(`Success! ${totalCreated} mock orders generated from Mar 08 to Mar 30.`);
    process.exit(0);

  } catch (error) {
    console.error('Error in seeder:', error);
    process.exit(1);
  }
};

generateMockOrders();
