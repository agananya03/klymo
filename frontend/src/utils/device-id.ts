import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { openDB } from 'idb';

const DB_NAME = 'anonymousChat';
const STORE_NAME = 'identity';
const KEY_NAME = 'deviceId';

async function getStoredDeviceId(): Promise<string | undefined> {
  try {
    const db = await openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME);
      },
    });
    return await db.get(STORE_NAME, KEY_NAME);
  } catch (error) {
    console.error('Error accessing IndexedDB:', error);
    return undefined;
  }
}

async function storeDeviceId(deviceId: string): Promise<void> {
  try {
    const db = await openDB(DB_NAME, 1);
    await db.put(STORE_NAME, deviceId, KEY_NAME);
  } catch (error) {
    console.error('Error storing to IndexedDB:', error);
  }
}

async function hashString(str: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function generateDeviceId(): Promise<string> {
  // 1. Check if ID already exists in IndexedDB
  const storedId = await getStoredDeviceId();
  if (storedId) {
    console.log('Device ID retrieved from storage:', storedId);
    return storedId;
  }

  // 2. Generate a fresh Random UUID
  // This ensures new sessions (Incognito) get a unique ID
  const deviceId = crypto.randomUUID();

  // 3. Store in IndexedDB
  await storeDeviceId(deviceId);
  console.log('New Random Device ID generated and stored:', deviceId);

  return deviceId;
}
