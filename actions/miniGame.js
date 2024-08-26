// actions/miniGame.js
(async () => {
    const fetch = (await import('node-fetch')).default;

    // Function to handle minigame logic
    async function runMiniGame(bearerToken) {
        const syncUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
        const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

        const syncOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            }
        };

        const fetchAndClaimKeys = async () => {
            try {
                const response = await fetch(syncUrl, syncOptions);
                const data = await response.json();
                console.log('API Response:', data);

                const userId = data.clickerUser ? data.clickerUser.id : 'No clickerUser found';
                console.log('Clicker User ID:', userId);

                const plainCipherValue = `0789877014|${userId}`;
                const encodedCipherValue = Buffer.from(plainCipherValue).toString('base64'); // Base64 encode the cipher value

                const claimOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cipher: encodedCipherValue })
                };

                const claimResponse = await fetch(claimUrl, claimOptions);
                const claimData = await claimResponse.json();
                console.log('Claim Response:', claimData);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        // Call fetchAndClaimKeys every 24 hours (86400000 milliseconds)
        setInterval(fetchAndClaimKeys, 86400000); // Adjust interval as needed
    }

    // Export the function
    module.exports = runMiniGame;
})();
