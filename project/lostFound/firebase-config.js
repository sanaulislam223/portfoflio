const firebaseConfig = {
  apiKey: "AIzaSyCCHg2Q7NGyqQs_t6t_mOLcch4tAuDXOcI",
  authDomain: "://firebaseapp.com", // ⚡ Yeh sahi value hai
  projectId: "campus-lost-found-2c88f",
  storageBucket: "campus-lost-found-2c88f.firebasestorage.app",
  messagingSenderId: "43257768799",
  appId: "1:43257768799:web:509fd5ed7cbf53ble5e4ea",
  measurementId: "G-V9HQBR82Y3"
};
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
