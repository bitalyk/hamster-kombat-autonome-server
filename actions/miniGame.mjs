const fetch = (await import('node-fetch')).default;
const token = global.token;

export const runMiniGame = async () => {
    const syncUrl = 'https://api.hamsterkombatgame.io/clicker/start-keys-minigame';
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-keys-minigame';

    const fetchAndClaimKeys = async () => {
        try {
            const syncOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await fetch(syncUrl, syncOptions);
            const data = await response.json();
            console.log('API Response:', data);

            const userId = data.clickerUser ? data.clickerUser.id : 'No clickerUser found';
            console.log('Clicker User ID:', userId);

            const plainCipherValue = `0789877014|${userId}`;
            const encodedCipherValue = btoa(plainCipherValue);

            const claimOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cipher: encodedCipherValue })
            };

            const claimResponse = await fetch(claimUrl, claimOptions);
            const claimData = await claimResponse.json();
            console.log('Claim Response:', claimData);
        } catch (error) {
            console.error('Error during fetch and claim process:', error);
        }
    };

    setInterval(fetchAndClaimKeys, 86400000); // Adjust interval as needed
};
