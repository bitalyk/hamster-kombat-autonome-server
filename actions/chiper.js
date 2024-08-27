module.exports = (app, bearerToken) => {
  app.post('/cipher', (req, res) => {
      const configUrl = 'https://api.hamsterkombatgame.io/clicker/config';

      // First request to get and decode the cipher
      fetch(configUrl, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json'
          }
      })
      .then(response => response.json())
      .then(data => {
          let cipherValue = data.dailyCipher.cipher;
          cipherValue = cipherValue.slice(0, 3) + cipherValue.slice(4); // Remove 4th character
          const decodedValue = Buffer.from(cipherValue, 'base64').toString('utf-8'); // Decode from Base64

          // Log decoded cipher value
          console.log('Decoded Cipher Value:', decodedValue);

          // Send the decoded value in a new POST request
          const claimUrl = 'https://api.hamsterkombatgame.io/clicker/claim-daily-cipher';
          const claimBody = JSON.stringify({ cipher: decodedValue });

          return fetch(claimUrl, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${bearerToken}`,
                  'Content-Type': 'application/json'
              },
              body: claimBody
          });
      })
      .then(claimResponse => claimResponse.json())
      .then(claimData => {
          console.log('Claim Response:', claimData);
          res.status(200).json(claimData);
      })
      .catch(error => {
          console.error('Error during cipher operation:', error);
          res.status(500).json({ error: 'Cipher operation failed' });
      });
  });
};
