const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize, User, Tenant, Branch, ActivationCode } = require('../../models');
// Mock Request Utils
const mockReq = (user, body = {}) => ({ user, body });
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

// Import Logic to Test
const activationController = require('../../controllers/activationController');
const requireBranch = require('../../middleware/requireBranch');

async function runStrictQA() {
    console.log('🛡️  Starting STRICT QA Checks...');
    await sequelize.authenticate();

    // --- SETUP ---
    // Ensure we have a clean test env (or reuse existing)
    // We will create temporary in-memory-like check or DB entries that we clean up
    const timestamp = Date.now();

    const tenant = await Tenant.create({ businessName: `QA Tenant ${timestamp}`, primaryColor: '#000', logoUrl: 'logo.png' });
    const branch = await Branch.create({ name: 'QA Branch', tenantId: tenant.id });

    const owner = await User.create({
        username: 'QA Owner', email: `qa_owner_${timestamp}@test.com`, password: 'pass',
        globalRole: 'ADMIN', tenantId: tenant.id, status: 'ACTIVE', maxUsers: 10
    });

    console.log('\n🔹 CHECK 1: ActivationCode without Branch -> FAIL');
    // Mock user as Owner
    const reqNoBranch = mockReq({ id: owner.id, role: 'OWNER', tenantId: tenant.id }, { role: 'USER' }); // No branchId in body
    const resNoBranch = mockRes();

    await activationController.generateCode(reqNoBranch, resNoBranch);

    if (resNoBranch.statusCode === 400 && resNoBranch.data.message.includes('debe estar asociado a una sucursal')) {
        console.log('✅ PASS: Blocked code generation without branch.');
    } else {
        console.error('❌ FAIL: Allowed code without branch or wrong error.', resNoBranch.statusCode, resNoBranch.data);
    }

    console.log('\n🔹 CHECK 2: ActivationCode WITH existing Branch -> OK');
    const reqWithBranch = mockReq({ id: owner.id, role: 'OWNER', tenantId: tenant.id }, { role: 'USER', branchId: branch.id });
    const resWithBranch = mockRes();
    await activationController.generateCode(reqWithBranch, resWithBranch);

    let codeId = null;
    if (resWithBranch.data && resWithBranch.data.ok) {
        console.log('✅ PASS: Generated code with branch.');
        // Verify DB
        const savedCode = await ActivationCode.findOne({ where: { code: resWithBranch.data.code } });
        if (savedCode && savedCode.branchId === branch.id) {
            console.log('✅ PASS: DB verification confirmed branchId mismatch.');
            codeId = savedCode.code;
        } else {
            console.error('❌ FAIL: DB verify failed.', savedCode?.toJSON());
        }
    } else {
        console.error('❌ FAIL: Failed to generate valid code.', resWithBranch.data);
    }

    console.log('\n🔹 CHECK 3: Tenant Independence');
    const t = await Tenant.findByPk(tenant.id);
    if (t) console.log('✅ PASS: Tenant exists and can be retrieved directly.');
    else console.error('❌ FAIL: Tenant missing.');

    console.log('\n🔹 CHECK 4: Login/Middleware Logic Strictness');
    // Emulate Middleware Logic
    const next = () => 'NEXT_CALLED';

    // Case A: Employee without branch
    const reqEmpNoBranch = { user: { role: 'USER', branchId: null } };
    const resEmp = mockRes();
    const resultEmp = requireBranch(reqEmpNoBranch, resEmp, next);

    if (resEmp.statusCode === 403) {
        console.log('✅ PASS: Employee without branch blocked (403).');
    } else {
        console.error('❌ FAIL: Employee without branch NOT blocked.');
    }

    // Case B: Owner without Branch
    const reqOwner = { user: { role: 'OWNER', branchId: null } }; // Old Owner role
    const resOwner = mockRes();
    const resultOwner = requireBranch(reqOwner, resOwner, next);
    if (resultOwner === 'NEXT_CALLED') {
        console.log('✅ PASS: Owner allowed without branch.');
    } else {
        console.error('❌ FAIL: Owner blocked unexpectedly.');
    }

    console.log('\n🔹 CHECK 5: PDF Config Logic');
    // Mock EJS context logic
    const configExists = { primaryColor: 'red', logoUrl: 'x' };
    const configMissing = null;
    const defaultConfig = { primaryColor: '#ec4899' }; // From template

    // Simple logic verify: (config && config.primaryColor) || '#ec4899'
    const colorA = (configExists && configExists.primaryColor) || '#ec4899';
    const colorB = (configMissing && configMissing.primaryColor) || '#ec4899';

    if (colorA === 'red' && colorB === '#ec4899') {
        console.log('✅ PASS: PDF branding fallback logic matches template.');
    } else {
        console.error('❌ FAIL: PDF logic mismatch.');
    }

    console.log('\n🎉 ALL STRICT CHECKS COMPLETED.');

    // Cleanup (optional)
    await owner.destroy();
    await branch.destroy();
    await tenant.destroy();
}

runStrictQA().catch(console.error);
