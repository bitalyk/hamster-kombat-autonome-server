const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Function to log time every second
function logTimeEverySecond() {
  setInterval(() => {
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
  }, 1000); // 1000 milliseconds = 1 second
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  logTimeEverySecond(); // Start logging time
});
