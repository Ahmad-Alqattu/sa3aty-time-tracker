import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, TimeEntry } from '@/types';

// Collection paths
const getUserProjectsPath = (uid: string) => `users/${uid}/projects`;
const getUserEntriesPath = (uid: string) => `users/${uid}/entries`;

// Projects
export async function syncProjectToFirestore(uid: string, project: Project) {
  const projectRef = doc(db, getUserProjectsPath(uid), project.id);
  await setDoc(projectRef, project);
}

export async function deleteProjectFromFirestore(uid: string, projectId: string) {
  const projectRef = doc(db, getUserProjectsPath(uid), projectId);
  await deleteDoc(projectRef);
}

export function subscribeToProjects(
  uid: string, 
  onUpdate: (projects: Project[]) => void
): Unsubscribe {
  const q = query(collection(db, getUserProjectsPath(uid)));
  return onSnapshot(q, (snapshot) => {
    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push(doc.data() as Project);
    });
    // Sort by createdAt
    projects.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    onUpdate(projects);
  });
}

// Entries
export async function syncEntryToFirestore(uid: string, entry: TimeEntry) {
  const entryRef = doc(db, getUserEntriesPath(uid), entry.id);
  await setDoc(entryRef, entry);
}

export async function deleteEntryFromFirestore(uid: string, entryId: string) {
  const entryRef = doc(db, getUserEntriesPath(uid), entryId);
  await deleteDoc(entryRef);
}

export function subscribeToEntries(
  uid: string, 
  onUpdate: (entries: TimeEntry[]) => void
): Unsubscribe {
  const q = query(collection(db, getUserEntriesPath(uid)));
  return onSnapshot(q, (snapshot) => {
    const entries: TimeEntry[] = [];
    snapshot.forEach((doc) => {
      entries.push(doc.data() as TimeEntry);
    });
    // Sort by startAt descending (newest first for display)
    entries.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    onUpdate(entries);
  });
}

// Bulk sync (for migrating localStorage data to Firestore)
export async function bulkSyncToFirestore(
  uid: string, 
  projects: Project[], 
  entries: TimeEntry[]
) {
  const batch = writeBatch(db);
  
  for (const project of projects) {
    const projectRef = doc(db, getUserProjectsPath(uid), project.id);
    batch.set(projectRef, project);
  }
  
  for (const entry of entries) {
    const entryRef = doc(db, getUserEntriesPath(uid), entry.id);
    batch.set(entryRef, entry);
  }
  
  await batch.commit();
}
