const fetch = require('node-fetch'); // Ensure node-fetch is installed

async function decodeAndClaimCipher() {
    const apiUrl = 'https://api.hamsterkombatgame.io/clicker/config';
    const bearerToken = global.bearerToken; // Access global token

    try {
        const configOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await fetch(apiUrl, configOptions);
        const data = await response.json();
        console.log('Initial API Response:', data);

        let cipherValue = data.dailyCipher.cipher;
        cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
        const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf8'); // Decode from Base64
        console.log('Decoded Cipher Value:', decodedValue);

        const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';
        const claimBody = JSON.stringify({ cipher: decodedValue });

        const claimOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: claimBody
        };

        const claimResponse = await fetch(claimUrl, claimOptions);
        const claimData = await claimResponse.json();
        console.log('Claim Response:', claimData);

    } catch (error) {
        console.error('Error during cipher processing:', error);
    }
}

module.exports = { decodeAndClaimCipher };
