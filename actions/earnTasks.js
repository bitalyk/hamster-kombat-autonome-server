// actions/miniGame.js
const fetch = require('node-fetch');

// Function to handle minigame logic
function runMiniGame(bearerToken) {
    const syncUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

    // Define request options for the first POST request
    const syncOptions = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    // Function to fetch and claim keys
    const fetchAndClaimKeys = () => {
        fetch(syncUrl, syncOptions)
            .then(response => response.json())
            .then(data => {
                console.log('API Response:', data);

                // Extract the user ID from the response
                const userId = data.clickerUser ? data.clickerUser.id : 'No clickerUser found';
                console.log('Clicker User ID:', userId);

                // Create and encode the cipher value
                const plainCipherValue = `0789877014|${userId}`;
                const encodedCipherValue = Buffer.from(plainCipherValue).toString('base64'); // Base64 encode the cipher value

                // Define request options for the second POST request
                const claimOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cipher: encodedCipherValue })
                };

                // Make the second API request
                return fetch(claimUrl, claimOptions);
            })
            .then(response => response.json())
            .then(claimData => {
                console.log('Claim Response:', claimData);
            })
            .catch(error => {
                console.error('Error:', error);
            });
    };

    // Call fetchAndClaimKeys every 24 hours (86400000 milliseconds)
    setInterval(fetchAndClaimKeys, 86400000); // Adjust interval as needed
}

// Export the function
module.exports = runMiniGame;
