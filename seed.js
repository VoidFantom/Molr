/**
 * Molr - Firestore Seed Script
 * 
 * INSTRUCTIONS:
 * 1. Go to your Firebase Console > Project Settings > Service Accounts.
 * 2. Click "Generate new private key" and download the JSON file.
 * 3. Rename the downloaded file to "serviceAccountKey.json".
 * 4. Place "serviceAccountKey.json" in the root of this project (same folder as this seed.js file).
 * 5. Install the Firebase Admin SDK if you haven't already by running: 
 *    npm install firebase-admin
 * 6. Run this script by executing: 
 *    node seed.js
 * 
 * Note: serviceAccountKey.json is already in .gitignore to prevent accidental commits.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Read service account credentials
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Sample PCM Data Structure
const seedData = [
  {
    id: "subj_physics",
    name: "Physics",
    order: 1,
    chapters: [
      {
        id: "chap_physics_01",
        name: "Laws of Motion",
        order: 1,
        tasks: [
          { title: "Newton's First Law and Inertia", estMinutes: 15 },
          { title: "Newton's Second Law and Momentum", estMinutes: 20 },
          { title: "Newton's Third Law and Applications", estMinutes: 20 },
          { title: "Friction: Static and Kinetic", estMinutes: 15 },
          { title: "Circular Motion Dynamics", estMinutes: 20 }
        ]
      },
      {
        id: "chap_physics_02",
        name: "Work, Energy and Power",
        order: 2,
        tasks: [
          { title: "Work done by a Constant Force", estMinutes: 15 },
          { title: "Kinetic and Potential Energy", estMinutes: 20 },
          { title: "Work-Energy Theorem", estMinutes: 20 },
          { title: "Conservation of Mechanical Energy", estMinutes: 15 },
          { title: "Power and Collisions", estMinutes: 20 }
        ]
      }
    ]
  },
  {
    id: "subj_chemistry",
    name: "Chemistry",
    order: 2,
    chapters: [
      {
        id: "chap_chem_01",
        name: "Chemical Bonding",
        order: 1,
        tasks: [
          { title: "Kossel-Lewis Approach to Bonding", estMinutes: 15 },
          { title: "Ionic or Electrovalent Bond", estMinutes: 20 },
          { title: "VSEPR Theory", estMinutes: 20 },
          { title: "Valence Bond Theory", estMinutes: 15 },
          { title: "Molecular Orbital Theory", estMinutes: 20 }
        ]
      },
      {
        id: "chap_chem_02",
        name: "Thermodynamics",
        order: 2,
        tasks: [
          { title: "System and Surroundings", estMinutes: 15 },
          { title: "First Law of Thermodynamics", estMinutes: 20 },
          { title: "Enthalpy and Heat Capacity", estMinutes: 20 },
          { title: "Enthalpies for Different Types of Reactions", estMinutes: 15 },
          { title: "Spontaneity and Second Law", estMinutes: 20 }
        ]
      }
    ]
  },
  {
    id: "subj_math",
    name: "Maths",
    order: 3,
    chapters: [
      {
        id: "chap_math_01",
        name: "Sets and Functions",
        order: 1,
        tasks: [
          { title: "Sets and their Representations", estMinutes: 15 },
          { title: "Empty, Finite and Infinite Sets", estMinutes: 15 },
          { title: "Subsets and Power Sets", estMinutes: 20 },
          { title: "Venn Diagrams and Set Operations", estMinutes: 20 },
          { title: "Relations and Functions Intro", estMinutes: 20 }
        ]
      },
      {
        id: "chap_math_02",
        name: "Trigonometric Functions",
        order: 2,
        tasks: [
          { title: "Angles and Radian Measure", estMinutes: 15 },
          { title: "Trigonometric Functions Definition", estMinutes: 20 },
          { title: "Sign of Trigonometric Functions", estMinutes: 15 },
          { title: "Trig Functions of Sum and Difference", estMinutes: 20 },
          { title: "Trigonometric Equations", estMinutes: 20 }
        ]
      }
    ]
  }
];

async function seed() {
  console.log('Starting seed process...');
  const batch = db.batch();
  
  let subjCount = 0;
  let chapCount = 0;
  let taskCount = 0;
  let noteCount = 0;

  for (const subj of seedData) {
    const subjRef = db.collection('subjects').doc(subj.id);
    batch.set(subjRef, {
      name: subj.name,
      order: subj.order
    }, { merge: true });
    subjCount++;

    for (const chap of subj.chapters) {
      const chapRef = db.collection('chapters').doc(chap.id);
      batch.set(chapRef, {
        subjectId: subj.id,
        name: chap.name,
        order: chap.order,
        taskCount: chap.tasks.length
      }, { merge: true });
      chapCount++;

      for (let i = 0; i < chap.tasks.length; i++) {
        const taskData = chap.tasks[i];
        const taskNumber = i + 1;
        const taskId = `${chap.id}_task_${taskNumber}`;
        const noteId = `note_${taskId}`;

        // Create Task
        const taskRef = db.collection(`chapters/${chap.id}/tasks`).doc(taskId);
        batch.set(taskRef, {
          order: taskNumber,
          title: taskData.title,
          estMinutes: taskData.estMinutes,
          noteId: noteId
        }, { merge: true });
        taskCount++;

        // Create Note
        const noteRef = db.collection('notes').doc(noteId);
        batch.set(noteRef, {
          chapterId: chap.id,
          taskId: taskId,
          title: `Notes for ${taskData.title}`,
          storagePath: `PLACEHOLDER_STORAGE_PATH_${chap.id}_${taskNumber}`,
          downloadURL: `PLACEHOLDER_PDF_URL_${chap.id}_${taskNumber}`,
          authorId: "admin_seeder",
          approved: true,
          createdAt: FieldValue.serverTimestamp()
        }, { merge: true });
        noteCount++;
      }
    }
  }

  await batch.commit();
  console.log('Seed completed successfully!');
  console.log('--- Summary ---');
  console.log(`Subjects created/updated: ${subjCount}`);
  console.log(`Chapters created/updated: ${chapCount}`);
  console.log(`Tasks created/updated:    ${taskCount}`);
  console.log(`Notes created/updated:    ${noteCount}`);
}

seed().catch(console.error);
