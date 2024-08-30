const fs = require('fs');  // Import the fs module for file system operations
const axios = require('axios');
const path = require('path');

// Read the Bearer token from the file
const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const token = fs.readFileSync(tokenPath, 'utf8').trim(); // Read and trim to remove any extra spaces/newlines

const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';
const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';

// Centralized logging function (should be consistent with the one in server.js)
function logConsoleMessage(message) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timestampedMessage = `[${time}, ${date}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync('logs/console_logs.txt', `${timestampedMessage}\n`);
}

const processCipher = () => {
    // First, get and decode the cipher value
    axios.post(configUrl, {}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        const data = response.data;
        logConsoleMessage('Initial API Response received.');

        // Extract and modify the cipher value
        let cipherValue = data.dailyCipher.cipher;
        cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
        const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf8'); // Decode from Base64

        logConsoleMessage(`Decoded Cipher Value: ${decodedValue}`);

        // Now, send the decoded value in a new POST request
        const claimBody = { cipher: decodedValue };

        return axios.post(claimUrl, claimBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    })
    .then(claimResponse => {
        const claimData = claimResponse.data;

        // Log a specific part of the response, e.g., the user ID
        logConsoleMessage('Claim Successful: Cipher claimed.');
    })
    .catch(error => {
        // Check for specific error response
        if (error.response && error.response.data && error.response.data.error_code === 'DAILY_CIPHER_DOUBLE_CLAIMED') {
            logConsoleMessage('Daily Cipher Already Claimed');
        } else {
            logConsoleMessage(`Error during cipher processing: ${error.message}`);
        }
    });
};

module.exports = {
    processCipher,
};
