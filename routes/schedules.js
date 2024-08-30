const express = require('express');
const scheduleService = require('../services/scheduleService');

const router = express.Router();

// Get time left until next execution
router.get('/', (req, res) => {
    const timeLeft = scheduleService.getTimeLeft();
    res.json({ timeLeft });
});

module.exports = router;
