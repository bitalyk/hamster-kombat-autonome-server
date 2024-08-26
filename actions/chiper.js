const fetch = (await import('node-fetch')).default;
const token = global.token;

export const runCipher = async () => {
    const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';

    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const fetchAndProcessCipher = async () => {
        try {
            const response = await fetch(configUrl, options);
            const data = await response.json();
            console.log('Initial API Response:', data);

            let cipherValue = data.dailyCipher.cipher;
            cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4);
            const decodedValue = atob(cipherValue);
            console.log('Decoded Cipher Value:', decodedValue);

            const claimBody = JSON.stringify({ cipher: decodedValue });
            const claimOptions = { ...options, body: claimBody };
            const claimResponse = await fetch(claimUrl, claimOptions);
            const claimData = await claimResponse.json();
            console.log('Claim Response:', claimData);
        } catch (error) {
            console.error('Error during fetch and claim process:', error);
        }
    };

    setInterval(fetchAndProcessCipher, 86400000); // Adjust interval as needed
};
