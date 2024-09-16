const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const axios = require('axios');
const shopService = require('./services/shopService'); // Import the shop service
const scheduleService = require('./services/scheduleService');
const taskService = require('./services/taskService');
const cipherService = require('./services/cipherService');
const minigamecandlesService = require('./services/minigamecandlesService');
const minigametilesService = require('./services/minigametilesService');


const app = express();
const PORT = process.env.PORT || 3000;

// Define API endpoints for the shop service
const urlSync = 'https://api.hamsterkombatgame.io/clicker/sync';
const urlUpgrades = 'https://api.hamsterkombatgame.io/clicker/upgrades-for-buy';
const urlBuyUpgrade = 'https://api.hamsterkombatgame.io/clicker/buy-upgrade';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define log file paths
const logFilePath = path.join(__dirname, 'logs', 'logs.txt');
const consoleLogFilePath = path.join(__dirname, 'logs', 'console_logs.txt');

// File paths for secret keys, token, and password
const tokenPath = path.join(__dirname, 'token', 'token.txt');
const secretKeyCandlesPath = path.join(__dirname, 'secret-key-candles.txt');
const secretKeyTilesPath = path.join(__dirname, 'secret-key-tiles.txt');
const passwordPath = path.join(__dirname, 'password.txt');

// Clear console logs on server start
fs.writeFileSync(consoleLogFilePath, '');

// Logging
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
const consoleLogStream = fs.createWriteStream(consoleLogFilePath, { flags: 'a' });

app.use(morgan('combined', { stream: logStream }));

// Function to get current timestamp
function getCurrentTimestamp() {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0]; // HH:MM:SS format
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY format
    return `[${time}, ${date}]`;
}

// Centralized logging function for console logs
function logConsoleMessage(message) {
    const timestampedMessage = `${getCurrentTimestamp()} ${message}`;
    console.log(timestampedMessage);
    consoleLogStream.write(`${timestampedMessage}\n`);
}

// Routes for serving HTML pages
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/schedules', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'schedules.html'));
});

app.get('/shop', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

// Serve the secret settings page
app.get('/secret-settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'secret-settings.html'));
});

app.post('/api/set-secret-keys', (req, res) => {
    const { bearerToken } = req.body;
  
    // Define the path to the 'token' directory and 'token.txt' file
    const tokenDir = path.join(__dirname, 'token');
    const tokenFilePath = path.join(tokenDir, 'token.txt');
  
    // Ensure the 'token' directory exists
    if (!fs.existsSync(tokenDir)) {
      fs.mkdirSync(tokenDir, { recursive: true });
    }
  
    // Write the 'bearerToken' to 'token.txt'
    fs.writeFile(tokenFilePath, bearerToken, (err) => {
      if (err) {
        console.error('Error writing bearer token to file:', err);
        res.status(500).json({ message: 'Failed to store the bearer token.' });
      } else {
        console.log('Bearer token stored successfully at', tokenFilePath);
        res.json({ message: 'Bearer token set successfully!' });
      }
    });
  });

// Endpoint to set the purchase limit
app.post('/api/set-purchase-limit', (req, res) => {
    const { limit } = req.body;
    if (typeof limit !== 'number' || limit <= 0) {
        return res.status(400).json({ message: 'Invalid limit value. It must be a positive number.' });
    }

    shopService.setPurchaseLimit(limit);
    res.json({ message: `Purchase limit set to ${limit}` });
});

// API Route to fetch logs
app.get('/api/logs', (req, res) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read general logs' });
        }
        fs.readFile(consoleLogFilePath, 'utf8', (err, consoleData) => {
            if (err) {
                return res.status(500).json({ error: 'Unable to read console logs' });
            }
            res.json({ consoleLogs: consoleData, generalLogs: data });
        });
    });
});

// API Route to update settings
app.post('/api/settings', (req, res) => {
    const { password, taskInterval, cipherInterval, minigameCandlesInterval, minigameTilesInterval } = req.body;

    const storedPassword = fs.readFileSync(passwordPath, 'utf8').trim();

    if (password !== storedPassword) {
        logConsoleMessage('Failed password attempt for settings update.');
        return res.status(403).json({ message: 'Incorrect password. Settings not updated.' });
    }

    scheduleService.updateSettings(taskInterval * 1000, cipherInterval * 1000, minigameCandlesInterval * 1000, minigameTilesInterval * 1000);
    logConsoleMessage('Settings updated successfully with password protection.');
    res.json({ message: 'Settings updated successfully!' });
});

// API Route to start the shop service
app.post('/api/start-shop-service', (req, res) => {
    shopService.startShopService();
    res.json({ message: 'Shop service started.' });
});

// API Route to stop the shop service
app.post('/api/stop-shop-service', (req, res) => {
    shopService.stopShopService();
    res.json({ message: 'Shop service stopped.' });
});

// API Route to get the status of the shop service
app.get('/api/shop-service-status', (req, res) => {
    const status = shopService.isShopServiceRunning() ? 'On' : 'Off';
    res.json({ status });
});

// API Route to sync balance (for shop UI)
app.get('/api/sync-balance', async (req, res) => {
    try {
        const response = await axios.post(urlSync, {}, {
            headers: {
                'Authorization': `Bearer ${fs.readFileSync(tokenPath, 'utf8').trim()}`
            },
            timeout: 5000
        });
        const balance = Math.floor(response.data.clickerUser.balanceCoins);
        res.json({ balance });
    } catch (error) {
        logConsoleMessage(`Error syncing balance: ${error.message}`);
        res.status(500).json({ error: 'Error syncing balance.' });
    }
});

