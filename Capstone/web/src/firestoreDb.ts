import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface SensorReadingDocument {
  id?: string;
  temperature: number;
  vibration: number;
  pressure: number;
  status: 'Normal' | 'Warning' | 'Critical';
  timestamp?: any;
}

/**
 * Helper 1: Add a document to any collection
 */
export async function addDocument<T extends DocumentData>(collectionName: string, data: T) {
  try {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`Document added to ${collectionName} with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Helper 2: Fetch all documents from a collection
 */
export async function getDocuments<T = DocumentData>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot: QuerySnapshot = await getDocs(colRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error fetching documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Helper 3: Set up a real-time listener (onSnapshot) to listen for live data changes
 */
export function subscribeToCollection<T = DocumentData>(
  collectionName: string,
  onDataChanged: (data: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
      onDataChanged(items);
    },
    (error) => {
      console.error(`Real-time listener error on ${collectionName}:`, error);
      if (onError) onError(error);
    }
  );
}

/**
 * Specialized helper: Add a Sensor Reading document
 */
export async function addSensorReading(reading: Omit<SensorReadingDocument, 'id' | 'timestamp'>) {
  return addDocument('sensor_readings', reading);
}

/**
 * Specialized helper: Fetch recent Sensor Readings
 */
export async function getSensorReadings(): Promise<SensorReadingDocument[]> {
  return getDocuments<SensorReadingDocument>('sensor_readings');
}

/**
 * Specialized helper: Subscribe to real-time Sensor Readings updates
 */
export function subscribeToSensorReadings(
  callback: (readings: SensorReadingDocument[]) => void
): Unsubscribe {
  return subscribeToCollection<SensorReadingDocument>('sensor_readings', callback);
}
