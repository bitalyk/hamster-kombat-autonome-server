const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all logs since server started
router.get('/', (req, res) => {
    const logPath = path.join(__dirname, '..', 'logs', 'logs.txt');
    fs.readFile(logPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read logs' });
        }
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

module.exports = router;
 