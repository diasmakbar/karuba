import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, get, child, push, serverTimestamp } from "firebase/database";
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

const auth = getAuth();
signInAnonymously(auth)
  .then(() => console.log("Signed in anonymously"))
  .catch((error) => console.error("Auth error:", error));

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User UID:", user.uid);
  }
});

export const db = getDatabase(app);

export { ref, onValue, set, update, get, child, push, serverTimestamp };


// import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"
// import type { User } from "firebase/auth"
// import { getAnalytics } from "firebase/analytics";

// const firebaseConfig = {
//   apiKey: "xxx",
//   authDomain: "xxx.firebaseapp.com",
//   databaseURL: "https://decryptor-game-default-rtdb.firebaseio.com",
//   projectId: "decryptor-game",
//   appId: "xxx"
// };
// const analytics = getAnalytics(app);
// export const auth = getAuth(app);
// export async function ensureAuth(): Promise<User> {
//   if (!auth.currentUser) await signInAnonymously(auth);
//   return new Promise(resolve => onAuthStateChanged(auth, u => u && resolve(u)));
// }
