import { db } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  query, where, writeBatch 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { computeTodaysTasks } from '../utils/scheduling';

export const getTodayStr = () => format(new Date(), 'yyyy-MM-dd');
export const getYesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return format(d, 'yyyy-MM-dd');
};

export async function ensureDailySnapshot(uid, backlogId, backlogData, chapterTasks) {
  const todayStr = getTodayStr();
  const snapshotRef = doc(db, `backlogs/${uid}/items/${backlogId}/dailySnapshots`, todayStr);
  const snap = await getDoc(snapshotRef);
  
  if (snap.exists()) {
    return snap.data();
  }

  // Generate new snapshot
  const { taskIds, done } = computeTodaysTasks(
    chapterTasks, 
    backlogData.completedTaskIds, 
    backlogData.targetDate, 
    todayStr
  );

  const snapshotData = {
    taskIds,
    allCompleted: taskIds.length === 0 ? true : false,
  };

  await setDoc(snapshotRef, snapshotData);
  
  if (done && backlogData.status === 'active') {
    await updateDoc(doc(db, `backlogs/${uid}/items`, backlogId), {
      status: 'completed'
    });
  }

  return snapshotData;
}

export async function toggleTaskCompletion(uid, backlogId, taskId, isCompleted, currentCompletedIds, todaySnapshot) {
  const batch = writeBatch(db);
  
  // Update backlog completedTaskIds
  let newCompletedIds = [...currentCompletedIds];
  if (isCompleted && !newCompletedIds.includes(taskId)) {
    newCompletedIds.push(taskId);
  } else if (!isCompleted) {
    newCompletedIds = newCompletedIds.filter(id => id !== taskId);
  }

  const backlogRef = doc(db, `backlogs/${uid}/items`, backlogId);
  batch.update(backlogRef, {
    completedTaskIds: newCompletedIds
  });

  if (isCompleted && todaySnapshot) {
    // Check if daily snapshot is now fully completed
    const allCompletedNow = todaySnapshot.taskIds.every(id => newCompletedIds.includes(id));
    
    if (allCompletedNow && !todaySnapshot.allCompleted) {
      // Mark snapshot as completed
      const snapshotRef = doc(db, `backlogs/${uid}/items/${backlogId}/dailySnapshots`, getTodayStr());
      batch.update(snapshotRef, { allCompleted: true });

      // Streak logic
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const user = userSnap.data();
        const todayStr = getTodayStr();
        const yesterdayStr = getYesterdayStr();
        
        let currentStreak = user.currentStreak || 0;
        let longestStreak = user.longestStreak || 0;
        
        if (user.lastCompletedDate === yesterdayStr) {
          currentStreak += 1;
        } else if (user.lastCompletedDate !== todayStr) {
          currentStreak = 1;
        }
        
        longestStreak = Math.max(longestStreak, currentStreak);

        batch.update(userRef, {
          currentStreak,
          longestStreak,
          lastCompletedDate: todayStr
        });
      }
    }
  }

  await batch.commit();
}
