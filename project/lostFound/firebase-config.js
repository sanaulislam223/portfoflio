const firebaseConfig = {
  apiKey: "AIzaSyCCHg2Q7NGyqQs_t6t_mOLCch4tAuDX0oI",
  authDomain: "campus-lost-found-2c88f.firebaseapp.com",
  projectId: "campus-lost-found-2c88f",
  storageBucket: "campus-lost-found-2c88f.firebasestorage.app",
  messagingSenderId: "43257768799",
  appId: "1:43257768799:web:509fd5ed7cbf53b1e5e4ea",
  measurementId: "G-V9HQBR82Y3"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

console.log("CONFIG LOADED");
console.log("DB -", db);

