const { sequelize } = require('../../models');
const Folio = require('../../models/Folio');
const orderFlowService = require('../../services/orderFlowService');
const auditService = require('../../services/auditService');
const { chalk, ok, fail, section, getExitCode } = require('./_report');
require('dotenv').config({ path: '../../.env' });

// Mock User
const mockUser = { id: 1, tenantId: 1, branchId: 1 };

async function runTests() {
    section('MODULE 05: ORDER ATOMICITY & FLOW');

    await sequelize.authenticate();

    // ---------------------------------------------------------
    // TEST 1: ROLLBACK (Atomicity)
    // ---------------------------------------------------------
    console.log(chalk.blue('🔹 Test 1: Atomicity / Rollback'));

    // 1. Snapshot count
    const initialCount = await Folio.count();
    const testFolioNum = 'ATOM-TEST-' + Date.now();

    // 2. Monkey Patch auditService to fail
    const originalLog = auditService.log;
    let patchApplied = false;

    // We override the export property
    auditService.log = async (...args) => {
        // If args match our test, throw
        if (args[0] === 'CREATE_DRAFT' && args[3]?.folioNumber === testFolioNum) {
            console.log(chalk.yellow('   -> Simulating crash in AuditLog...'));
            throw new Error('Simulated Crash during Transaction');
        }
        return originalLog(...args); // Fallback
    };
    patchApplied = true;

    try {
        await orderFlowService.createDraft({
            folioNumber: testFolioNum,
            cliente_nombre: 'Atomicity Tester',
            cliente_telefono: '000'
        }, mockUser);
        fail('Should have thrown an error but succeeded');
    } catch (e) {
        if (e.message === 'Simulated Crash during Transaction') {
            ok('Transaction failed as expected');
        } else {
            if (e.errors) console.log(chalk.red('Detail:', JSON.stringify(e.errors, null, 2)));
            fail('Transaction failed with unexpected error', e);
        }
    } finally {
        // Restore
        auditService.log = originalLog;
    }

    // 3. Verify DB (Should be 0 changes)
    const afterCount = await Folio.count();
    const foundZombie = await Folio.findOne({ where: { folioNumber: testFolioNum } });

    if (!foundZombie && afterCount === initialCount) {
        ok('Rollback verified: No Folio created in DB');
    } else {
        fail(`Rollback FAILED. Zombie ID: ${foundZombie?.id}, Count Diff: ${afterCount - initialCount}`);
    }


    // ---------------------------------------------------------
    // TEST 2: ALLOWED TRANSITIONS (Machine State)
    // ---------------------------------------------------------
    console.log(chalk.blue('🔹 Test 2: Machine State Transitions'));

    // 1. Create Real Draft
    let folio;
    try {
        folio = await orderFlowService.createDraft({
            folioNumber: 'FLOW-' + Date.now(),
            cliente_nombre: 'Flow Tester',
            cliente_telefono: '111'
        }, mockUser);
        ok(`Draft Created (Status: ${folio.status})`);
    } catch (e) {
        fail('Failed to create setup Draft', e);
        return;
    }

    // 2. Draft -> Confirmed (OK)
    try {
        folio = await orderFlowService.confirmOrder(folio.id, mockUser);
        if (folio.status === 'CONFIRMED') ok('Transition DRAFT -> CONFIRMED passed');
        else fail('Transition DRAFT -> CONFIRMED failed state check');
    } catch (e) {
        fail('Transition DRAFT -> CONFIRMED threw error', e);
    }

    // 3. Confirmed -> Draft (FAIL)
    try {
        await orderFlowService.transitionStatus(folio.id, 'DRAFT', mockUser);
        fail('Invalid Transition CONFIRMED -> DRAFT succeeded (Should Fail)');
    } catch (e) {
        ok('Invalid Transition CONFIRMED -> DRAFT blocked correctly');
    }

    // 4. Confirmed -> Cancelled (OK)
    try {
        folio = await orderFlowService.transitionStatus(folio.id, 'CANCELLED', mockUser);
        if (folio.status === 'CANCELLED') ok('Transition CONFIRMED -> CANCELLED passed');
    } catch (e) {
        fail('Transition CONFIRMED -> CANCELLED threw error', e);
    }

    // 5. Cancelled -> Released? (FAIL)
    try {
        await orderFlowService.transitionStatus(folio.id, 'DELIVERED', mockUser);
        fail('Invalid Transition CANCELLED -> DELIVERED succeeded (Should Fail)');
    } catch (e) {
        ok('Invalid Transition CANCELLED -> DELIVERED blocked correctly');
    }

    // Cleanup
    if (folio) await folio.destroy();
}

runTests().then(() => {
    process.exit(getExitCode());
});
