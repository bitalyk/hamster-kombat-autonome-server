const fs = require('fs');  // Import the fs module for file system operations
const moment = require('moment');

// Initial schedule setup
const taskInterval = 3600000; // 1 hour in milliseconds
const repeatInterval = 86400000; // 24 hours in milliseconds

// Calculate the next execution time for a specific hour and minute in GMT+3
function calculateNextExecutionTime(hour, minute) {
    const now = moment().utcOffset(3); // Current time in GMT+3
    let nextExecution = moment().utcOffset(3).hour(hour).minute(minute).second(0).millisecond(0);

    // If the time is in the past, schedule for the next day
    if (nextExecution.isBefore(now)) {
        nextExecution.add(1, 'day');
    }

    return nextExecution.valueOf(); // Return as milliseconds since epoch
}

// Set initial execution times
let nextTaskExecutionTime = Date.now() + taskInterval; // Tasks start immediately
let nextCipherExecutionTime = calculateNextExecutionTime(22, 5); // Cipher at 10:05 PM GMT+3
let nextMinigameTilesExecutionTime = calculateNextExecutionTime(14, 5); // Minigame Tiles at 2:05 PM GMT+3
let nextMinigameCandlesExecutionTime = calculateNextExecutionTime(23, 5); // Minigame Candles at 11:05 PM GMT+3

const updateSettings = (newTaskInterval, newCipherInterval, newMinigameCandlesInterval, newMinigameTilesInterval) => {
    // Update intervals and set next execution times
    nextTaskExecutionTime = Date.now() + newTaskInterval;
    nextCipherExecutionTime = calculateNextExecutionTime(22, 5); // Reset for 10:05 PM GMT+3
    nextMinigameTilesExecutionTime = calculateNextExecutionTime(14, 5); // Reset for 2:05 PM GMT+3
    nextMinigameCandlesExecutionTime = calculateNextExecutionTime(23, 5); // Reset for 11:05 PM GMT+3

    logConsoleMessage('Settings updated successfully! Starting tasks, cipher, minigame candles, and minigame tiles processing as per the configured schedule.');
};

const resetNextExecution = () => {
    nextTaskExecutionTime = Date.now() + taskInterval;
};

const resetCipherNextExecution = () => {
    nextCipherExecutionTime += repeatInterval;
};

const resetMinigameCandlesNextExecution = () => {
    nextMinigameCandlesExecutionTime += repeatInterval;
};

const resetMinigameTilesNextExecution = () => {
    nextMinigameTilesExecutionTime += repeatInterval;
};

const getTimeLeft = () => {
    const now = Date.now();
    const timeLeftInMilliseconds = nextTaskExecutionTime - now;
    return formatTimeLeft(timeLeftInMilliseconds);
};

const getCipherTimeLeft = () => {
    const now = Date.now();
    const cipherTimeLeftInMilliseconds = nextCipherExecutionTime - now;
    return formatTimeLeft(cipherTimeLeftInMilliseconds);
};

const getMinigameCandlesTimeLeft = () => {
    const now = Date.now();
    const minigameCandlesTimeLeftInMilliseconds = nextMinigameCandlesExecutionTime - now;
    return formatTimeLeft(minigameCandlesTimeLeftInMilliseconds);
};

const getMinigameTilesTimeLeft = () => {
    const now = Date.now();
    const minigameTilesTimeLeftInMilliseconds = nextMinigameTilesExecutionTime - now;
    return formatTimeLeft(minigameTilesTimeLeftInMilliseconds);
};

// Helper function to format time left as HH:mm:ss
function formatTimeLeft(milliseconds) {
    if (milliseconds <= 0) {
        return '00:00:00'; // Indicate execution time has reached
    }

    const timeLeft = moment.duration(milliseconds);
    return moment.utc(timeLeft.asMilliseconds()).format('HH:mm:ss');
}

const getSettings = () => {
    return {
        taskInterval: taskInterval / 1000, // in seconds
        cipherInterval: repeatInterval / 1000, // in seconds
        minigameCandlesInterval: repeatInterval / 1000, // in seconds
        minigameTilesInterval: repeatInterval / 1000, // in seconds
        nextTaskExecution: new Date(nextTaskExecutionTime).toISOString(),
        nextCipherExecution: new Date(nextCipherExecutionTime).toISOString(),
        nextMinigameCandlesExecution: new Date(nextMinigameCandlesExecutionTime).toISOString(),
        nextMinigameTilesExecution: new Date(nextMinigameTilesExecutionTime).toISOString(),
    };
}

// Centralized logging function for console logs
function logConsoleMessage(message) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timestampedMessage = `[${time}, ${date}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync('logs/console_logs.txt', `${timestampedMessage}\n`);
}

module.exports = {
    updateSettings,
    resetNextExecution, // Reset for tasks
    resetCipherNextExecution, // Reset for cipher processing
    resetMinigameCandlesNextExecution, // Reset for minigame candles processing
    resetMinigameTilesNextExecution, // Reset for minigame tiles processing
    getTimeLeft,
    getCipherTimeLeft,
    getMinigameCandlesTimeLeft,
    getMinigameTilesTimeLeft,
    getSettings,
};
