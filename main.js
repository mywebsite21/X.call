import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';

// ---- INIT SYSTEM & ICONS ----
document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();
    
    // Setup Admin Referral check from URL
    handleAdminReferral();
    
    // Generate Financial Ticker
    generateTicker();

    // Scroll Observer for UI animations
    setupScrollAnimations();
    
    // Modal Interaction Setup
    setupModal();
    
    // Setup Firebase Form Submission
    setupFirebaseForm();
});

// ---- CORE FUNCTIONS ----

function handleAdminReferral() {
    let adminId = null;
    const path = window.location.pathname;
    
    if (path.includes('/X.call/')) {
       const parts = path.split('/X.call/');
       if (parts[1] && parts[1] !== "" && parts[1] !== "index.html") {
          adminId = parts[1].replace(/\/$/, "");
       }
    } else {
       // Optional: fallback directly from slash if deployed differently
       const parts = path.split('/');
       const last = parts[parts.length - 1];
       if (last && last !== "" && last !== "index.html" && last !== "X.call") {
          adminId = last;
       }
    }

    if (adminId) {
       // Show in nav
       const navBadge = document.getElementById('nav-admin-badge');
       const navText = document.getElementById('nav-admin-text');
       if (navBadge) {
           navBadge.classList.remove('hidden');
           navBadge.classList.add('flex');
           navText.innerText = adminId + ' Referral';
       }

       // Show in modal
       const modalBadge = document.getElementById('modal-admin-badge');
       const modalText = document.getElementById('modal-admin-text');
       if(modalBadge) {
         modalBadge.classList.remove('hidden');
         modalBadge.classList.add('flex');
         modalText.innerText = 'Referral: ' + adminId;
       }
       
       // Store globally for submission
       window.currentAdminId = adminId;
    }
}

function generateTicker() {
    const pairs = [
      { label: "EUR/USD", val: "1.0945", change: "+0.12%", up: true },
      { label: "GBP/JPY", val: "188.30", change: "+0.45%", up: true },
      { label: "XAU/USD", val: "2034.50", change: "-0.21%", up: false },
      { label: "BTC/USD", val: "52400.00", change: "+2.10%", up: true },
      { label: "USD/CAD", val: "1.3420", change: "-0.05%", up: false },
      { label: "AUD/USD", val: "0.6540", change: "+0.33%", up: true },
    ];
    
    const tickerContent = document.getElementById('ticker-content');
    if (tickerContent) {
      let html = '';
      const displayPairs = [...pairs, ...pairs, ...pairs, ...pairs]; // Loop seamlessly
      
      displayPairs.forEach(p => {
        const iconSrc = p.up ? "trending-up" : "trending-down";
        const colorClass = p.up ? "text-emerald-400" : "text-rose-400";
        
        html += `
          <div class="flex items-center gap-2 font-mono text-sm">
            <span class="font-bold text-gray-300">${p.label}</span>
            <span class="text-white">${p.val}</span>
            <span class="${colorClass}">${p.change}</span>
            <i data-lucide="${iconSrc}" class="w-3 h-3 ${colorClass}"></i>
          </div>
        `;
      });
      tickerContent.innerHTML = html;
      lucide.createIcons(); // Re-render inserted icons
    }
}

function setupScrollAnimations() {
    const progressBar = document.getElementById('scroll-progress');
    const navbar = document.getElementById('navbar');
    
    // Top Scroll Progress Line & Navbar style
    window.addEventListener('scroll', () => {
       const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
       const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
       const scrolled = (winScroll / height);
       
       if (progressBar) progressBar.style.transform = `scaleX(${scrolled})`;

       if (winScroll > 50) {
          navbar.classList.add('glass-premium', 'py-3');
          navbar.classList.remove('bg-transparent', 'py-6');
       } else {
          navbar.classList.add('bg-transparent', 'py-6');
          navbar.classList.remove('glass-premium', 'py-3');
       }
    });

    // Intersection Observer for revealing elements on scroll
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
       entries.forEach(entry => {
          if (entry.isIntersecting) {
             entry.target.classList.add('is-visible');
             
             // Handle SVG Chart fill animation precisely when viewed
             const svgContainer = entry.target.querySelector('.svg-container');
             if(svgContainer || entry.target.classList.contains('svg-container')) {
                 const svgBox = svgContainer || entry.target;
                 svgBox.classList.add('chart-animate');
                 const fillPath = svgBox.querySelector('.anim-chart-fill');
                 if(fillPath) {
                     fillPath.classList.remove('opacity-0', 'translate-y-[100px]');
                     fillPath.classList.add('opacity-1', 'translate-y-0');
                 }
             }

             // Handle Counter Animations
             const counters = entry.target.querySelectorAll('.counter');
             counters.forEach(counter => {
                 startCounter(counter);
                 counter.classList.remove('counter'); // prevent re-run
             });

             observer.unobserve(entry.target);
          }
       });
    }, observerOptions);

    document.querySelectorAll('.reveal-up').forEach(el => animateOnScroll.observe(el));
}

