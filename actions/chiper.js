// actions/chiper.js
const fetch = (await import('node-fetch')).default;
const fs = require('fs');
const path = require('path');

// Path to the token file
const tokenFilePath = path.join(__dirname, '..', 'token.txt');

// Function to handle chiper logic
async function handleChiper(bearerToken) {
    const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    // Fetch the config and decode the cipher
    const fetchAndClaimCipher = async () => {
        try {
            const response = await fetch(configUrl, options);
            const data = await response.json();
            console.log('Initial API Response:', data);

            let cipherValue = data.dailyCipher.cipher;
            cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
            const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf-8'); // Decode from Base64

            console.log('Decoded Cipher Value:', decodedValue);

            const claimOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cipher: decodedValue })
            };

            const claimResponse = await fetch(claimUrl, claimOptions);
            const claimData = await claimResponse.json();
            console.log('Claim Response:', claimData);
        } catch (error) {
            console.error('Error during API requests:', error);
        }
    };

    fetchAndClaimCipher();
}

// Read the token from file and execute the function
fs.readFile(tokenFilePath, 'utf8', (err, token) => {
    if (err) {
        console.error('Error reading token file:', err);
        process.exit(1);
    }
    handleChiper(token.trim());
});

module.exports = handleChiper;
