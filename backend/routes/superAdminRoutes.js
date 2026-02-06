const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleCheck = (role) => (req, res, next) => {
    if (req.user && req.user.globalRole === role) return next();
    return res.status(403).json({ message: 'Forbidden' });
};

router.use(authMiddleware);
router.use(roleCheck('SUPER_ADMIN'));

router.get('/saas/ledger', superAdminController.getLedger);
router.get('/saas/alerts', superAdminController.getAlerts);

module.exports = router;
