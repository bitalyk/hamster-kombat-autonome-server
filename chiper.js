const axios = require('axios');
const fs = require('fs').promises; // Use promises API for async/await support

// Function to read the token from token.txt
const getToken = async () => {
    try {
        const data = await fs.readFile('token.txt', 'utf8');
        return data.trim(); // Remove any extra whitespace
    } catch (error) {
        console.error('Error reading token file:', error);
        throw error; // Rethrow to handle it in performPostRequests
    }
};

// Function to perform the POST requests
const performPostRequests = async () => {
    try {
        const token = await getToken(); // Read the token

        // First POST request to get and decode the cipher value
        const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';
        const response = await axios.post(configUrl, {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Initial API Response:', response.data);

        // Extract and modify the cipher value
        let cipherValue = response.data.dailyCipher.cipher;
        cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
        const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf-8'); // Decode from Base64

        console.log('Decoded Cipher Value:', decodedValue);

        // Second POST request to claim the decoded value
        const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';
        const claimBody = { cipher: decodedValue };

        const claimResponse = await axios.post(claimUrl, claimBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Claim Response:', claimResponse.data);
    } catch (error) {
        console.error('Error during POST requests:', error);
    }
};

module.exports = performPostRequests;
