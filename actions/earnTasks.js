module.exports = (app, bearerToken) => {
    app.post('/earn-tasks', (req, res) => {
        const apiUrl = 'https://api.hamsterkombatgame.io/clicker/';
        
        fetch(apiUrl + 'list-tasks', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })
        .then(response => response.json())
        .then(data => {
            const incompleteTasks = data.tasks.filter(task => !task.isCompleted && task.id !== 'invite_friends');
            const taskIds = incompleteTasks.map(task => task.id);

            if (taskIds.length === 0) {
                console.log('No incomplete tasks found.');
                return res.status(200).json({ message: 'No incomplete tasks found' });
            }

            const checkTaskCompletion = (taskId, retryCount = 0) => {
                if (retryCount >= 10) {
                    console.log(`Task ID ${taskId} has not been completed after 10 retries.`);
                    return;
                }

                fetch(apiUrl + 'check-task', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ taskId })
                })
                .then(response => response.json())
                .then(taskData => {
                    if (taskData.task?.isCompleted) {
                        console.log(`Task ID ${taskId} is completed.`);
                    } else {
                        const retryDelay = taskData.task?.rewardDelaySeconds ? Math.max(1000, taskData.task.rewardDelaySeconds) : 1000;
                        setTimeout(() => checkTaskCompletion(taskId, retryCount + 1), retryDelay);
                    }
                })
                .catch(error => console.error(`Error checking task with ID ${taskId}:`, error));
            };

            taskIds.forEach(taskId => checkTaskCompletion(taskId));
            res.status(200).json({ message: 'Task checking initiated' });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
            res.status(500).json({ error: 'Earn tasks operation failed' });
        });
    });
};
