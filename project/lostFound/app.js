// ==========================================
// 1. GLOBAL INITIALIZATION & CONFIGURATION
// ==========================================
let campusItems = [];
let currentFilter = 'All';
let currentLang = 'en';
let currentLoggedInUser = null;
const MY_ADMIN_EMAIL = "sanaulislam77@gmail.com";

// DOM Elements Verification
const itemsGrid = document.getElementById('items-grid') || document.getElementById('cards-container');
const reportForm = document.getElementById('report-form');
const languageBtn = document.getElementById('language-btn');
const imagePreviewContainer = document.getElementById('image-preview-container');
let selectedImageBase64 = "";

// ==========================================
// 2. REAL-TIME DATA SYNC (FIRESTORE DATABASE)
// ==========================================
db.collection("campus_items").orderBy("time", "desc").onSnapshot((snapshot) => {
    campusItems = [];
    snapshot.forEach((doc) => {
        campusItems.push({
            id: doc.id,
            ...doc.data()
        });
    });
    console.log("Database synced. Total items:", campusItems.length);
    renderItems(); 
}, (error) => {
    console.error("Firestore loading error:", error);
});

// ==========================================
// 3. CORE RENDERING ENGINE (CARDS UI DESIGN)
// ==========================================
function renderItems() {
    if (!itemsGrid) return;
    itemsGrid.innerHTML = '';
    
    if (!campusItems || campusItems.length === 0) {
        itemsGrid.innerHTML = `<div class="loading" style="text-align:center; padding:20px; font-weight:bold; color:#666;">Loading database reports... / डेटा लोड हो रहा है...</div>`;
        return;
    }

    let count = 0;

    const labels = {
        en: { desc: "Description", loc: "Location", con: "Contact", noItem: "No reports found.", lost: "LOST", found: "FOUND", deleteBtn: "🗑️ Found / Remove", timelabel: "Time:" },
        hi: { desc: "विवरण", loc: "स्थान", con: "संपर्क", noItem: "कोई रिपोर्ट नहीं मिली।", lost: "खोया", found: "पाया", deleteBtn: "🗑️ मिल गया / हटाएँ", timelabel: "समय:" }
    };

    const locationTranslations = {
        "Aala Hazrat Gate": "आला हज़रत गेट", "Raza Nagar Transformer": "रज़ा नगर ट्रांसफार्मर",
        "Noori Masjid": "नूरी मस्जिद", "Mumtaz Hotal": "मुमताज़ होटल",
        "Madarsa Niswan": "मदरसा निस्वान", "Qassab Tola": "कस्साब टोला",
        "Raza Nagar Ground": "रज़ा नगर ग्राउंड", "Raza Nagar Tanpayi": "रज़ा नगर तन्पयी",
        "Behind Madarsa Ziyaul uloom": "मदरसा ज़ियाउल उलूम के पीछे",
        "Gate Madarsa Ziyaul uloom": "मदरसा ज़ियाउल उलूम गेट", "Raza Nagar khor": "रज़ा नगर खोर"
    };

    const user = firebase.auth().currentUser;
    const isAdmin = user && user.email === MY_ADMIN_EMAIL;

    campusItems.forEach((item) => {
        const itemType = item.itemType || item.type || "Lost";
        if (currentFilter !== 'All' && itemType !== currentFilter) return;
        count++;

        const badgeText = itemType.toLowerCase() === 'lost' ? labels[currentLang].lost : labels[currentLang].found;
        
        let displayLocation = item.location || "Unknown";
        if (currentLang === 'hi' && locationTranslations[item.location]) {
            displayLocation = locationTranslations[item.location];
        }

        let imgTag = "";
        if (item.image) {
            imgTag = `<img src="${item.image}" onclick="openModal('${item.image}')" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:10px; cursor:pointer;">`;
        }

        const displayTime = item.time || "Just now";
        const displayTitle = item.title || item.itemName || "Item";

        const card = document.createElement('div');
        card.className = 'item-card';
        
        card.innerHTML = `
            <span class="badge ${itemType.toLowerCase()}">${badgeText}</span>
            <h3>${displayTitle}</h3>
            <p style="font-size: 0.8rem; color: #777; margin: -5px 0 10px 0;"><strong>${labels[currentLang].timelabel}</strong> ${displayTime}</p>
            ${imgTag}
            <p><strong>${labels[currentLang].desc}:</strong> ${item.description || ""}</p>
            <p><strong>📍 ${labels[currentLang].loc}:</strong> ${displayLocation}</p>
            <p><strong>📞 ${labels[currentLang].con}:</strong> ${item.contact || ""}</p>
            
            <button class="admin-delete-btn" onclick="deleteCard('${item.id}')" style="display: ${isAdmin ? 'block' : 'none'}; margin-top: 15px; width: 100%; padding: 10px; background-color: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                ${labels[currentLang].deleteBtn}
            </button>
        `;

        itemsGrid.appendChild(card);
    });

    if (count === 0) {
        itemsGrid.innerHTML = `<div class="loading" style="text-align:center; padding:20px; font-weight:bold;">${labels[currentLang].noItem}</div>`;
    }
}

