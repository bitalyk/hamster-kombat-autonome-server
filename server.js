const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');

// Importing services
const shopService = require('./services/shopService'); 
const scheduleService = require('./services/scheduleService');
const taskService = require('./services/taskService');
const cipherService = require('./services/cipherService');
const minigamecandlesService = require('./services/minigamecandlesService');
const minigametilesService = require('./services/minigametilesService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Log file paths
const logFilePath = path.join(__dirname, 'logs', 'logs.txt');
const consoleLogFilePath = path.join(__dirname, 'logs', 'console_logs.txt');

// File paths for sensitive information
const tokenPath = path.join(__dirname, 'token', 'token.txt');
const secretKeyCandlesPath = path.join(__dirname, 'secret-key-candles.txt');
const secretKeyTilesPath = path.join(__dirname, 'secret-key-tiles.txt');
const passwordPath = path.join(__dirname, 'password.txt');

// Clear console logs on server start
fs.writeFileSync(consoleLogFilePath, '');

// Setup logging
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
const consoleLogStream = fs.createWriteStream(consoleLogFilePath, { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));

// Utility function to get current timestamp
function getCurrentTimestamp() {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY format
    return `[${time}, ${date}]`;
}

// Centralized logging function
function logConsoleMessage(message) {
    const timestampedMessage = `${getCurrentTimestamp()} ${message}`;
    console.log(timestampedMessage);
    consoleLogStream.write(`${timestampedMessage}\n`);
}

// Serve static HTML pages
app.get('/logs', (req, res) => res.sendFile(path.join(__dirname, 'public', 'logs.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'settings.html')));
app.get('/schedules', (req, res) => res.sendFile(path.join(__dirname, 'public', 'schedules.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shop.html')));
app.get('/secret-settings', (req, res) => res.sendFile(path.join(__dirname, 'public', 'secret-settings.html')));

// API routes
app.post('/api/set-purchase-limit', (req, res) => {
    const { limit } = req.body;
    if (typeof limit !== 'number' || limit <= 0) {
        return res.status(400).json({ message: 'Invalid limit value. It must be a positive number.' });
    }

    shopService.setPurchaseLimit(limit);
    res.json({ message: `Purchase limit set to ${limit}` });
});

app.get('/api/logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Unable to read general logs' });
        fs.readFile(consoleLogFilePath, 'utf8', (err, consoleData) => {
            if (err) return res.status(500).json({ error: 'Unable to read console logs' });
            res.json({ consoleLogs: consoleData, generalLogs: data });
        });
    });
});

app.post('/api/settings', (req, res) => {
    const { password, taskInterval, cipherInterval, minigameCandlesInterval, minigameTilesInterval } = req.body;
    const storedPassword = fs.readFileSync(passwordPath, 'utf8').trim();

    if (password !== storedPassword) {
        logConsoleMessage('Failed password attempt for settings update.');
        return res.status(403).json({ message: 'Incorrect password. Settings not updated.' });
    }

    scheduleService.updateSettings(
        taskInterval * 1000, 
        cipherInterval * 1000, 
        minigameCandlesInterval * 1000, 
        minigameTilesInterval * 1000
    );
    logConsoleMessage('Settings updated successfully with password protection.');
    res.json({ message: 'Settings updated successfully!' });
});

app.post('/api/start-shop-service', (req, res) => {
    shopService.startShopService();
    res.json({ message: 'Shop service started.' });
});

app.post('/api/stop-shop-service', (req, res) => {
    shopService.stopShopService();
    res.json({ message: 'Shop service stopped.' });
});

app.get('/api/shop-service-status', (req, res) => {
    const status = shopService.isShopServiceRunning() ? 'On' : 'Off';
    res.json({ status });
});

app.get('/api/sync-balance', async (req, res) => {
    try {
        const response = await axios.post(urlSync, {}, {
            headers: { 'Authorization': `Bearer ${fs.readFileSync(tokenPath, 'utf8').trim()}` },
            timeout: 5000
        });
        const balance = Math.floor(response.data.clickerUser.balanceCoins);
        res.json({ balance });
    } catch (error) {
        logConsoleMessage(`Error syncing balance: ${error.message}`);
        res.status(500).json({ error: 'Error syncing balance.' });
    }
});

