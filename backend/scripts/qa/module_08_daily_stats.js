const { sequelize } = require('../../models');
const { DailySalesStats, Branch } = require('../../models');
const orderFlowService = require('../../services/orderFlowService');
const { chalk, ok, fail, section, getExitCode } = require('./_report');
require('dotenv').config({ path: '../../.env' });

// Mock Users
const ownerUser = { id: 3, tenantId: 3, branchId: 100, role: 'OWNER', globalRole: 'OWNER' }; // Tenant 3
const folioPrefix = `STATS-${Date.now()}`;

async function runTests() {
    section('MODULE 08: DAILY SALES STATS');

    await sequelize.authenticate();

    // Ensure Branch Exist (FK)
    let branch = await Branch.findByPk(100);
    if (!branch) {
        // Create dummy branch logic if needed, or disable FK checks? 
        // Assuming DB might not have branch 100.
        // Let's create it.
        // Need a Tenant 3 first?
    }

    // Actually, let's use Tenant 1 and existing branches from initProject?
    // InitProject creates Tenant 1, Branch 1.
    // Let's use Tenant 1, Branch 1.
    const realUser = { id: 1, tenantId: 1, branchId: 1, role: 'OWNER' };

    // Clean Stats for today (to be deterministic)
    const mxDate = new Date().toLocaleString("en-CA", { timeZone: "America/Mexico_City" }).split(',')[0];
    await DailySalesStats.destroy({ where: { date: mxDate, tenantId: 1 } });

    console.log(chalk.blue('🔹 Test 1: Register Sales'));

    // Order 1: $100
    let f1 = await orderFlowService.createDraft({
        folioNumber: `${folioPrefix}-1`,
        cliente_nombre: 'Stats Tester 1',
        cliente_telefono: '000',
        total: 100.00
    }, realUser);
    f1 = await orderFlowService.confirmOrder(f1.id, realUser); // Counts as 1

    // Order 2: $250
    let f2 = await orderFlowService.createDraft({
        folioNumber: `${folioPrefix}-2`,
        cliente_nombre: 'Stats Tester 2',
        cliente_telefono: '000',
        total: 250.00
    }, realUser);
    f2 = await orderFlowService.confirmOrder(f2.id, realUser); // Counts as 2

    // Verify Stats
    const stats = await DailySalesStats.findOne({
        where: { date: mxDate, tenantId: 1, branchId: 1 }
    });

    if (stats) {
        if (stats.ordersCount === 2 && Number(stats.totalSales) === 350.00) {
            ok(`Stats Correct: 2 Orders, $350 Total`);
        } else {
            fail(`Stats Mismatch. Expected 2/$350. Got ${stats.ordersCount}/${stats.totalSales}`);
        }
    } else {
        fail('No Stats Entry Created');
    }

    // Cleanup
    await f1.destroy();
    await f2.destroy();
}

runTests().then(() => {
    process.exit(getExitCode());
});
