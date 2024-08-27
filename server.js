const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Load token from a file
const tokenFilePath = path.join(__dirname, 'token.txt');
let token;
try {
    token = fs.readFileSync(tokenFilePath, 'utf8').trim();
    if (!token) {
        console.error('No token found in token.txt');
        process.exit(1);
    }
} catch (error) {
    console.error('Error reading token file:', error);
    process.exit(1);
}

// Load and use the functionalities
require('./actions/cipher')(app, token);
require('./actions/earnTasks')(app, token);
require('./actions/minigame')(app, token);

// Logging functionality
app.get('/logs', (req, res) => {
    // Return logs or log data here
    res.send('Logs page');
});

// Settings functionality
app.get('/settings', (req, res) => {
    // Handle settings or configurations here
    res.send('Settings page');
});

// Homepage with links to logs and settings
app.get('/', (req, res) => {
    res.send(`
        <h1>Server Functionalities</h1>
        <p><a href="/logs">Logs</a></p>
        <p><a href="/settings">Settings</a></p>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
