import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your custom Firebase Credentials
const firebaseConfig = {
  apiKey: "AIzaSyD_pi_Jcu6Jq0P03JO17rK8E0XkpvI",
  authDomain: "phs-esports-5fce8.firebaseapp.com",
  projectId: "phs-esports-5fce8",
  storageBucket: "phs-esports-5fce8.appspot.com",
  messagingSenderId: "628629574347",
  appId: "1:628629574347:web:0f0b9ffbec602b0465c14e"
};

// Fire up connection
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Target your HTML elements
const adminForm = document.querySelector("#adminForm");
const adminDialog = document.querySelector("#adminDialog");

if (adminForm) {
  adminForm.addEventListener("submit", async (event) => {
    // Stop form from refreshing page and breaking execution
    event.preventDefault();
    
    const password = adminForm.querySelector("#password").value;
    const message = adminForm.querySelector(".form-message");

    // Match your exact captain password from main.js
    if (password === "captain2026") {
      
      // Let the admin type the live update directly in a prompt box
      const liveText = prompt("Login successful! Enter the new text for your Home Page announcement card:");
      
      if (liveText) {
        message.textContent = "Updating across devices via Firebase...";
        
        try {
          // Tell Firebase to update your schedule_info document
          const docRef = doc(db, "announcements", "schedule_info");
          await updateDoc(docRef, {
            text: liveText
          });

          message.textContent = "Database saved successfully!";
          
          setTimeout(() => {
            if (adminDialog) adminDialog.close();
            adminForm.reset();
            message.textContent = "";
          }, 1500);

        } catch (error) {
          console.error("Firebase update failed: ", error);
          message.textContent = "Database error. Check your Firestore connection.";
        }
      }
    }
  });
}