// ==========================================
// 4. NEW CARD DATA SUBMISSION LAYER
// ==========================================
if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const now = new Date();
        const dateTimeString = now.toLocaleString(currentLang === 'en' ? 'en-US' : 'hi-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
        });

        const newItem = {
            title: document.getElementById('item-title')?.value || "",
            description: document.getElementById('item-desc')?.value || "",
            itemType: document.getElementById('item-type')?.value || "Lost",
            location: document.getElementById('item-location')?.value || "",
            contact: document.getElementById('reporter-contact')?.value || "",
            image: selectedImageBase64,
            time: dateTimeString,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

    try {
        db.collection("campus_items")
        .add(newItem)
        .then((docRef) => {
            console.log("Added ID: ", docRef.id);
            alert("Report added successfully!");
            
            // Form ko clear karein
            if (reportForm) {
                reportForm.reset(); 
            }
            
            selectedImageBase64 = "";
            
            // Page reload naye card ke liye
            window.location.reload(); 
        })
        .catch((error) => {
            console.error("Firebase Error:", error);
            alert(error.message);
        });

            } catch (err) {
                console.error("Error:", err);
            }

        })

}

// ==========================================
// 5. GOOGLE AUTH LOGIN SYSTEM
// ==========================================
const provider = new firebase.auth.GoogleAuthProvider();

function loginWithGoogle() {
    firebase.auth().signInWithPopup(provider).catch((error) => {
        console.error("Login Error: ", error);
    });
}

function logoutAdmin() {
    firebase.auth().signOut().then(() => {
        alert("Logged Out!");
        window.location.reload();
    });
}

const loginBtnElement = document.getElementById("admin-login-btn");
if (loginBtnElement) {
    loginBtnElement.addEventListener("click", function() {
        loginWithGoogle();
    });
}

// ==========================================
// 6. AUTH STATE LISTENER & OPERATIONS
// ==========================================
firebase.auth().onAuthStateChanged((user) => {
    currentLoggedInUser = user;
    const loginBtn = document.getElementById("admin-login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const adminStatus = document.getElementById("admin-status");

    // ⚠️ ईमेल डिस्प्ले को पूरी तरह छिपाए रखने के लिए
    const emailDisplay = document.getElementById("admin-email-display");
    if (emailDisplay) {
        emailDisplay.style.display = "none";
    }

    // अगर यूजर लॉगिन है और वह एडमिन ईमेल से मैच करता है
    if (user && user.email === MY_ADMIN_EMAIL) {
        if (loginBtn) loginBtn.style.display = "none";         // Admin बटन छिपाएं
        if (adminStatus) adminStatus.style.display = "flex";   // स्टेटस कंटेनर दिखाएं
        if (logoutBtn) logoutBtn.style.display = "inline-block"; // Logout बटन दिखाएं
    } else {
        // अगर यूजर लॉगआउट है या एडमिन नहीं है
        if (loginBtn) loginBtn.style.display = "inline-block"; // Admin बटन दिखाएं
        if (adminStatus) adminStatus.style.display = "none";   // स्टेटस कंटेनर छिपाएं
        if (logoutBtn) logoutBtn.style.display = "none";       // Logout बटन छिपाएं
    }

    updateDeleteButtonsVisibility();
});


function updateDeleteButtonsVisibility() {
    const user = firebase.auth().currentUser;
    const isAdmin = user && user.email === MY_ADMIN_EMAIL;
    const deleteButtons = document.querySelectorAll(".admin-delete-btn");
    deleteButtons.forEach((btn) => {
        btn.style.display = isAdmin ? "block" : "none";
    });
}

function deleteCard(itemId) {
    if (confirm("क्या आप सच में इसे हटाना चाहते हैं? / Do you really want to delete this report?")) {
        db.collection("campus_items").doc(itemId).delete()
        .then(() => {
            alert("Successfully deleted!");
            window.location.reload();
        })
        .catch((error) => {
            alert("Error: " + error.message);
        });
    }
}

// ==========================================
// IMAGE COMPRESSOR & LIVE PREVIEW HANDLER
// ==========================================
const imageInputField = document.getElementById('item-image');

if (imageInputField) {
    imageInputField.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Resize calculations for 1MB Firestore limit bypass
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 450;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress with 0.6 quality ratio
                    selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.6);
                    console.log("Image successfully compressed.");

                    // LIVE PREVIEW: Photo select karte hi screen par dikhane ka logic
                    const previewBox = document.getElementById('image-preview-container');
                    const previewImg = document.getElementById('image-preview');

                    if (previewBox && previewImg) {
                        previewImg.src = selectedImageBase64; // Image source bind karein
                        previewBox.style.display = "block";    // Preview box ko show karein
                    }
                };
            };
        }
    });
}


