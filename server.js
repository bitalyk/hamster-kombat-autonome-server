const express = require('express');
const app = express();
const port = 3000;

// Middleware to log the current time every second
setInterval(() => {
    const now = new Date().toLocaleTimeString();
    console.log(`Current time: ${now}`);
}, 1000);

// Basic route to test the server
app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
