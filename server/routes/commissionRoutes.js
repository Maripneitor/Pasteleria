const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', (req, res) => {
    // Placeholder for commissions report
    res.json({
        period: 'Current Month',
        totalCommissions: 1500.00,
        details: []
    });
});

module.exports = router;