// API Route to fetch upgrades (for shop UI)
app.get('/api/fetch-upgrades', async (req, res) => {
    try {
        const response = await axios.post(urlUpgrades, {}, {
            headers: {
                'Authorization': `Bearer ${fs.readFileSync(tokenPath, 'utf8').trim()}`
            },
            timeout: 5000
        });
        const upgrades = response.data.upgradesForBuy;
        res.json({ upgrades });
    } catch (error) {
        logConsoleMessage(`Error fetching upgrades: ${error.message}`);
        res.status(500).json({ error: 'Error fetching upgrades.' });
    }
});

// API Route to buy an upgrade (for shop UI)
app.post('/api/buy-upgrade', async (req, res) => {
    const { upgradeId } = req.body; // Extract upgradeId from request body
    try {
        await shopService.buyUpgrade(upgradeId); // Use the imported function
        res.json({ message: 'Upgrade purchased successfully!' });
    } catch (error) {
        logConsoleMessage(`Error buying upgrade: ${error.message}`);
        // Send the specific error message back to the client
        res.status(500).json({ error: error.message || 'Error buying upgrade.' });
    }
});



// API Route to check tasks (can be triggered manually)
app.post('/api/check-tasks', (req, res) => {
    taskService.checkTasks();
    logConsoleMessage('Task check initiated');
    res.json({ message: 'Task check initiated' });
});

// API Route to process cipher (can be triggered manually)
app.post('/api/process-cipher', (req, res) => {
    cipherService.processCipher();
    logConsoleMessage('Cipher processing initiated');
    res.json({ message: 'Cipher processing initiated' });
});

// API Route to process minigame candles (can be triggered manually)
app.post('/api/process-minigame-candles', (req, res) => {
    minigamecandlesService.processMinigameCandles();
    logConsoleMessage('Minigame Candles processing initiated');
    res.json({ message: 'Minigame Candles processing initiated' });
});

// API Route to process minigame tiles (can be triggered manually)
app.post('/api/process-minigame-tiles', (req, res) => {
    minigametilesService.processMinigameTiles();
    logConsoleMessage('Minigame Tiles processing initiated');
    res.json({ message: 'Minigame Tiles processing initiated' });
});

// API Route to shutdown the server
app.post('/api/shutdown', (req, res) => {
    logConsoleMessage('Server shutdown initiated via API request.');
    res.json({ message: 'Server is shutting down...' });

    // Allow some time for the response to be sent before shutting down
    setTimeout(() => {
        process.exit(0); // Exit with success code
    }, 1000);
});

// Start Server
app.listen(PORT, () => {
    logConsoleMessage(`Server running on port ${PORT}`);
    logConsoleMessage(`Next task execution at: ${new Date(scheduleService.getSettings().nextTaskExecution).toLocaleString()}`);
    logConsoleMessage(`Next cipher execution at: ${new Date(scheduleService.getSettings().nextCipherExecution).toLocaleString()}`);
    logConsoleMessage(`Next minigame candles execution at: ${new Date(scheduleService.getSettings().nextMinigameCandlesExecution).toLocaleString()}`);
    logConsoleMessage(`Next minigame tiles execution at: ${new Date(scheduleService.getSettings().nextMinigameTilesExecution).toLocaleString()}`);
    startBackgroundSchedulers(); // Start the background task scheduler
});

// Background schedulers to execute tasks, cipher, and minigame processing at set intervals
function startBackgroundSchedulers() {
    setInterval(() => {
        const taskTimeLeft = scheduleService.getTimeLeft();
        if (taskTimeLeft === '00:00:00') {
            taskService.checkTasks();
            logConsoleMessage('Task executed successfully from background scheduler.');
            scheduleService.resetNextExecution(); // Reset the task execution time
        }
    }, 1000); // Check every second for tasks

    setInterval(() => {
        const cipherTimeLeft = scheduleService.getCipherTimeLeft();
        if (cipherTimeLeft === '00:00:00') {
            cipherService.processCipher();
            logConsoleMessage('Cipher processed successfully from background scheduler.');
            scheduleService.resetCipherNextExecution(); // Reset the cipher execution time
        }
    }, 1000); // Check every second for cipher processing

    setInterval(() => {
        const minigameCandlesTimeLeft = scheduleService.getMinigameCandlesTimeLeft();
        if (minigameCandlesTimeLeft === '00:00:00') {
            minigamecandlesService.processMinigameCandles();
            logConsoleMessage('Minigame Candles processed successfully from background scheduler.');
            scheduleService.resetMinigameCandlesNextExecution(); // Reset the minigame candles execution time
        }
    }, 1000); // Check every second for minigame candles processing

    setInterval(() => {
        const minigameTilesTimeLeft = scheduleService.getMinigameTilesTimeLeft();
        if (minigameTilesTimeLeft === '00:00:00') {
            minigametilesService.processMinigameTiles();
            logConsoleMessage('Minigame Tiles processed successfully from background scheduler.');
            scheduleService.resetMinigameTilesNextExecution(); // Reset the minigame tiles execution time
        }
    }, 1000); // Check every second for minigame tiles processing
}