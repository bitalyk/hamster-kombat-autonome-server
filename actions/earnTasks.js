// actions/earnTasks.js
(async () => {
    const fetch = (await import('node-fetch')).default;

    // Function to handle earn tasks logic
    async function handleEarnTasks(bearerToken) {
        const apiUrl = 'https://api.hamsterkombatgame.io/clicker/';
        const token = `Bearer ${bearerToken}`;

        // Fetch the list of all tasks
        const fetchTasks = async () => {
            try {
                const response = await fetch(apiUrl + 'list-tasks', {
                    method: 'POST',
                    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });
                const data = await response.json();
                if (!data.tasks) {
                    console.error('No tasks found in response.');
                    return;
                }

                const incompleteTasks = data.tasks.filter(task => !task.isCompleted && task.id !== 'invite_friends');
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

                    try {
                        const response = await fetch(apiUrl + 'check-task', {
                            method: 'POST',
                            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ taskId })
                        });
                        const taskData = await response.json();
                        console.log(`Check Task Response for ID ${taskId}:`, taskData);

                        if (taskData.task?.isCompleted) {
                            console.log(`Task ID ${taskId} is completed.`);
                        } else {
                            const retryDelay = taskData.task?.rewardDelaySeconds ? Math.max(1000, taskData.task.rewardDelaySeconds) : 1000;
                            console.log(`Task ID ${taskId} is not completed. Retrying in ${retryDelay} ms...`);
                            setTimeout(() => checkTaskCompletion(taskId, retryCount + 1), retryDelay);
                        }
                    } catch (error) {
                        console.error(`Error checking task with ID ${taskId}:`, error);
                    }
                };

                const processTasksWithDelay = (tasks, index = 0) => {
                    if (index >= tasks.length) return;

                    checkTaskCompletion(tasks[index]);

                    setTimeout(() => processTasksWithDelay(tasks, index + 1), 1000); // 1-second delay
                };

                processTasksWithDelay(taskIds);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
        };

        fetchTasks();
    }

    // Export the function
    module.exports = handleEarnTasks;
})();