function startCounter(el) {
    const end = parseInt(el.getAttribute('data-target'));
    const duration = 2500;
    let startTimestamp = null;
    
    const step = (timestamp) => {
       if(!startTimestamp) startTimestamp = timestamp;
       const progress = Math.min((timestamp - startTimestamp) / duration, 1);
       // easeOutQuart
       const easeProgress = 1 - Math.pow(1 - progress, 4);
       el.innerText = Math.floor(easeProgress * end);
       if (progress < 1) {
          window.requestAnimationFrame(step);
       }
    };
    window.requestAnimationFrame(step);
}

function setupModal() {
    const modal = document.getElementById('registration-modal');
    const backdrop = document.getElementById('modal-backdrop');
    const content = document.getElementById('modal-content');
    const closeBtn = document.getElementById('close-modal-btn');
    const openBtns = document.querySelectorAll('.open-modal-btn');

    const openModal = () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Trigger transitons with small delay
        setTimeout(() => {
            backdrop.classList.remove('opacity-0');
            backdrop.classList.add('opacity-100');
            content.classList.remove('scale-90', 'opacity-0', 'translate-y-8');
            content.classList.add('scale-100', 'opacity-100', 'translate-y-0');
        }, 10);
    };

    const closeModal = () => {
        backdrop.classList.add('opacity-0');
        backdrop.classList.remove('opacity-100');
        content.classList.add('scale-90', 'opacity-0', 'translate-y-8');
        content.classList.remove('scale-100', 'opacity-100', 'translate-y-0');
        
        // Hide after transition
        setTimeout(() => {
          modal.classList.add('hidden');
          modal.classList.remove('flex');
        }, 300);
    };

    openBtns.forEach(btn => btn.addEventListener('click', openModal));
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
}

function setupFirebaseForm() {
    // Initialize Firebase
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
       
       // Show loading wheel on button
       submitBtn.disabled = true;
       submitBtn.innerHTML = '<div class="w-5 h-5 border-2 border-darker/50 border-t-darker rounded-full animate-spin"></div>';

       const fullName = document.getElementById('input-name').value;
       const telegramUsername = document.getElementById('input-tg').value;
       const whatsappNumber = document.getElementById('input-wa').value;
       const memberId = 'FXG-' + Math.floor(100000 + Math.random() * 900000);
       const now = new Date();
       
       let redirectUrl = "https://t.me/placeholder_fxgroup"; // Default fallback link

       try {
          // ১. ইউজারের ডাটা সেভ করা (adminId ফিল্ড ব্যবহার করে)
          await addDoc(collection(db, "users"), {
             fullName,
             telegramUsername,
             whatsappNumber,
             adminId: window.currentAdminId || 'organic',
             referralUrl: window.location.href,
             sourceLink: document.referrer || 'direct',
             registrationDate: now.toLocaleDateString(),
             registrationTime: now.toLocaleTimeString(),
             memberId,
             createdAt: serverTimestamp()
          });

          // ২. ডাইনামিক টেলিগ্রাম লিংক ফেচ করা
          if (window.currentAdminId && window.currentAdminId !== 'organic') {
              try {
                  const adminDocRef = doc(db, "admins", window.currentAdminId);
                  const adminSnapshot = await getDoc(adminDocRef);
                  if (adminSnapshot.exists() && adminSnapshot.data().telegramLink) {
                      redirectUrl = adminSnapshot.data().telegramLink;
                  }
              } catch (fetchError) {
                  console.error("Error fetching admin telegram link: ", fetchError);
              }
          }

          // Transition to Success Modal
          formView.classList.add('opacity-0');
          setTimeout(() => {
              formView.classList.add('hidden');
              successView.classList.remove('hidden');
              successView.classList.add('flex');
              
              // Reflow
              void successView.offsetWidth;
              successView.classList.remove('opacity-0');
              successView.classList.add('opacity-100');
              
              // Start progress bar animation
              setTimeout(() => {
                const sp = document.getElementById('success-progress');
                if(sp) sp.style.width = '100%';
              }, 100);
          }, 300);

          // Redirect to the Dynamic Telegram Link
          setTimeout(() => {
             window.location.href = redirectUrl;
          }, 2800);

       } catch (err) {
          console.error(err);
          alert('Error saving registration. See console.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Authorize & Connect';
       }
    });
}
