// earnTasks.js
const fetch = require('node-fetch'); // Ensure node-fetch is installed

async function handleEarnTasks(bearerToken) {
  if (!bearerToken) {
    console.error('Bearer token is missing.');
    return;
  }

  try {
    const apiUrl = 'https://api.hamsterkombatgame.io/clicker/';
    
    // Fetch the list of all tasks
    const taskResponse = await fetch(apiUrl + 'list-tasks', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const taskData = await taskResponse.json();

    if (!taskData.tasks) {
      console.error('No tasks found in response.');
      return;
    }

    // Filter tasks that are not completed
    const incompleteTasks = taskData.tasks.filter(task => !task.isCompleted && task.id !== 'invite_friends');
    const taskIds = incompleteTasks.map(task => task.id);

    if (taskIds.length === 0) {
      console.log('No incomplete tasks found.');
      return;
    }

    // Function to check task completion with retries
    const checkTaskCompletion = async (taskId, retryCount = 0) => {
      if (retryCount >= 10) {
        console.log(`Task ID ${taskId} has not been completed after 10 retries.`);
        return;
      }

      try {
        const checkResponse = await fetch(apiUrl + 'check-task', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${bearerToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId })
        });
        const checkData = await checkResponse.json();

        console.log(`Check Task Response for ID ${taskId}:`, checkData);

        if (checkData.task?.isCompleted) {
          console.log(`Task ID ${taskId} is completed.`);
        } else {
          const retryDelay = checkData.task?.rewardDelaySeconds ? Math.max(1000, checkData.task.rewardDelaySeconds) : 1000;
          console.log(`Task ID ${taskId} is not completed. Retrying in ${retryDelay} ms...`);
          setTimeout(() => checkTaskCompletion(taskId, retryCount + 1), retryDelay);
        }
      } catch (error) {
        console.error(`Error checking task with ID ${taskId}:`, error);
      }
    };

    // Process each task with a delay between requests
    const processTasksWithDelay = (tasks, index = 0) => {
      if (index >= tasks.length) return;

      checkTaskCompletion(tasks[index]);

      setTimeout(() => processTasksWithDelay(tasks, index + 1), 1000); // 1-second delay
    };

    processTasksWithDelay(taskIds);
  } catch (error) {
    console.error('Error fetching tasks:', error);
  }
}

module.exports = handleEarnTasks;
