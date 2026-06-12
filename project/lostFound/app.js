// ==========================================
// 1. ELEMENTS SELECTORS
// ==========================================
const reportForm = document.getElementById('report-form');
const itemsGrid = document.getElementById('items-grid');
const themeToggle = document.getElementById('theme-toggle');
const langBtn = document.getElementById('lang-btn');
const itemImageInput = document.getElementById('item-image');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');

// ==========================================
// 2. GLOBAL VARIABLES
// ==========================================
let currentLang = 'en';
let currentFilter = 'All';
let selectedImageBase64 = ""; 
let campusItems = []; 

// Default Dummy Cards
const defaultCards = [
    { id: "default1", title: "College ID Card", description: "Blue ribbon", type: "Lost", location: "Aala Hazrat Gate", contact: "9912345678", image: "", time: "11 Jun, 01:30 AM" },
    { id: "default2", title: "Watch", description: "Sonata, Black color", type: "Found", location: "Noori Masjid", contact: "8090703870", image: "", time: "11 Jun, 01:15 AM" }
];

// ==========================================
// 3. FIREBASE REAL-TIME LIVE SYNC (LAPTOP & MOBILE SYNC FIXED)
// ==========================================
try {
    // ⚡ .orderBy("timestamp", "desc") lagane par dono devices instant sync honge
    db.collection("campus_items").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        campusItems = []; 
        snapshot.forEach((doc) => {
            let itemData = doc.data();
            itemData.id = doc.id; 
            campusItems.push(itemData);
        });
        
        if (campusItems.length === 0) {
            campusItems = defaultCards;
        }
        renderItems();
    }, (error) => {
        console.error("Firebase Sync Error: ", error);
        // Index issue hone par offline framework load karein
        campusItems = defaultCards;
        renderItems();
    });
} catch (e) {
    console.error("Firebase missing, running offline.");
    campusItems = defaultCards;
    renderItems();
}

// ==========================================
// 4. IMAGE PREVIEW & COMPRESSION LOGIC
// ==========================================
if (itemImageInput) {
    itemImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0]; 
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.src = event.target.result;
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_WIDTH = 400; 
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.6); 
                    
                    if (imagePreview) imagePreview.src = selectedImageBase64;
                    if (imagePreviewContainer) imagePreviewContainer.style.display = "block";
                };
            };
            reader.readAsDataURL(file);
        }
    });
}

// ==========================================
// 5. LANGUAGE TOGGLE
// ==========================================
if (langBtn) {
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        langBtn.textContent = currentLang === 'en' ? 'हिंदी' : 'English';
        document.querySelectorAll('[data-en]').forEach(el => el.textContent = el.getAttribute(`data-${currentLang}`));
        document.querySelectorAll('[data-en-placeholder]').forEach(input => input.placeholder = input.getAttribute(`data-${currentLang}-placeholder`));
        document.querySelectorAll('select option[data-en]').forEach(opt => opt.textContent = opt.getAttribute(`data-${currentLang}`));
        renderItems();
    });
}

// ==========================================
// 6. DARK MODE TOGGLE (FIXED)
// ==========================================
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☼' : '☾';
    });
}

// ==========================================
// 7. SUBMIT DATA TO FIREBASE (WITH SYSTEM TIMESTAMP)
// ==========================================
if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const now = new Date();
        const dateTimeString = now.toLocaleString(currentLang === 'en' ? 'en-US' : 'hi-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
        });
        
        const newItem = {
            title: document.getElementById('item-title').value,
            description: document.getElementById('item-desc').value,
            type: document.getElementById('item-type').value,
            location: document.getElementById('item-location').value,
            contact: document.getElementById('reporter-contact').value,
            image: selectedImageBase64, 
            time: dateTimeString,
            // ⚡ SERVER TIMESTAMP: Yeh line mobile aur laptop dono ko instant sync rakhegi
            timestamp: firebase.firestore.FieldValue.serverTimestamp() 
        };
        
        try {
            db.collection("campus_items").add(newItem)
            .then(() => {
                reportForm.reset();
                if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
                selectedImageBase64 = ""; 
                alert(currentLang === 'en' ? "Report Submitted! 🎉" : "रिपोर्ट सबमिट हो गई! 🎉");
            })
            .catch((error) => {
                console.error("Firebase Error: ", error);
            });
        } catch(err) {
            console.error("Firebase disconnected.");
        }
    });
}

