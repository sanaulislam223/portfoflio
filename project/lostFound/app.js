// एलिमेंट्स सिलेक्टर्स
const reportForm = document.getElementById('report-form');
const itemsGrid = document.getElementById('items-grid');
const themeToggle = document.getElementById('theme-toggle');
const langBtn = document.getElementById('lang-btn');
const itemImageInput = document.getElementById('item-image');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');

let currentLang = 'en';
let currentFilter = 'All';
let selectedImageBase64 = ""; // इमेज डेटा स्टोर करने के लिए वेरिएबल

// ब्राउज़र लोकल स्टोरेज डेटाबेस सिस्टम (डिफ़ॉल्ट कार्ड्स के साथ)
let campusItems = JSON.parse(localStorage.getItem('campus_items')) || [
    { title: "College ID Card", description: "Blue ribbon, ", type: "Lost", location: "Aala Hazrat Gate", contact: "9912345678", image: "", time: "11 Jun, 01:30 AM" },
    { title: "Watch", description: "Sonata, Black color", type: "Found", location: "Noori Masjid", contact: "8090703870", image: "", time: "11 Jun, 01:15 AM" }
];

// 1. इमेज चुनने पर उसका प्रीव्यू (Preview) दिखाने का लॉजिक
if (itemImageInput) {
    itemImageInput.addEventListener('change', function(e) {
        const file = e.target.files;
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                selectedImageBase64 = event.target.result; // इमेज को सुरक्षित डेटा फॉर्मैट में बदला
                if (imagePreview) imagePreview.src = selectedImageBase64;
                if (imagePreviewContainer) imagePreviewContainer.style.display = "block"; // प्रीव्यू बॉक्स दिखाएँ
            };
            reader.readAsDataURL(file);
        }
    });
}

