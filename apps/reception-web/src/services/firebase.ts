import { initializeApp } from 'firebase/app'
import {
  connectFirestoreEmulator,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  addDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}

export function listenPrograms(callback: (programs: unknown[]) => void) {
  const programsRef = collection(db, 'programs')
  const programsQuery = query(programsRef)
  return onSnapshot(programsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    callback(items)
  })
}

export async function addReceptionRecord(data: unknown) {
  const receptionsRef = collection(db, 'receptions')
  const docRef = await addDoc(receptionsRef, data as Record<string, unknown>)
  return docRef.id
}

export async function updateProgramCapacity(programId: string, remaining: number) {
  const programDoc = doc(db, 'programs', programId)
  await updateDoc(programDoc, { remaining })
}