// ==========================================
// 8. RENDER LIVE CARDS GRID
// ==========================================
function renderItems() {
    if (!itemsGrid) return;
    itemsGrid.innerHTML = '';
    let count = 0;

    const labels = {
        en: { desc: "Description", loc: "Location", con: "Contact", noItem: "No reports found.", lost: "LOST", found: "FOUND", deleteBtn: "🗑️ Found / Remove", timeLabel: "🕒 Reported:" },
        hi: { desc: "विवरण", loc: "स्थान", con: "संपर्क", noItem: "कोई रिपोर्ट नहीं मिली।", lost: "खोया", found: "पाया", deleteBtn: "🗑️ मिल गया / हटाएं", timeLabel: "🕒 समय:" }
    };

    const locationTranslations = {
        "Aala Hazrat Gate": "आला हज़रत गेट", "Raza Nagar Transformer": "रज़ा नगर ट्रांसफार्मर",
        "Noori Masjid": "नूरी मस्जिद", "Mumtaz Hotal": "मुमताज़ होटल",
        "Madarsa Niswan": "मदरसा निस्वान", "Qassab Tola": "कस्साब टोला",
        "Raza Nagar Ground": "रज़ा नगर ग्राउंड", "Raza Nagar Tanpayi": "रज़ा नगर तन्पयी",
        "Behind Madarsa Ziyaul uloom": "मदरसा ज़ियाउल उलूम के पीछे",
        "Gate Madarsa Ziyaul uloom": "मदरसा ज़ियाउल उलूम गेट", "Raza Nagar khor": "रज़ा नगर खोर"
    };

    campusItems.forEach((item) => {
        const itemType = item.type || "Lost";
        if (currentFilter !== 'All' && itemType !== currentFilter) return;
        count++;

        const badgeText = itemType.toLowerCase() === 'lost' ? labels[currentLang].lost : labels[currentLang].found;
        
        let displayLocation = item.location || "Unknown";
        if (currentLang === 'hi' && locationTranslations[item.location]) {
            displayLocation = locationTranslations[item.location];
        }

        let imgTag = "";
        if (item.image) {
            imgTag = `<img src="${item.image}" onclick="openModal('${item.image}')" style="width:100%; height:150px; object-fit:cover; border-radius:6px; margin:10px 0; border: 1px solid var(--border-color); cursor: pointer;">`;
        }

        const displayTime = item.time || "Just now";

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="badge ${itemType.toLowerCase()}">${badgeText}</span>
            <h3> ${item.title || "No Title"}</h3>
            <p style="font-size: 0.8rem; color: #777; margin: -5px 0 10px 0;"><strong>${labels[currentLang].timeLabel}</strong> ${displayTime}</p>
            ${imgTag}
            <p><strong>${labels[currentLang].desc}:</strong> ${item.description || ""}</p>
            <p><strong>📍 ${labels[currentLang].loc}:</strong> ${displayLocation}</p>
            <p><strong>📞 ${labels[currentLang].con}:</strong> ${item.contact || ""}</p>
        `;

        card.innerHTML += `
            <button onclick="deleteCard('${item.id}')" style="margin-top: 15px; width: 100%; padding: 10px; background-color: #343a40; color: #ffffff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
                ${labels[currentLang].deleteBtn}
            </button>
        `;
        itemsGrid.appendChild(card);
    });

    if (count === 0) {
        itemsGrid.innerHTML = `<div class="loading">${labels[currentLang].noItem}</div>`;
    }
}
// FILTER BUTTONS
const filterAll = document.getElementById("filter-all");
const filterLost = document.getElementById("filter-lost");
const filterFound = document.getElementById("filter-found");

if (filterAll) {
    filterAll.addEventListener("click", () => {
        currentFilter = "All";
        renderItems();

        document.querySelectorAll(".filter-btn").forEach(btn =>
            btn.classList.remove("active")
        );
        filterAll.classList.add("active");
    });
}

if (filterLost) {
    filterLost.addEventListener("click", () => {
        currentFilter = "Lost";
        renderItems();

        document.querySelectorAll(".filter-btn").forEach(btn =>
            btn.classList.remove("active")
        );
        filterLost.classList.add("active");
    });
}

if (filterFound) {
    filterFound.addEventListener("click", () => {
        currentFilter = "Found";
        renderItems();

        document.querySelectorAll(".filter-btn").forEach(btn =>
            btn.classList.remove("active")
        );
        filterFound.classList.add("active");
    });
}

// ==========================================
// 9. IMAGE MODAL FUNCTIONS
// ==========================================
window.openModal = function(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');

    modal.style.display = "block";
    modalImg.src = imgSrc;
};

window.closeModal = function() {
    document.getElementById('imageModal').style.display = "none";
};
