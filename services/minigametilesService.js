const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Paths to read the token and secret key for the minigame
const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const secretKeyTilesPath = path.join(__dirname, '..', 'secret-key-tiles.txt');

// Read the token and secret key from files
const token = fs.readFileSync(tokenPath, 'utf8').trim();
const secretKey = fs.readFileSync(secretKeyTilesPath, 'utf8').trim();

// Use the same minigame URL for both services
const minigameUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

// Centralized logging function for console logs
function logConsoleMessage(message) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timestampedMessage = `[${time}, ${date}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync('logs/console_logs.txt', `${timestampedMessage}\n`);
}

const processMinigameTiles = async () => {
    if (!secretKey) {
        logConsoleMessage('Secret key for Tiles not set. Please set it in /secret-settings.');
        return;
    }

    const requestBody = {
        cipher: secretKey,
        miniGameId: 'Tiles' // Specify the minigame ID as 'Tiles'
    };

    let keepRunning = true;

    while (keepRunning) {
        try {
            // Set a timeout for the request
            const response = await axios.post(minigameUrl, requestBody, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // 5-second timeout
            });

            const data = response.data;

            if (data.error_code === "DAILY_KEYS_MINI_GAME_DOUBLE_CLAIMED") {
                logConsoleMessage('Daily Keys Already Claimed for Tiles. Stopping the loop.');
                keepRunning = false;
            } else {
                const balance = data.clickerUser ? data.clickerUser.balanceCoins : 'Unknown';
                logConsoleMessage(`Tiles Claim Successful. Current Balance: ${balance}`);
                // Continue the loop if successful
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                logConsoleMessage('Request timed out after 5 seconds. Sending next request.');
                // Continue to the next iteration without stopping the loop
                continue;
            } else if (error.response) {
                logConsoleMessage(`Minigame Tiles Error: ${error.response.data.error_message}`);
                // Stop the loop on any specific error
                keepRunning = false;
            } else {
                logConsoleMessage(`Minigame Tiles Error: ${error.message}`);
                // Stop the loop on unexpected errors
                keepRunning = false;
            }
        }
    }
};

module.exports = {
    processMinigameTiles,
};
