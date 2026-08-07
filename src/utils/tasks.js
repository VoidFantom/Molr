/**
 * Returns the "current task" from an array of tasks.
 * The current task is defined as the lowest dayNumber task where completed === false.
 * Assumes tasks array is ordered by dayNumber.
 * 
 * @param {Array} tasks - Array of task objects
 * @returns {Object|undefined} The current task, or undefined if all tasks are completed
 */
export function getCurrentTask(tasks) {
  if (!tasks || tasks.length === 0) return undefined;
  
  // Assuming the tasks are already sorted by dayNumber from Firestore,
  // we just find the first one that is not completed.
  return tasks.find(task => !task.completed);
}