// 2. भाषा बदलने का बटन क्लिक इवेंट
if (langBtn) {
    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        langBtn.textContent = currentLang === 'en' ? 'हिंदी' : 'English';

        // मुख्य टेक्स्ट बदलना
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${currentLang}`);
        });

        // प्लेसहोल्डर्स बदलना
        document.querySelectorAll('[data-en-placeholder]').forEach(input => {
            input.placeholder = input.getAttribute(`data-${currentLang}-placeholder`);
        });

        // सेलेक्ट ड्रॉपडाउन ऑप्शन्स बदलना
        document.querySelectorAll('select option[data-en]').forEach(opt => {
            opt.textContent = opt.getAttribute(`data-${currentLang}`);
        });

        renderItems(); // ग्रिड कार्ड्स को रीलोड करें
    });
}

// 3. डार्क मोड टॉगल लॉजिक
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☼' : '☾';
    });
}

// 4. नया डेटा लोकल स्टोरेज में तारीख और समय के साथ जोड़ने का लॉजिक
if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // वर्तमान तारीख और समय निकालना
        const now = new Date();
        const dateTimeString = now.toLocaleString(currentLang === 'en' ? 'en-US' : 'hi-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        const newItem = {
            title: document.getElementById('item-title').value,
            description: document.getElementById('item-desc').value,
            type: document.getElementById('item-type').value,
            location: document.getElementById('item-location').value,
            contact: document.getElementById('reporter-contact').value,
            image: selectedImageBase64, // कनवर्टेड फोटो का डेटा
            time: dateTimeString // समय यहाँ सेव होगा
        };
        
        campusItems.unshift(newItem); // नए कार्ड को सबसे ऊपर जोड़ें
        localStorage.setItem('campus_items', JSON.stringify(campusItems)); // लोकल मेमोरी में सेव
        
        alert(currentLang === 'en' ? "Report Submitted! 🎉" : "रिपोर्ट सबमिट हो गई! 🎉");
        
        // फॉर्म और इमेज प्रीव्यू रीसेट करें
        reportForm.reset();
        if (imagePreviewContainer) imagePreviewContainer.style.display = "none";
        selectedImageBase64 = "";
        
        renderItems(); // ग्रिड अपडेट करें
    });
}

// 5. लाइव कार्ड्स दिखाने का मुख्य फंक्शन (समय, क्लिकेबल फोटो और डिलीट बटन सपोर्ट के साथ)
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

    campusItems.forEach((item, index) => {
        if (currentFilter !== 'All' && item.type !== currentFilter) return;
        count++;

        const badgeText = item.type.toLowerCase() === 'lost' ? labels[currentLang].lost : labels[currentLang].found;
        
        let displayLocation = item.location;
        if (currentLang === 'hi' && locationTranslations[item.location]) {
            displayLocation = locationTranslations[item.location];
        }

        // इमेज टैग सेटअप (इस पर क्लिक करते ही openModal फ़ंक्शन चलेगा)
        let imgTag = "";
        if (item.image) {
            imgTag = `<img src="${item.image}" onclick="openModal('${item.image}')" style="width:100%; height:150px; object-fit:cover; border-radius:6px; margin:10px 0; border: 1px solid var(--border-color); cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" title="${currentLang === 'en' ? 'Click to view full image' : 'बड़ा देखने के लिए क्लिक करें'}">`;
        }

        const displayTime = item.time || (currentLang === 'en' ? "Just now" : "अभी-अभी");

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="badge ${item.type.toLowerCase()}">${badgeText}</span>
            <h3> ${item.title}</h3>
            
            <p style="font-size: 0.8rem; color: #777; margin: -5px 0 10px 0;"><strong>${labels[currentLang].timeLabel}</strong> ${displayTime}</p>
            
            ${imgTag}
            <p><strong>${labels[currentLang].desc}:</strong> ${item.description}</p>
            <p><strong>📍 ${labels[currentLang].loc}:</strong> ${displayLocation}</p>
            <p><strong>📞 ${labels[currentLang].con}:</strong> ${item.contact}</p>
            
            <!-- डिलीट करने का बटन -->
            <button onclick="deleteCard(${index})" style="margin-top: 15px; width: 100%; padding: 8px; background-color: #00ffcc; color: #721c24; border: 1px solid #f5c6cb; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.85rem; transition: background 0.2s;"
			onmouseover="this.style.backgroundColor='pink'" 
    onmouseout="this.style.backgroundColor='#00ffcc'">
                ${labels[currentLang].deleteBtn}
            </button>
        `;
        itemsGrid.appendChild(card);
    });

    if (count === 0) {
        itemsGrid.innerHTML = `<div class="loading">${labels[currentLang].noItem}</div>`;
    }
}

// 6. फोटो को बड़ा और बंद करने वाले दो नए जावास्क्रिप्ट फंक्शन्स
window.openModal = function(imgSrc) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = imgSrc;
    }
};

window.closeModal = function() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = "none";
    }
};

// 7. कार्ड डिलीट करने का मुख्य फ़ंक्शन
window.deleteCard = function(index) {
    const confirmMsg = currentLang === 'en' ? "Are you sure this item is resolved/found?" : "क्या आप निश्चित हैं कि यह सामान मिल गया है और इसे हटाना चाहते हैं?";
    
    if (confirm(confirmMsg)) {
        campusItems.splice(index, 1); // ऐरे (Array) से डेटा हटाएं
        localStorage.setItem('campus_items', JSON.stringify(campusItems)); // लोकल स्टोरेज अपडेट करें
        renderItems(); // स्क्रीन को तुरंत रीफ्रेश करें
    }
};

// 8. फ़िल्टर बटन्स क्लिक इवेंट्स का मैनेजमेंट
document.getElementById('filter-all').addEventListener('click', function() { currentFilter = 'All'; resetFilterClass(this); renderItems(); });
document.getElementById('filter-lost').addEventListener('click', function() { currentFilter = 'Lost'; resetFilterClass(this); renderItems(); });
document.getElementById('filter-found').addEventListener('click', function() { currentFilter = 'Found'; resetFilterClass(this); renderItems(); });

function resetFilterClass(btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// पहली बार लोड करने के लिए रन करें
renderItems();
