const { sequelize, User, AuditLog, UserSession } = require('../models');

async function dumpAuthData() {
    try {
        console.log("--- CREDENTIALS (Seeded) ---");
        console.log("SuperAdmin 1: admin@gmail.com / Admin1234");
        console.log("SuperAdmin 2: mario@dev.com / mario123");
        console.log("Owner: owner@demo.com / admin123");
        console.log("Employee: empleado@demo.com / admin123");
        console.log("\n--- USERS IN DATABASE ---");
        const users = await User.findAll();
        users.forEach(u => {
            console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | Tenant: ${u.tenantId}`);
        });

        console.log("\n--- LATEST SESSIONS ---");
        const sessions = await UserSession.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['email'] }]
        });
        sessions.forEach(s => {
            console.log(`User: ${s.user ? s.user.email : 'Unknown'} | IP: ${s.ip} | Active: ${s.isActive} | Device: ${s.deviceInfo} | Last Seen: ${s.lastSeenAt}`);
        });

        console.log("\n--- LATEST AUDIT LOGS ---");
        const logs = await AuditLog.findAll({
            limit: 20,
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'actor', attributes: ['email'] }]
        });
        logs.forEach(l => {
            const userEmail = l.actor ? l.actor.email : (l.actorUserId || 'System');
            console.log(`Time: ${l.createdAt} | User: ${userEmail} | Action: ${l.action} | Entity: ${l.entity} (${l.entityId}) | Meta: ${JSON.stringify(l.meta)}`);
        });

        process.exit(0);
    } catch (e) {
        console.error("Dump failed:", e);
        process.exit(1);
    }
}

dumpAuthData();
