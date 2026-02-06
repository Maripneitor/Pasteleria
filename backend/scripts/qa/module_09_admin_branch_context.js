const { requestJson } = require('./_http');
const { section, ok, fail } = require('./_report');
const { User } = require('../../models');

// QA Module 09: Admin Branch Context & Strictness
// Goal: Verify Admin CANNOT operate without branchId, but OWNER/SUPER_ADMIN can.

(async () => {
    section('MODULE 09: STRICT BRANCH LOGIC');

    // 0. Setup: Ensure Admin has a branch (as seed might leave it null)
    try {
        const adminUser = await User.findOne({ where: { email: 'admin@gmail.com' } });
        if (adminUser) {
            await adminUser.update({ branchId: 1 });
            console.log('✓ Admin assigned to Branch 1 for testing');
        }
    } catch (e) {
        console.error('Setup failed:', e);
    }

    // 1. Authenticate as Admin (Seeded Admin should have branchId=1)
    console.log('1. Testing Seeded Admin (Expected: Branch Assigned)');
    const adminLogin = await requestJson({
        method: 'POST',
        url: '/api/auth/login',
        body: {
            email: 'admin@gmail.com',
            password: 'Admin1234' // Matches initProject.js
        }
    });

    if (adminLogin.status !== 200) {
        console.error('Login Status:', adminLogin.status);
        console.error('Login Body:', JSON.stringify(adminLogin.data));
        fail('Admin login failed');
        process.exit(1);
    }
    const token = adminLogin.data.token;

    // 2. Verify Access to Branch-Protected Endpoint
    // Endpoint: /api/cash/status usually requires branch
    const cashStatus = await requestJson({
        method: 'GET',
        url: '/api/cash/status',
        token: token
    });
    if (cashStatus.status === 200) {
        ok('Admin with Branch can access /api/cash/status');
    } else {
        fail(`Admin with Branch FAILED access /api/cash/status (Status: ${cashStatus.status})`);
    }

    // 3. Create "Floating Admin" (No Branch) -> Should be Blocked
    console.log('2. Testing Floating Admin (No Branch)');
    try {
        const adminUser = await User.findOne({ where: { email: 'admin@gmail.com' } });
        const originalBranch = adminUser.branchId;

        await adminUser.update({ branchId: null });

        const loginNoBranch = await requestJson({
            method: 'POST',
            url: '/api/auth/login',
            body: {
                email: 'admin@gmail.com',
                password: 'Admin1234'
            }
        });
        const tokenNoBranch = loginNoBranch.data.token;

        // Try Access
        const blockedReq = await requestJson({
            method: 'GET',
            url: '/api/cash/status',
            token: tokenNoBranch
        });

        if (blockedReq.status === 403) {
            ok('Floating Admin BLOCKED (403) as expected');
        } else {
            fail(`Floating Admin NOT BLOCKED! Status: ${blockedReq.status}`);
        }

        // Restore Admin
        await adminUser.update({ branchId: originalBranch });
        ok('Admin restored');

    } catch (e) {
        console.error(e);
        fail('Exception during Free Admin Test');
        // Restore just in case
        const adminUser = await User.findOne({ where: { email: 'admin@gmail.com' } });
        if (adminUser) await adminUser.update({ branchId: 1 });
    }

    // 4. Test Super Admin (Should Bypass)
    console.log('3. Testing Super Admin (Bypass)');
    const superLogin = await requestJson({
        method: 'POST',
        url: '/api/auth/login',
        body: {
            email: 'mario@dev.com',
            password: 'commario123'
        }
    });

    if (superLogin.status === 200) {
        const tokenSuper = superLogin.data.token;
        const superReq = await requestJson({
            method: 'GET',
            url: '/api/users',
            token: tokenSuper
        });
        if (superReq.status === 200) {
            ok('Super Admin Bypassed Check');
        } else {
            const superCash = await requestJson({
                method: 'GET',
                url: '/api/cash/status',
                token: tokenSuper
            });
            if (superCash.status === 200 || superCash.status === 400) {
                ok('Super Admin Bypassed Middleware');
            } else {
                fail(`Super Admin Blocked? Status: ${superCash.status}`);
            }
        }
    } else {
        console.log('Skipping Super Admin check - Creds invalid or user missing');
    }

    process.exit(0);
})();
