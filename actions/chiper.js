// chiper.js
const fetch = require('node-fetch'); // Ensure node-fetch is installed

async function handleChiper(bearerToken) {
  if (!bearerToken) {
    console.error('Bearer token is missing.');
    return;
  }

  try {
    // First, get and decode the cipher value
    const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await fetch(configUrl, options);
    const data = await response.json();
    console.log('Initial API Response:', data);

    // Extract and modify the cipher value
    let cipherValue = data.dailyCipher.cipher;
    cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
    const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf8'); // Decode from Base64

    console.log('Decoded Cipher Value:', decodedValue);

    // Now, send the decoded value in a new POST request
    const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';
    const claimBody = JSON.stringify({ cipher: decodedValue });

    const claimResponse = await fetch(claimUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: claimBody
    });

    const claimData = await claimResponse.json();
    console.log('Claim Response:', claimData);

  } catch (error) {
    console.error('Error during request:', error);
  }
}

module.exports = handleChiper;
