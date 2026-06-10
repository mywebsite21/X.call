import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

// ---- INIT SYSTEM & ICONS ----
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    handleAdminReferral();
    generateTicker();
    setupScrollAnimations();
    setupModal();
    setupFirebaseForm();
});

// ---- CORE FUNCTIONS ----

function handleAdminReferral() {
    let adminId = null;
    const path = window.location.pathname;
    
    // URL থেকে আইডি বের করা
    const parts = path.split('/');
    const last = parts[parts.length - 1];
    if (last && last !== "" && last !== "index.html") {
        adminId = last;
    }

    if (adminId) {
       window.currentAdminId = adminId;
       const modalText = document.getElementById('modal-admin-text');
       if(modalText) modalText.innerText = 'Referral: ' + adminId;
    } else {
       window.currentAdminId = 'organic';
    }
}

function generateTicker() {
    const pairs = [
      { label: "EUR/USD", val: "1.0945", change: "+0.12%", up: true },
      { label: "GBP/JPY", val: "188.30", change: "+0.45%", up: true },
      { label: "XAU/USD", val: "2034.50", change: "-0.21%", up: false }
    ];
    const tickerContent = document.getElementById('ticker-content');
    if (tickerContent) {
      let html = '';
      pairs.forEach(p => {
        html += `<div class="flex items-center gap-2 font-mono text-sm">
            <span class="font-bold text-gray-300">${p.label}</span>
            <span class="text-white">${p.val}</span>
            <span class="${p.up ? 'text-emerald-400' : 'text-rose-400'}">${p.change}</span>
          </div>`;
      });
      tickerContent.innerHTML = html;
    }
}

function setupScrollAnimations() { /* ... আপনার আগের কোড অনুযায়ী ... */ }
function setupModal() { /* ... আপনার আগের কোড অনুযায়ী ... */ }

function setupFirebaseForm() {
    const firebaseConfig = {
      apiKey: "AIzaSyAwS7AZewx0L8KRGeFXB7Jq4BJEbSB0xO0",
      authDomain: "fxgroup-5dd7c.firebaseapp.com",
      projectId: "fxgroup-5dd7c",
      storageBucket: "fxgroup-5dd7c.firebasestorage.app",
      messagingSenderId: "982128077012",
      appId: "1:982128077012:web:e5088b7be662cecf20f341",
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const form = document.getElementById('auth-form');
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');
    const submitBtn = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
       e.preventDefault();
       submitBtn.disabled = true;
       submitBtn.innerHTML = 'Processing...';

       const fullName = document.getElementById('input-name').value;
       const telegramUsername = document.getElementById('input-tg').value;
       const whatsappNumber = document.getElementById('input-wa').value;

       try {
          // ১. ডাটাবেসে adminId সেভ করা হচ্ছে (এডমিন প্যানেলের সাথে মিল রেখে)
          await addDoc(collection(db, "members"), {
             name: fullName,
             telegramUsername,
             whatsappNumber,
             adminId: window.currentAdminId || 'organic',
             createdAt: serverTimestamp()
          });

          // ২. ডাইনামিক টেলিগ্রাম লিঙ্ক খুঁজে বের করা
          let redirectUrl = "https://t.me/placeholder_fxgroup"; // ডিফল্ট
          if (window.currentAdminId && window.currentAdminId !== 'organic') {
             const adminSnap = await getDoc(doc(db, "admins", window.currentAdminId));
             if (adminSnap.exists() && adminSnap.data().telegramLink) {
                redirectUrl = adminSnap.data().telegramLink;
             }
          }

          // UI Transition
          formView.classList.add('hidden');
          successView.classList.remove('hidden');
          
          // রিডাইরেক্ট
          setTimeout(() => {
             window.location.href = redirectUrl;
          }, 2000);

       } catch (err) {
          console.error(err);
          alert('Error: ' + err.message);
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Authorize & Connect';
       }
    });
}
