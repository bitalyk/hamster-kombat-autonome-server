import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
        const { runCipher } = await import('./actions/cipher.js');
        const { runEarnTasks } = await import('./actions/earnTasks.js');
        const { runMiniGame } = await import('./actions/miniGame.js');

        runCipher();
        runEarnTasks();
        runMiniGame();
    } catch (error) {
        console.error('Error loading token or starting functionalities:', error);
        process.exit(1);
    }
};

// Start functionalities
loadTokenAndStartFunctions();
