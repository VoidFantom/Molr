import { differenceInDays, parseISO } from 'date-fns';

export function computeTodaysTasks(chapterTasks, completedTaskIds, targetDateStr, todayStr) {
  // 1. Filter chapterTasks to only those NOT in completedTaskIds, sorted by order
  const remaining = chapterTasks
    .filter(t => !completedTaskIds.includes(t.id))
    .sort((a, b) => a.order - b.order);

  // 2. If none remain, return {taskIds: [], done: true}
  if (remaining.length === 0) {
    return { taskIds: [], done: true };
  }

  // 3. daysLeft = max(1, number of days from today to targetDate inclusive)
  const targetDate = parseISO(targetDateStr);
  const today = parseISO(todayStr);
  let daysDiff = differenceInDays(targetDate, today) + 1;
  const daysLeft = Math.max(1, daysDiff);

  // 4. perDay = ceil(remaining.length / daysLeft)
  const perDay = Math.ceil(remaining.length / daysLeft);

  // 5. Return the first perDay remaining task IDs
  const taskIds = remaining.slice(0, perDay).map(t => t.id);
  
  return { taskIds, done: false };
}
