const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

module.exports = (app, token) => {
    // Endpoint for minigame
    app.post('/minigame', async (req, res) => {
        try {
            const syncUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
            const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

            // Define the request options for the first POST request
            const syncOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            // Make the first API request
            const syncResponse = await fetch(syncUrl, syncOptions);
            const syncData = await syncResponse.json();
            console.log('API Response:', syncData);

            // Extract the clickerUser.id from the response
            const userId = syncData.clickerUser ? syncData.clickerUser.id : 'No clickerUser found';
            console.log('Clicker User ID:', userId);

            // Create the cipher value for the second request and encode it in Base64
            const plainCipherValue = `0789877014|${userId}`;
            const encodedCipherValue = Buffer.from(plainCipherValue).toString('base64'); // Base64 encode the cipher value

            // Define the request options for the second POST request
            const claimOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cipher: encodedCipherValue })
            };

            // Make the second API request
            const claimResponse = await fetch(claimUrl, claimOptions);
            const claimData = await claimResponse.json();
            console.log('Claim Response:', claimData);

            // Send the claim data back in the response
            res.status(200).json(claimData);
        } catch (error) {
            console.error('Error during minigame operation:', error);
            res.status(500).json({ error: 'Minigame operation failed' });
        }
    });
};
