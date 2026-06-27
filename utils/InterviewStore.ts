import { db } from "./firebase.js";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface InterviewSession {
  questions: string[];          // List of questions asked
  warningCount: number;         // Out-of-scope warnings (0 to 4)
  currentQuestionIndex: number; // 1 to 5
  lockedUntil: number;          // Timestamp in ms when lockout ends
  isTerminated: boolean;        // Whether the interview has ended
  createdAt: number;
  lastUpdatedAt: number;
}

// In-memory fallback map to ensure 100% resilience
const memoryStore = new Map<string, InterviewSession>();

export async function getInterviewSession(clientId: string): Promise<InterviewSession> {
  const defaultSession: InterviewSession = {
    questions: [],
    warningCount: 0,
    currentQuestionIndex: 1,
    lockedUntil: 0,
    isTerminated: false,
    createdAt: Date.now(),
    lastUpdatedAt: Date.now()
  };

  if (!db) {
    if (!memoryStore.has(clientId)) {
      memoryStore.set(clientId, { ...defaultSession });
    }
    return memoryStore.get(clientId)!;
  }

  try {
    const docRef = doc(db, "interview_sessions", clientId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as InterviewSession;
    } else {
      // Create new session in Firestore
      await setDoc(docRef, defaultSession);
      return defaultSession;
    }
  } catch (error) {
    console.warn(`Firestore getInterviewSession failed for client ${clientId}, using memory fallback:`, error);
    if (!memoryStore.has(clientId)) {
      memoryStore.set(clientId, { ...defaultSession });
    }
    return memoryStore.get(clientId)!;
  }
}

export async function saveInterviewSession(clientId: string, session: InterviewSession): Promise<void> {
  session.lastUpdatedAt = Date.now();
  
  // Always update memory store
  memoryStore.set(clientId, session);

  if (!db) return;

  try {
    const docRef = doc(db, "interview_sessions", clientId);
    await setDoc(docRef, session);
  } catch (error) {
    console.warn(`Firestore saveInterviewSession failed for client ${clientId}:`, error);
  }
}
