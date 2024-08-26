// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// Load the JavaScript files from the 'actions' folder
const handleChiper = require('./actions/chiper');
const handleEarnTasks = require('./actions/earnTasks');
const runMiniGame = require('./actions/miniGame');

const app = express();
const port = process.env.PORT || 3000;

// Path to the token file
const tokenFilePath = path.join(__dirname, 'token.txt');

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Global variable to store the bearer token
let bearerToken = null;

// Function to read the token from a file
function loadToken() {
  if (fs.existsSync(tokenFilePath)) {
    bearerToken = fs.readFileSync(tokenFilePath, 'utf8').trim();
    if (!bearerToken) {
      console.error('Token file is empty.');
      process.exit(1); // Exit the process if no token is available
    }
  } else {
    console.error('Token file not found.');
    process.exit(1); // Exit the process if the token file is not found
  }
}

// Serve the logs page
app.get('/logs', (req, res) => {
  res.send('<h1>Logs</h1><p>Here you can see the logs.</p>');
});

// Serve the settings page
app.get('/settings', (req, res) => {
  res.send(`
    <h1>Settings</h1>
    <form action="/update-settings" method="get">
      <label for="chiperInterval">Chiper Interval (ms):</label>
      <input type="number" id="chiperInterval" name="chiperInterval" value="10000" /><br/><br/>
      <label for="earnTasksInterval">Earn Tasks Interval (ms):</label>
      <input type="number" id="earnTasksInterval" name="earnTasksInterval" value="15000" /><br/><br/>
      <label for="miniGameInterval">Mini Game Interval (ms):</label>
      <input type="number" id="miniGameInterval" name="miniGameInterval" value="20000" /><br/><br/>
      <input type="submit" value="Update Settings" />
    </form>
  `);
});

// Endpoint to update settings
app.get('/update-settings', (req, res) => {
  // Here you should update the intervals based on the query parameters
  res.send('Settings updated successfully. <a href="/">Go back</a>');
});

// Serve the home page with links
app.get('/', (req, res) => {
  res.send(`
    <h1>Home Page</h1>
    <ul>
      <li><a href="/logs">Logs</a></li>
      <li><a href="/settings">Settings</a></li>
    </ul>
  `);
});

// Start the server and functionalities
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  loadToken(); // Load the token when the server starts
  handleChiper(bearerToken); // Start the chiper functionality
  handleEarnTasks(bearerToken); // Start the earn tasks functionality
  runMiniGame(bearerToken); // Start the mini game functionality
});
