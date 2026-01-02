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

// Backend handles writes now, so we remove addReceptionRecord and updateProgramCapacity
// to prevent accidental usage.

export function listenStats(callback: (stats: any) => void) {
  const receptionsRef = collection(db, 'receptions')
  // Listen to all changes to calculate stats client-side (or server side triggers could maintain a stats doc)
  // For now, client-side aggregation from snapshot is fine for small scale
  return onSnapshot(receptionsRef, (snapshot) => {
    let completed = 0
    let waiting = 0
    let reserved = 0
    let walkIn = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.status === 'completed') completed++
      if (data.status === 'waiting') waiting++
      if (data.attendee?.reserved) reserved++
      else walkIn++
    })

    callback({ completed, waiting, reserved, walkIn })
  })
}
