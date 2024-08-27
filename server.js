const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const performPostRequests = require('./cipher.js'); // Import the function from cipher.js
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static('public'));

// Route to serve settings page
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Route to serve logs page
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// Endpoint to get the current settings
app.get('/api/settings', async (req, res) => {
    try {
        const data = await fs.readFile('settings.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(500).send('Error reading settings file');
    }
});

// Endpoint to update settings
app.post('/api/settings', async (req, res) => {
    try {
        const settings = req.body;
        await fs.writeFile('settings.json', JSON.stringify(settings, null, 2));
        res.send('Settings updated');
    } catch (error) {
        res.status(500).send('Error saving settings');
    }
});

// Get log data (this is just a placeholder, modify according to your logging mechanism)
app.get('/api/logs', async (req, res) => {
    try {
        const data = await fs.readFile('logs.txt', 'utf8');
        res.send(data);
    } catch (error) {
        res.status(500).send('Error reading logs file');
    }
});

let intervalTime = 24 * 60 * 60 * 1000; // Default to 24 hours

// Function to perform POST requests
const schedulePostRequests = async () => {
    await performPostRequests();
    setInterval(performPostRequests, intervalTime); // Schedule next execution
};

// Initialize the schedule with current settings
const initializeSchedule = async () => {
    try {
        const data = await fs.readFile('settings.json', 'utf8');
        const settings = JSON.parse(data);
        intervalTime = settings.interval || intervalTime;
    } catch (error) {
        console.error('Error reading settings file, using default interval.');
    }
    schedulePostRequests();
};

// Start the server and initialize the schedule
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    initializeSchedule();
});
