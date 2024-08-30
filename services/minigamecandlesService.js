const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Paths to read the token and secret key for the minigame
const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const secretKeyCandlesPath = path.join(__dirname, '..', 'secret-key-candles.txt');

// Read the token and secret key from files
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const secretKey = fs.readFileSync(secretKeyCandlesPath, 'utf8').trim();

// API URLs
const startMinigameUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
const claimMinigameUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

// Centralized logging function for console logs
function logConsoleMessage(message) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timestampedMessage = `[${time}, ${date}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync('logs/console_logs.txt', `${timestampedMessage}\n`);
}

const processMinigameCandles = async () => {
    if (!secretKey) {
        logConsoleMessage('Secret key for Candles not set. Please set it in /secret-settings.');
        return;
    }

    logConsoleMessage('Minigame Candles processing initiated.');

    const startRequestBody = {
        miniGameId: 'Candles' // Starting the minigame for Candles
    };

    try {
        // Step 1: Start the minigame
        const startResponse = await axios.post(startMinigameUrl, startRequestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        logConsoleMessage('Minigame Candles started successfully.');

        // Step 2: Send a single claim request
        const claimRequestBody = {
            cipher: secretKey,
            miniGameId: 'Candles' // Specify the minigame ID as 'Candles'
        };

        const response = await axios.post(claimMinigameUrl, claimRequestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        if (data.error_code === "DAILY_KEYS_MINI_GAME_DOUBLE_CLAIMED" || data.error_message === "DailyKeysMiniGameAlreadyClaimed") {
            logConsoleMessage('Minigame Candles Claim Failed: Daily Keys Already Claimed for Candles.');
        } else {
            logConsoleMessage('Minigame Candles Claim Successful.'); // Simplified success message without balance
        }

    } catch (error) {
        if (error.response) {
            logConsoleMessage(`Minigame Candles Error: ${error.response.data.error_message}`);
        } else {
            logConsoleMessage(`Minigame Candles Error: ${error.message}`);
        }
    }
};

module.exports = {
    processMinigameCandles,
};
