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
  deleteDoc,
  setDoc,
  getDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
  type User,
} from 'firebase/auth'
import type { Program, Reservation, ReceptionSettings } from '@/features/admin/types'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR) {
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectAuthEmulator(auth, 'http://localhost:9099')
}

// ===== 認証関連 =====
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function loginAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logoutAdmin() {
  return signOut(auth)
}

export function getCurrentUser() {
  return auth.currentUser
}

// ===== プログラム関連 =====
export function listenPrograms(callback: (programs: Program[]) => void) {
  const programsRef = collection(db, 'programs')
  const programsQuery = query(programsRef, orderBy('order', 'asc'))
  return onSnapshot(programsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Program[]
    callback(items)
  })
}

export async function addProgram(program: Omit<Program, 'id'>) {
  const programsRef = collection(db, 'programs')
  const docRef = await addDoc(programsRef, {
    ...program,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateProgram(id: string, data: Partial<Program>) {
  const programRef = doc(db, 'programs', id)
  await updateDoc(programRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteProgram(id: string) {
  const programRef = doc(db, 'programs', id)
  await deleteDoc(programRef)
}

// ===== 予約関連 =====
export function listenReservations(callback: (reservations: Reservation[]) => void) {
  const reservationsRef = collection(db, 'receptions')
  const reservationsQuery = query(reservationsRef, orderBy('createdAt', 'desc'))
  return onSnapshot(reservationsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
      }
    }) as Reservation[]
    callback(items)
  })
}

export async function updateReservation(id: string, data: Partial<Reservation>) {
  const reservationRef = doc(db, 'receptions', id)
  await updateDoc(reservationRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteReservation(id: string) {
  const reservationRef = doc(db, 'receptions', id)
  await deleteDoc(reservationRef)
}

// ===== 設定関連 =====
const SETTINGS_DOC_ID = 'reception-settings'

export function listenSettings(callback: (settings: ReceptionSettings | null) => void) {
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID)
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as ReceptionSettings)
    } else {
      callback(null)
    }
  })
}

export async function updateSettings(settings: Partial<ReceptionSettings>) {
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID)
  const snapshot = await getDoc(settingsRef)
  if (snapshot.exists()) {
    await updateDoc(settingsRef, settings)
  } else {
    await setDoc(settingsRef, settings)
  }
}

// ===== 統計関連 =====

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
