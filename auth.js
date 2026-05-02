import { initializeApp }                                           from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         signOut }                                                  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc }                               from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── FIREBASE CONFIG — replace with your project values from the Firebase console ──
const firebaseConfig = {
  apiKey:            "AIzaSyD8J3UWxOgkUFjfTTM0GNlRoFmRsbo1Pro",
  authDomain:        "visora-oracle.firebaseapp.com",
  projectId:         "visora-oracle",
  storageBucket:     "visora-oracle.firebasestorage.app",
  messagingSenderId: "1039441839306",
  appId:             "1:1039441839306:web:1dbc6c4d444c966744e033",
  measurementId:     "G-4SPSL1C60P",
};
// ───────────────────────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

export { onAuthStateChanged, signInWithEmailAndPassword, signOut };

async function fetchUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data();
  } catch (_) {}
  return null;
}

export async function applySession(user) {
  const profile = await fetchUserProfile(user.uid);
  const role    = profile?.role || 'trainee';
  const name    = profile?.name || user.email.split('@')[0];

  document.body.classList.remove('role-senior', 'role-trainee');
  document.body.classList.add(`role-${role}`);

  const nameEl   = document.getElementById('navUserName');
  const badgeEl  = document.getElementById('navRoleBadge');
  const avatarEl = document.getElementById('navAvatar');

  if (nameEl)  nameEl.textContent = name;
  if (badgeEl) {
    badgeEl.textContent = role.charAt(0).toUpperCase() + role.slice(1);
    badgeEl.className   = `navbar-role-badge badge-${role}`;
  }
  if (avatarEl) {
    avatarEl.textContent = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}

export function setupSignOut(redirectTo = 'login.html') {
  const btn = document.getElementById('signOutBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    await signOut(auth);
    window.location.replace(redirectTo);
  });
}
