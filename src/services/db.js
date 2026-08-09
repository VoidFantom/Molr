import { db } from '../firebase';
import { 
  collection, doc, getDoc, setDoc, updateDoc, 
  query, where, writeBatch, getDocs 
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
      // Mark THIS backlog snapshot as completed
      const snapshotRef = doc(db, `backlogs/${uid}/items/${backlogId}/dailySnapshots`, getTodayStr());
      batch.update(snapshotRef, { allCompleted: true });

      // Streak logic - check ALL active backlogs
      const backlogsRef = collection(db, `backlogs/${uid}/items`);
      const activeBacklogsSnap = await getDocs(query(backlogsRef, where("status", "==", "active")));
      
      let allActiveCompleted = true;
      const todayStr = getTodayStr();

      for (const d of activeBacklogsSnap.docs) {
        if (d.id === backlogId) continue; // We know this one just completed
        const otherSnapRef = doc(db, `backlogs/${uid}/items/${d.id}/dailySnapshots`, todayStr);
        const otherSnap = await getDoc(otherSnapRef);
        if (!otherSnap.exists() || !otherSnap.data().allCompleted) {
          allActiveCompleted = false;
          break;
        }
      }

      if (allActiveCompleted) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const user = userSnap.data();
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
  }

  await batch.commit();
}

export async function toggleDynamicTaskCompletion(uid, backlogId, taskId, isCompleted, allTasks) {
  const batch = writeBatch(db);
  
  // 1. Update the specific task's completed status
  const taskRef = doc(db, `backlogs/${uid}/items/${backlogId}/tasks`, taskId);
  batch.update(taskRef, { completed: isCompleted });

  // 2. Check if all tasks for this backlog are completed
  const willBeCompleted = allTasks.every(t => t.id === taskId ? isCompleted : t.completed);

  const backlogRef = doc(db, `backlogs/${uid}/items`, backlogId);
  
  if (willBeCompleted) {
    batch.update(backlogRef, { status: 'completed' });
  } else {
    batch.update(backlogRef, { status: 'active' });
  }

  await batch.commit();
}

export async function deleteBacklog(uid, backlogId) {
  // Query all tasks for this backlog
  const tasksRef = collection(db, `backlogs/${uid}/items/${backlogId}/tasks`);
  const tasksSnap = await getDocs(tasksRef);
  
  const batches = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  // Add tasks to delete batch (limit 500 per batch)
  tasksSnap.forEach((docSnap) => {
    if (operationCount === 499) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
    currentBatch.delete(docSnap.ref);
    operationCount++;
  });

  // Finally, delete the backlog doc itself
  if (operationCount === 499) {
    batches.push(currentBatch);
    currentBatch = writeBatch(db);
    operationCount = 0;
  }
  const backlogRef = doc(db, `backlogs/${uid}/items`, backlogId);
  currentBatch.delete(backlogRef);
  batches.push(currentBatch);

  // Commit all batches
  for (const b of batches) {
    await b.commit();
  }
}

export async function deleteAccountData(uid) {
  const backlogsRef = collection(db, `backlogs/${uid}/items`);
  const backlogsSnap = await getDocs(backlogsRef);
  
  const batches = [];
  let currentBatch = writeBatch(db);
  let operationCount = 0;

  const pushToBatch = (ref) => {
    if (operationCount === 499) {
      batches.push(currentBatch);
      currentBatch = writeBatch(db);
      operationCount = 0;
    }
    currentBatch.delete(ref);
    operationCount++;
  };

  for (const backlogDoc of backlogsSnap.docs) {
    const tasksRef = collection(db, `backlogs/${uid}/items/${backlogDoc.id}/tasks`);
    const tasksSnap = await getDocs(tasksRef);
    
    for (const taskDoc of tasksSnap.docs) {
      pushToBatch(taskDoc.ref);
    }
    pushToBatch(backlogDoc.ref);
  }

  const userRef = doc(db, `users/${uid}`);
  pushToBatch(userRef);

  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  for (const b of batches) {
    await b.commit();
  }
}
