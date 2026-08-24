import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { APPROVAL_STATUS } from '../utils/constants'

const EVENTS_COLLECTION = 'events'
const REGISTRATIONS_COLLECTION = 'registrations'

// Events
export const fetchApprovedEvents = async () => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('approvalStatus', '==', APPROVAL_STATUS.APPROVED),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    // Fallback if index isn't ready
    if (error.code === 'failed-precondition') {
      console.warn('Index missing — fetching approved events without order.')
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('approvalStatus', '==', APPROVAL_STATUS.APPROVED)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    }
    throw error
  }
}

// Backward-compatible alias
export const fetchEvents = fetchApprovedEvents

export const fetchEventById = async (id) => {
  const docRef = doc(db, EVENTS_COLLECTION, id)
  const snapshot = await getDoc(docRef)
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() }
  }
  return null
}

export const createEvent = async (eventData) => {
  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
    ...eventData,
    approvalStatus: eventData.approvalStatus || APPROVAL_STATUS.PENDING,
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    registeredCount: 0,
  })
  return docRef.id
}

export const fetchMyProposals = async (uid) => {
  if (!uid) return []

  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('createdBy', '==', uid),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    }

    const legacyQ = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', uid)
    )
    const legacySnapshot = await getDocs(legacyQ)
    return legacySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('createdBy', '==', uid)
      )
      const snapshot = await getDocs(q)
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      }

      const legacyQ = query(
        collection(db, EVENTS_COLLECTION),
        where('organizerId', '==', uid)
      )
      const legacySnapshot = await getDocs(legacyQ)
      return legacySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    }
    throw error
  }
}

export const fetchPendingEventsForAdmin = async () => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('approvalStatus', '==', APPROVAL_STATUS.PENDING),
      orderBy('createdAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, EVENTS_COLLECTION),
        where('approvalStatus', '==', APPROVAL_STATUS.PENDING)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    }
    throw error
  }
}

export const reviewEventProposal = async ({
  eventId,
  nextStatus,
  reviewerUid,
  rejectionReason,
}) => {
  const docRef = doc(db, EVENTS_COLLECTION, eventId)
  await updateDoc(docRef, {
    approvalStatus: nextStatus,
    reviewedBy: reviewerUid || null,
    reviewedAt: serverTimestamp(),
    rejectionReason:
      nextStatus === APPROVAL_STATUS.REJECTED
        ? rejectionReason || 'No reason provided'
        : null,
  })
}

export const resubmitEventProposal = async (eventId) => {
  const docRef = doc(db, EVENTS_COLLECTION, eventId)
  await updateDoc(docRef, {
    approvalStatus: APPROVAL_STATUS.PENDING,
    resubmittedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  })
}

export const updateEvent = async (id, updates) => {
  const docRef = doc(db, EVENTS_COLLECTION, id)
  await updateDoc(docRef, updates)
}

export const deleteEvent = async (id) => {
  await deleteDoc(doc(db, EVENTS_COLLECTION, id))
}

// Registrations
export const registerForEvent = async (eventId, currentUser) => {
  const authUser = auth.currentUser
  if (!authUser?.uid) {
    throw new Error('Not authenticated')
  }

  const registrationData = {
    uid: authUser.uid,
    eventId,
    attended: false,
    registeredAt: new Date(),
  }

  if (authUser.displayName || currentUser?.displayName) {
    registrationData.displayName = authUser.displayName || currentUser.displayName
  }

  if (authUser.email || currentUser?.email) {
    registrationData.email = authUser.email || currentUser.email
  }

  const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), registrationData)
  return docRef.id
}

export const checkUserAttendance = async (eventId, userId) => {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('eventId', '==', eventId),
      where('uid', '==', userId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return false
    return snapshot.docs[0].data().attended || false
  } catch (error) {
    console.error('Error checking attendance:', error)
    return false
  }
}

export const subscribeUserAttendance = (eventId, userId, onChange, onError) => {
  if (!eventId || !userId) {
    if (typeof onChange === 'function') onChange(false)
    return () => { }
  }

  const q = query(
    collection(db, REGISTRATIONS_COLLECTION),
    where('eventId', '==', eventId),
    where('uid', '==', userId),
    limit(1)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        if (typeof onChange === 'function') onChange(false)
        return
      }

      const hasAttended = snapshot.docs[0].data().attended || false
      if (typeof onChange === 'function') onChange(hasAttended)
    },
    (error) => {
      console.error('Error listening for attendance updates:', error)
      if (typeof onError === 'function') onError(error)
    }
  )
}

export const fetchUserEventRegistration = async (eventId, userId) => {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where("eventId", "==", eventId),
      where("uid", "==", userId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() }
  } catch (error) {
    return null
  }
}

export const fetchRegistrations = async (eventId) => {
  try {
    // Try with ordering (requires composite index)
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('registeredAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    // Fallback without ordering if composite index doesn't exist yet
    if (error.code === 'failed-precondition') {
      console.warn('Composite index missing — fetching without order. Check Firestore console for index link.')
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('eventId', '==', eventId)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    }
    throw error
  }
}

export const markAttendance = async (registrationId) => {
  const docRef = doc(db, REGISTRATIONS_COLLECTION, registrationId)
  await updateDoc(docRef, { attended: true, attendedAt: serverTimestamp() })
}

export const fetchUserRegistrations = async (uid) => {
  try {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where('uid', '==', uid),
      orderBy('registeredAt', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (error) {
    if (error.code === 'failed-precondition') {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where('uid', '==', uid)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
    throw error
  }
}