// ==========================================
// 7. SYSTEM INTERACTIVE ROUTING CONTROLS
// ==========================================
const filterAll = document.getElementById('filter-all');
const filterLost = document.getElementById('filter-lost');
const filterFound = document.getElementById('filter-found');

function updateFilterUI(activeBtn) {
    [filterAll, filterLost, filterFound].forEach(btn => btn?.classList.remove('active'));
    activeBtn?.classList.add('active');
    renderItems();
}

if (filterAll) filterAll.addEventListener('click', () => { currentFilter = 'All'; updateFilterUI(filterAll); });
if (filterLost) filterLost.addEventListener('click', () => { currentFilter = 'Lost'; updateFilterUI(filterLost); });
if (filterFound) filterFound.addEventListener('click', () => { currentFilter = 'Found'; updateFilterUI(filterFound); });

if (languageBtn) {
    languageBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        languageBtn.innerText = currentLang === 'en' ? 'हिंदी' : 'English';
        renderItems();
    });
}





// ==========================================
// 9. DARK MODE ENGINE (STABLE MEMORY EVENT)
// ==========================================
const darkModeBtn = document.getElementById('dark-mode-btn') || document.querySelector('.fa-moon')?.parentElement || document.querySelector('.fa-circle-half-stroke')?.parentElement || document.getElementById('theme-toggle');

if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
        // Toggle theme layout framework
        document.body.classList.toggle('dark-mode');
        
        const isDarkActive = document.body.classList.contains('dark-mode');
        localStorage.setItem('raza_nagar_theme', isDarkActive ? 'dark' : 'light');
    });
}

// Memory initialization hook on window load
window.addEventListener('DOMContentLoaded', () => {
    const activeSavedTheme = localStorage.getItem('raza_nagar_theme');
    if (activeSavedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
});

// ==========================================
// 5. LANGUAGE TOGGLE (FINAL COMPLETED CODE)
// ==========================================
// Yeh aapke HTML ke purane 'lang-btn' ko target karega
const langBtn = document.getElementById('lang-btn');

if (langBtn) {
    langBtn.addEventListener('click', () => {
        // 1. Language state variable ko badlein
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        
        // 2. Button par dikhne wale text ko badlein
        langBtn.textContent = currentLang === 'en' ? 'हिंदी' : 'English';
        
        // 3. Static labels aur buttons ka translation text node mapping
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${currentLang}`);
        });
        
        // 4. Form inputs ke placeholder texts ka translation mapping
        document.querySelectorAll('[data-en-placeholder]').forEach(input => {
            input.placeholder = input.getAttribute(`data-${currentLang}-placeholder`);
        });
        
        // 5. Select dropdown options ka translation mapping
        document.querySelectorAll('select option[data-en]').forEach(opt => {
            opt.textContent = opt.getAttribute(`data-${currentLang}`);
        });
        
        // 6. Dynamic database cards ko naye language me refresh karein
        if (typeof renderItems === "function") {
            renderItems();
        }
    });
}




// ==========================================
// 10. IMAGE MODAL ENGINE (OPEN & CLOSE VIEW)
// ==========================================
function openModal(imageSrc) {
    const imgModal = document.getElementById('image-modal');
    const modalImageDisplay = document.getElementById('modal-img');
    
    if (imgModal && modalImageDisplay) {
        modalImageDisplay.src = imageSrc; // Card ki image base64 ya link set karein
        imgModal.style.display = "block"; // Dark modal layer ko screen par dikhayein
        console.log("Image Modal opened successfully.");
    }
}

function closeModal() {
    const imgModal = document.getElementById('image-modal');
    if (imgModal) {
        imgModal.style.display = "none"; // Modal window ko wapas chhipayein
    }
}

// Optional: Agar koi modal ke bahar black screen par click kare toh bhi band ho jaye
window.addEventListener('click', function(event) {
    const imgModal = document.getElementById('image-modal');
    if (event.target === imgModal) {
        imgModal.style.display = "none";
    }
});








// Google Login Mechanism (v8 Syntax)
const loginPage = document.getElementById("login-page");
const mainAppContent = document.getElementById("main-app-content");
const googleLoginBtn = document.getElementById("google-login-btn");

// Auth State Monitor (Yeh check karega ki user logged in hai ya nahi)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User login hai -> Login screen chhupao, website dikhao
        if (loginPage) loginPage.style.display = "none";
        if (mainAppContent) mainAppContent.style.display = "block";
        
        console.log("Logged in user tracking:", user.email);
    } else {
        // User login nahi hai -> Login screen dikhao, website chhupao
        if (loginPage) loginPage.style.display = "flex";
        if (mainAppContent) mainAppContent.style.display = "none";
    }
});

// Google Button Click Event
if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Authentication successful for:", result.user.email);
        })
        .catch((error) => {
            console.error("Authentication failed:", error.message);
            alert("Login Failed: " + error.message);
        });
    });
}
