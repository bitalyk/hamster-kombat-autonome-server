const fetch = require('node-fetch'); // Ensure node-fetch is installed

async function checkAndCompleteTasks() {
    const apiUrl = 'https://api.hamsterkombatgame.io/clicker/';
    const bearerToken = global.bearerToken; // Access global token

    try {
        const taskListResponse = await fetch(apiUrl + 'list-tasks', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${bearerToken}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({})
        });

        const taskListData = await taskListResponse.json();
        if (!taskListData.tasks) {
            console.error('No tasks found in response.');
            return;
        }

        const incompleteTasks = taskListData.tasks.filter(task => !task.isCompleted && task.id !== 'invite_friends');
        const taskIds = incompleteTasks.map(task => task.id);

        if (taskIds.length === 0) {
            console.log('No incomplete tasks found.');
            return;
        }

        const checkTaskCompletion = async (taskId, retryCount = 0) => {
            if (retryCount >= 10) {
                console.log(`Task ID ${taskId} has not been completed after 10 retries.`);
                return;
            }

            const taskCheckResponse = await fetch(apiUrl + 'check-task', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${bearerToken}`, 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ taskId })
            });

            const taskData = await taskCheckResponse.json();
            console.log(`Check Task Response for ID ${taskId}:`, taskData);

            if (taskData.task?.isCompleted) {
                console.log(`Task ID ${taskId} is completed.`);
            } else {
                const retryDelay = taskData.task?.rewardDelaySeconds ? Math.max(1000, taskData.task.rewardDelaySeconds) : 1000;
                console.log(`Task ID ${taskId} is not completed. Retrying in ${retryDelay} ms...`);
                setTimeout(() => checkTaskCompletion(taskId, retryCount + 1), retryDelay);
            }
        };

        const processTasksWithDelay = async (tasks, index = 0) => {
            if (index >= tasks.length) return;

            await checkTaskCompletion(tasks[index]);

            setTimeout(() => processTasksWithDelay(tasks, index + 1), 1000); // 1-second delay
        };

        processTasksWithDelay(taskIds);
    } catch (error) {
        console.error('Error fetching or processing tasks:', error);
    }
}

module.exports = { checkAndCompleteTasks };
