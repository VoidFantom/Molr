import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { SUBJECTS } from '../data/curriculum';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const { currentUser } = useAuth();

  const [userData, setUserData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [activeBacklogs, setActiveBacklogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize static data from curriculum.js
  useEffect(() => {
    console.log("[DataContext] loading static data from curriculum.js...");
    const subjs = SUBJECTS.map(s => ({ id: s.id, name: s.name }));
    const chaps = SUBJECTS.flatMap(s => 
      s.chapters.map(c => ({ id: c.id, name: c.name, subjectId: s.id, tasks: c.tasks || [] }))
    );
    
    setSubjects(subjs);
    console.log("[DataContext] subjects loaded:", subjs.length);
    setChapters(chaps);
    console.log("[DataContext] chapters loaded:", chaps.length);
  }, []);

  useEffect(() => {
    console.log("[DataContext] currentUser changed:", currentUser ? currentUser.uid : "null");

    if (!currentUser) {
      setUserData(null);
      setActiveBacklogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeUser = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (docSnap) => {
        console.log("[DataContext] user doc snapshot received. exists:", docSnap.exists());
        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        }
      },
      (err) => {
        console.error("[DataContext] user doc listener error:", err);
      }
    );

    const backlogsRef = collection(db, `backlogs/${currentUser.uid}/items`);
    const q = query(backlogsRef, where("status", "==", "active"));

    const unsubscribeBacklogs = onSnapshot(
      q,
      (querySnapshot) => {
        const backlogs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("[DataContext] backlogs snapshot received. count:", backlogs.length);
        setActiveBacklogs(backlogs);
        setLoading(false);
        console.log("[DataContext] loading set to false");
      },
      (err) => {
        console.error("[DataContext] backlogs listener error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeBacklogs();
    };
  }, [currentUser]);

  const value = {
    userData,
    subjects,
    chapters,
    activeBacklogs,
    loading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}