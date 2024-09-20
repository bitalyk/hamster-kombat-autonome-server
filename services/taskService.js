const fs = require('fs');  // Import the fs module for file system operations
const axios = require('axios');
const path = require('path');

// Read the Bearer token from the file
const tokenPath = path.join(__dirname, '..', 'token', 'token.txt');
const token = fs.readFileSync(tokenPath, 'utf8').trim(); // Read and trim to remove any extra spaces/newlines

const apiUrl = 'https://api.hamsterkombatgame.io/interlude/';

// Centralized logging function (should be consistent with the one in server.js)
function logConsoleMessage(message) {
    const now = new Date();
    const time = now.toTimeString().split(' ')[0];
    const date = now.toLocaleDateString('en-GB').replace(/\//g, '-');
    const timestampedMessage = `[${time}, ${date}] ${message}`;
    console.log(timestampedMessage);
    fs.appendFileSync('logs/console_logs.txt', `${timestampedMessage}\n`);
}

const checkTasks = () => {
    // Fetch the list of all tasks
    axios.post(apiUrl + 'list-tasks', {}, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        const data = response.data;
        if (!data.tasks) {
            logConsoleMessage('No tasks found in response.');
            return;
        }

        // Filter tasks that are not completed
        const incompleteTasks = data.tasks.filter(task => !task.isCompleted && task.id !== 'invite_friends');
        const taskIds = incompleteTasks.map(task => task.id);

        if (taskIds.length === 0) {
            logConsoleMessage('No incomplete tasks found.');
            return;
        }

        // Function to check task completion with retries
        const checkTaskCompletion = (taskId, retryCount = 0) => {
            if (retryCount >= 10) {
                logConsoleMessage(`Task "${taskId}" has not been completed after 10 retries.`);
                return;
            }

            axios.post(apiUrl + 'check-task', { taskId }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                const taskData = response.data;
                const taskName = taskData.task?.name?.en || `Task ID ${taskId}`;

                if (taskData.task?.isCompleted) {
                    logConsoleMessage(`Task "${taskName}" is completed.`);
                } else {
                    if (retryCount === 0) {
                        // Log the first retry attempt
                        logConsoleMessage(`Task "${taskName}" is not completed. Starting retry attempts...`);
                    }
                    if (retryCount === 9) {
                        // Log the last retry attempt before it reaches the retry limit
                        logConsoleMessage(`Task "${taskName}" is still not completed. Last retry attempt in 1000 ms...`);
                    }
                    const retryDelay = taskData.task?.rewardDelaySeconds ? Math.max(1000, taskData.task.rewardDelaySeconds) : 1000;
                    setTimeout(() => checkTaskCompletion(taskId, retryCount + 1), retryDelay);
                }
            })
            .catch(error => logConsoleMessage(`Error checking task "${taskId}": ${error}`));
        };

        // Process each task with a delay between requests
        const processTasksWithDelay = (tasks, index = 0) => {
            if (index >= tasks.length) return;

            checkTaskCompletion(tasks[index]);

            setTimeout(() => processTasksWithDelay(tasks, index + 1), 1000); // 1-second delay
        };

        processTasksWithDelay(taskIds);
    })
    .catch(error => logConsoleMessage(`Error fetching tasks: ${error}`));
};

module.exports = {
    checkTasks,
};
