import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdjRu_pI_Jcu5Jq8P03JO17rKBE0XkpvI",
  authDomain: "phs-esports-5fce8.firebaseapp.com",
  projectId: "phs-esports-5fce8",
  storageBucket: "phs-esports-5fce8.firebasestorage.app",
  messagingSenderId: "628629574347",
  appId: "1:628629574347:web:0f0b9ffbec602b0465c14e",
  measurementId: "G-7YL5S8H4YV"
};

// Add every admin account that should be allowed to edit the website.
const allowedAdminEmails = [
  "your-admin-email@gmail.com"
];

const managedStorageKeys = [
  "adminEventScheduleData",
  "adminAnnouncementsData",
  "adminImportantMembersData",
  "adminHiddenImportantMembers",
  "adminFAQData",
  "adminVideoHighlights",
  "adminClipWeeks",
  "adminBracketData",
  "bracketPredictions"
];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const siteDataRef = doc(db, "siteContent", "live");
let isApplyingRemoteData = false;
let lastUploadedJson = "";

setupAdminDialog();
setupLocalStorageSync();
listenForSharedData();
listenForAuthState();

window.firebaseAdminSignIn = async (email, password) => {
  const trimmedEmail = String(email || "").trim();
  if (!trimmedEmail || !password) {
    throw new Error("Enter your admin email and password.");
  }
  const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
  assertAllowedAdmin(result.user);
  return result.user;
};

window.firebaseGoogleAdminSignIn = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  assertAllowedAdmin(result.user);
  return result.user;
};

window.firebaseAdminSignOut = () => signOut(auth);

function setupAdminDialog() {
  const dialog = document.querySelector("#adminDialog");
  const form = document.querySelector("#adminForm");
  if (!dialog || !form) return;

  const heading = dialog.querySelector("h2");
  const intro = dialog.querySelector("p");
  if (heading) heading.textContent = "Admin Login";
  if (intro) intro.textContent = "Sign in with an approved admin email or Google account to edit the site.";

  form.innerHTML = `
    <label for="adminEmail">Email</label>
    <input id="adminEmail" type="email" autocomplete="email" required>
    <label for="adminPassword">Password</label>
    <input id="adminPassword" type="password" autocomplete="current-password" required>
    <p class="form-message" aria-live="polite"></p>
    <button class="btn btn-primary" type="submit">Log in with email</button>
    <button class="btn btn-secondary" id="googleLoginButton" type="button">Log in with Google</button>
    <button class="btn btn-secondary" id="closeDialog" type="button">Cancel</button>
  `;

  form.querySelector("#closeDialog")?.addEventListener("click", () => dialog.close());
  form.querySelector("#googleLoginButton")?.addEventListener("click", async () => {
    const message = form.querySelector(".form-message");
    try {
      if (message) message.textContent = "Opening Google sign-in...";
      await window.firebaseGoogleAdminSignIn();
      if (message) message.textContent = "Login successful.";
      dialog.close();
      form.reset();
    } catch (error) {
      if (message) message.textContent = error?.message || "Google sign-in failed.";
    }
  });
}

function setupLocalStorageSync() {
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => {
    originalSetItem(key, value);
    if (!isApplyingRemoteData && managedStorageKeys.includes(key) && isCurrentUserAllowed()) {
      uploadSharedSiteData().catch(error => {
        console.error("Could not save shared Firebase site data:", error);
      });
    }
  };
}

function listenForSharedData() {
  onSnapshot(siteDataRef, snapshot => {
    if (!snapshot.exists()) {
      if (isCurrentUserAllowed()) {
        uploadSharedSiteData().catch(error => {
          console.error("Could not create shared Firebase site data:", error);
        });
      }
      updateHomeAnnouncement();
      return;
    }

    const data = snapshot.data() || {};
    const values = data.localStorage || {};
    const changedKeys = [];

    isApplyingRemoteData = true;
    managedStorageKeys.forEach(key => {
      if (!(key in values)) return;
      const nextValue = JSON.stringify(values[key]);
      if (localStorage.getItem(key) !== nextValue) {
        localStorage.setItem(key, nextValue);
        changedKeys.push(key);
      }
    });
    isApplyingRemoteData = false;
    lastUploadedJson = JSON.stringify(readManagedStorage());

    updateHomeAnnouncement();
    if (changedKeys.length > 0) {
      window.dispatchEvent(new CustomEvent("firebase-site-data-updated", { detail: { changedKeys } }));
    }
  }, error => {
    console.error("Could not read shared Firebase site data:", error);
  });
}

function listenForAuthState() {
  onAuthStateChanged(auth, user => {
    if (user && isAllowedEmail(user.email)) {
      localStorage.setItem("isCaptain", "true");
    } else {
      localStorage.removeItem("isCaptain");
      if (user) signOut(auth);
    }
    window.dispatchEvent(new CustomEvent("firebase-admin-state-changed", {
      detail: { email: user?.email || "", isAdmin: isCurrentUserAllowed() }
    }));
  });
}

async function uploadSharedSiteData() {
  const payload = readManagedStorage();
  const payloadJson = JSON.stringify(payload);
  if (payloadJson === lastUploadedJson) return;
  lastUploadedJson = payloadJson;
  await setDoc(siteDataRef, {
    localStorage: payload,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || "unknown"
  }, { merge: true });
}

function readManagedStorage() {
  return managedStorageKeys.reduce((payload, key) => {
    payload[key] = parseStoredValue(key);
    return payload;
  }, {});
}

function parseStoredValue(key) {
  const rawValue = localStorage.getItem(key);
  if (rawValue === null) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

function assertAllowedAdmin(user) {
  if (isAllowedEmail(user?.email)) return;
  signOut(auth);
  throw new Error("This account is not on the admin email list.");
}

function isCurrentUserAllowed() {
  return isAllowedEmail(auth.currentUser?.email);
}

function isAllowedEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return allowedAdminEmails.map(item => item.toLowerCase()).includes(normalizedEmail);
}

function updateHomeAnnouncement() {
  const contentElement = document.querySelector("#announcement-content");
  if (!contentElement) return;

  const announcements = parseStoredValue("adminAnnouncementsData");
  const latest = Array.isArray(announcements)
    ? announcements
      .filter(item => item?.title && item?.details && !Number.isNaN(Date.parse(item.createdAt)))
      .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))[0]
    : null;

  contentElement.textContent = latest
    ? `${latest.title}: ${latest.details}`
    : "No current announcements found.";
}
