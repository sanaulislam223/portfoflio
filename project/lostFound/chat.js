// 1. एडमिन के लिए मैसेज डिलीट करने का सबसे पक्का ग्लोबल फंक्शन (इसे सबसे ऊपर रखा है)
window.deleteChatMessage = function(docId) {
    if (typeof firebase === 'undefined') return;
    
    const chatDb = firebase.firestore();
    
    if (confirm("क्या आप इस मैसेज को डिलीट करना चाहते हैं?")) {
        chatDb.collection('public_chats').doc(docId).delete()
        .then(() => {
            console.log("Message deleted successfully.");
        })
        .catch((error) => {
            alert("मैसेज डिलीट करने की अनुमति नहीं है! कृपया Firebase Rules चेक करें।");
            console.error("Delete Error: ", error);
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;

    const chatDb = firebase.firestore();
    const inputField = document.getElementById('embeddedChatInput');
    const msgContainer = document.getElementById('embeddedChatMessages');
    const sendBtn = document.querySelector('.chat-box-input-wrapper button');

    // स्क्रीन पर मैसेज दिखाने का फंक्शन
    function renderMessage(docId, email, text, type) {
        if (!msgContainer) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${type}`;
        msgDiv.style.position = 'relative';

        // चेक करें कि क्या वर्तमान लॉग-इन यूजर एडमिन है
        let isAdmin = false;
        if (firebase.auth().currentUser && firebase.auth().currentUser.email === 'sanaulislam77@gmail.com') {
            isAdmin = true;
        }

        // एडमिन के लिए लाल '✕' बटन
        let deleteButtonHTML = isAdmin ? `<button onclick="window.deleteChatMessage('${docId}')" style="background:none; border:none; color:red; font-size:0.8rem; cursor:pointer; position:absolute; top:2px; right:5px; font-weight:bold; z-index:10;">✕</button>` : '';
        let paddingRight = isAdmin ? 'padding-right: 18px;' : '';

        msgDiv.innerHTML = `
            ${deleteButtonHTML}
            <small class="chat-user-id" style="${paddingRight}">${email}</small>
            <div class="chat-text" style="font-size:0.85rem; word-break:break-word;">${text}</div>
        `;
        msgContainer.appendChild(msgDiv);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    // Firestore में मैसेज भेजने का फंक्शन
    function sendChatMsg() {
        if (!inputField) return;
        const msgText = inputField.value.trim();
        if (msgText === '') return;

        let userEmail = "Guest User";
        let userUid = "guest";

        if (firebase.auth().currentUser) {
            userEmail = firebase.auth().currentUser.email;
            userUid = firebase.auth().currentUser.uid;
        }

        chatDb.collection('public_chats').add({
            email: userEmail,
            uid: userUid,
            message: msgText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => { inputField.value = ''; })
        .catch((error) => { console.error("Chat Error: ", error); });
    }

    if (sendBtn) sendBtn.addEventListener('click', sendChatMsg);
    if (inputField) {
        inputField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') sendChatMsg();
        });
    }

    // लाइव मैसेजेस सुनना
    chatDb.collection('public_chats').orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            if (!msgContainer) return;
            msgContainer.innerHTML = ''; 
            let currentUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'guest';

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.message) {
                    let msgType = (data.uid === currentUid && currentUid !== 'guest') ? 'user' : 'system';
                    renderMessage(doc.id, data.email, data.message, msgType);
                }
            });
        }, (error) => {
            console.error("Firestore Listen Error: ", error);
        });
});
