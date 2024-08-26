// server.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Dynamically import the handleChiper function
let handleChiper;
(async () => {
    handleChiper = (await import('./actions/chiper.js')).default;
})();

// Example route to use the function
app.get('/run-chiper', (req, res) => {
    // Ensure the function is loaded
    if (handleChiper) {
        handleChiper()
            .then(() => res.send('Chiper function executed'))
            .catch(err => res.status(500).send(`Error: ${err.message}`));
    } else {
        res.status(500).send('Chiper function not available');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
