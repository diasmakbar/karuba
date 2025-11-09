import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  set,
  update,
  get,
  child,
  push,
  serverTimestamp
} from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCbZ5Ca6sMcCdYTE5A1hCq6Vr3NJvPotAQ",
  authDomain: "decryptor-game.firebaseapp.com",
  databaseURL: "https://decryptor-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "decryptor-game",
  storageBucket: "decryptor-game.firebasestorage.app",
  messagingSenderId: "285400526933",
  appId: "1:285400526933:web:8c8f9f4fc39c97c8c8a4dc",
  measurementId: "G-ZRDVJX3P31"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export const auth = getAuth(app);
export const authReady = new Promise<void>((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("✅ anon uid:", user.uid);
      unsub();
      resolve();
    }
  });
  signInAnonymously(auth).catch((e) => {
    console.error("❌ anon auth error:", e);
    resolve();
  });
});

export { ref, onValue, set, update, get, child, push, serverTimestamp };
