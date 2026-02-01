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

  // 2. Initialize FingerprintJS
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  
  // 3. Collect entropy sources
  const entropy = {
    visitorId: result.visitorId,
    language: navigator.language,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
  };

  // 4. Create a consistent string from entropy
  // Sorting keys to ensure consistency regardless of object property order
  const entropyString = Object.keys(entropy)
    .sort()
    .map((key) => `${key}:${entropy[key as keyof typeof entropy]}`)
    .join('|');

  console.log('Entropy string for hashing:', entropyString);

  // 5. Hash the combined string
  const deviceId = await hashString(entropyString);

  // 6. Store in IndexedDB
  await storeDeviceId(deviceId);
  console.log('New Device ID generated and stored:', deviceId);

  return deviceId;
}
