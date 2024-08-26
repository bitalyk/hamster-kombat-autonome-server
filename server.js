const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the logs page
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// Serve the settings page
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Handle errors
app.use((req, res, next) => {
    res.status(404).send('Page Not Found');
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Load token and handle server-side functionalities
const loadTokenAndStartFunctions = async () => {
    try {
        const token = fs.readFileSync('token.txt', 'utf8').trim();
        if (!token) {
            console.error('No token found in token.txt');
            process.exit(1);
        }
        global.token = token; // Make token available globally

        // Import and start functionalities
        const cipherFunction = await import('./actions/cipher.js');
        const earnTasksFunction = await import('./actions/earnTasks.js');
        const miniGameFunction = await import('./actions/miniGame.js');

        cipherFunction.runCipher();
        earnTasksFunction.runEarnTasks();
        miniGameFunction.runMiniGame();
    } catch (error) {
        console.error('Error loading token or starting functionalities:', error);
        process.exit(1);
    }
};

// Start functionalities
loadTokenAndStartFunctions();
