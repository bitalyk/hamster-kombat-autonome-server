const express = require('express');
const scheduleService = require('../services/scheduleService');

const router = express.Router();

// Get current settings
router.get('/', (req, res) => {
    res.json(scheduleService.getSettings());
});

// Update settings
router.post('/', (req, res) => {
    const { interval, startTime } = req.body;
    scheduleService.updateSettings(interval, startTime);
    res.json({ message: 'Settings updated' });
});

module.exports = router;