app.get('/api/fetch-upgrades', async (req, res) => {
    try {
        const response = await axios.post(urlUpgrades, {}, {
            headers: { 'Authorization': `Bearer ${fs.readFileSync(tokenPath, 'utf8').trim()}` },
            timeout: 5000
        });
        const upgrades = response.data.upgradesForBuy;
        res.json({ upgrades });
    } catch (error) {
        logConsoleMessage(`Error fetching upgrades: ${error.message}`);
        res.status(500).json({ error: 'Error fetching upgrades.' });
    }
});

app.post('/api/buy-upgrade', async (req, res) => {
    const { upgradeId } = req.body;
    try {
        await shopService.buyUpgrade(upgradeId);
        res.json({ message: 'Upgrade purchased successfully!' });
    } catch (error) {
        logConsoleMessage(`Error buying upgrade: ${error.message}`);
        res.status(500).json({ error: error.message || 'Error buying upgrade.' });
    }
});

app.post('/api/check-tasks', (req, res) => {
    taskService.checkTasks();
    logConsoleMessage('Task check initiated');
    res.json({ message: 'Task check initiated' });
});

app.post('/api/process-cipher', (req, res) => {
    cipherService.processCipher();
    logConsoleMessage('Cipher processing initiated');
    res.json({ message: 'Cipher processing initiated' });
});

app.post('/api/process-minigame-candles', (req, res) => {
    minigamecandlesService.processMinigameCandles();
    logConsoleMessage('Minigame Candles processing initiated');
    res.json({ message: 'Minigame Candles processing initiated' });
});

app.post('/api/process-minigame-tiles', (req, res) => {
    minigametilesService.processMinigameTiles();
    logConsoleMessage('Minigame Tiles processing initiated');
    res.json({ message: 'Minigame Tiles processing initiated' });
});

app.post('/api/shutdown', (req, res) => {
    logConsoleMessage('Server shutdown initiated via API request.');
    res.json({ message: 'Server is shutting down...' });

    setTimeout(() => {
        process.exit(0); // Exit with success code
    }, 1000);
});

app.listen(PORT, () => {
    logConsoleMessage(`Server running on port ${PORT}`);
    logConsoleMessage(`Next task execution at: ${new Date(scheduleService.getSettings().nextTaskExecution).toLocaleString()}`);
    logConsoleMessage(`Next cipher execution at: ${new Date(scheduleService.getSettings().nextCipherExecution).toLocaleString()}`);
    logConsoleMessage(`Next minigame candles execution at: ${new Date(scheduleService.getSettings().nextMinigameCandlesExecution).toLocaleString()}`);
    logConsoleMessage(`Next minigame tiles execution at: ${new Date(scheduleService.getSettings().nextMinigameTilesExecution).toLocaleString()}`);
    startBackgroundSchedulers(); // Start the background task scheduler
});

// Background schedulers for tasks, cipher, and minigame processing
function startBackgroundSchedulers() {
    setInterval(() => {
        const taskTimeLeft = scheduleService.getTimeLeft();
        if (taskTimeLeft === '00:00:00') {
            taskService.checkTasks();
            logConsoleMessage('Task executed successfully from background scheduler.');
            scheduleService.resetNextExecution();
        }
    }, 1000); // Check every second for tasks

    setInterval(() => {
        const cipherTimeLeft = scheduleService.getCipherTimeLeft();
        if (cipherTimeLeft === '00:00:00') {
            cipherService.processCipher();
            logConsoleMessage('Cipher processed successfully from background scheduler.');
            scheduleService.resetCipherNextExecution();
        }
    }, 1000); // Check every second for cipher processing

    setInterval(() => {
        const minigameCandlesTimeLeft = scheduleService.getMinigameCandlesTimeLeft();
        if (minigameCandlesTimeLeft === '00:00:00') {
            minigamecandlesService.processMinigameCandles();
            logConsoleMessage('Minigame Candles processed successfully from background scheduler.');
            scheduleService.resetMinigameCandlesNextExecution();
        }
    }, 1000); // Check every second for minigame candles processing

    setInterval(() => {
        const minigameTilesTimeLeft = scheduleService.getMinigameTilesTimeLeft();
        if (minigameTilesTimeLeft === '00:00:00') {
            minigametilesService.processMinigameTiles();
            logConsoleMessage('Minigame Tiles processed successfully from background scheduler.');
            scheduleService.resetMinigameTilesNextExecution();
        }
    }, 1000); // Check every second for minigame tiles processing
}
