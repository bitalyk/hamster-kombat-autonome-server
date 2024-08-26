const fetch = require('node-fetch');

// Function to handle minigame logic
function runMiniGame(bearerToken) {
    const syncUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

    const syncOptions = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        }
    };

    const fetchAndClaimKeys = () => {
        fetch(syncUrl, syncOptions)
            .then(response => response.json())
            .then(data => {
                console.log('API Response:', data);

                const userId = data.clickerUser ? data.clickerUser.id : 'No clickerUser found';
                console.log('Clicker User ID:', userId);

                const plainCipherValue = `0789877014|${userId}`;
                const encodedCipherValue = Buffer.from(plainCipherValue).toString('base64');

                const claimOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cipher: encodedCipherValue })
                };

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

    setInterval(fetchAndClaimKeys, 86400000); // Adjust interval as needed
}

module.exports = runMiniGame;
