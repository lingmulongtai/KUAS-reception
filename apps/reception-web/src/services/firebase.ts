import { initializeApp, type FirebaseApp } from 'firebase/app'
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
  type Firestore,
} from 'firebase/firestore'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
  type User,
  type Auth,
} from 'firebase/auth'
import type { Program, Reservation, ReceptionSettings } from '@/features/admin/types'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase が有効かどうかをチェック
const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)

    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR) {
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectAuthEmulator(auth, 'http://localhost:9099')
    }
  } catch (e) {
    console.warn('Firebase initialization failed:', e)
  }
}

// ===== 認証関連 =====
export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    // Firebase が設定されていない場合は即座にnullを返す
    callback(null)
    return () => {} // 空のunsubscribe関数
  }
  return onAuthStateChanged(auth, callback)
}

export async function loginAdmin(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase is not configured')
  }
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logoutAdmin() {
  if (!auth) {
    return
  }
  return signOut(auth)
}

export function getCurrentUser() {
  return auth?.currentUser ?? null
}

// ===== プログラム関連 =====
export function listenPrograms(callback: (programs: Program[]) => void) {
  if (!db) {
    callback([])
    return () => {}
  }
  const programsRef = collection(db, 'programs')
  const programsQuery = query(programsRef, orderBy('order', 'asc'))
  return onSnapshot(programsQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Program[]
    callback(items)
  }, (error) => {
    console.warn('Error listening to programs:', error)
    callback([])
  })
}

export async function addProgram(program: Omit<Program, 'id'>) {
  if (!db) throw new Error('Firebase is not configured')
  const programsRef = collection(db, 'programs')
  const docRef = await addDoc(programsRef, {
    ...program,
    createdAt: Timestamp.now(),
  })
  return docRef.id
}

export async function updateProgram(id: string, data: Partial<Program>) {
  if (!db) throw new Error('Firebase is not configured')
  const programRef = doc(db, 'programs', id)
  await updateDoc(programRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteProgram(id: string) {
  if (!db) throw new Error('Firebase is not configured')
  const programRef = doc(db, 'programs', id)
  await deleteDoc(programRef)
}

// ===== 予約関連 =====
export function listenReservations(callback: (reservations: Reservation[]) => void) {
  if (!db) {
    callback([])
    return () => {}
  }
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
  }, (error) => {
    console.warn('Error listening to reservations:', error)
    callback([])
  })
}

export async function updateReservation(id: string, data: Partial<Reservation>) {
  if (!db) throw new Error('Firebase is not configured')
  const reservationRef = doc(db, 'receptions', id)
  await updateDoc(reservationRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteReservation(id: string) {
  if (!db) throw new Error('Firebase is not configured')
  const reservationRef = doc(db, 'receptions', id)
  await deleteDoc(reservationRef)
}

// ===== 設定関連 =====
const SETTINGS_DOC_ID = 'reception-settings'

export function listenSettings(callback: (settings: ReceptionSettings | null) => void) {
  if (!db) {
    callback(null)
    return () => {}
  }
  const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID)
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as ReceptionSettings)
    } else {
      callback(null)
    }
  }, (error) => {
    console.warn('Error listening to settings:', error)
    callback(null)
  })
}

export async function updateSettings(settings: Partial<ReceptionSettings>) {
  if (!db) throw new Error('Firebase is not configured')
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
  if (!db) {
    callback({ completed: 0, waiting: 0, reserved: 0, walkIn: 0 })
    return () => {}
  }
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
  }, (error) => {
    console.warn('Error listening to stats:', error)
    callback({ completed: 0, waiting: 0, reserved: 0, walkIn: 0 })
  })
}
