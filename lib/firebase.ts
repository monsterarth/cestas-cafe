import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAjAUVa7_4cAHtFqm8xBuzDVzxDknPMYJM",
  authDomain: "cafe-da-fazenda-a2ec3.firebaseapp.com",
  projectId: "cafe-da-fazenda-a2ec3",
  storageBucket: "cafe-da-fazenda-a2ec3.appspot.com",
  messagingSenderId: "604485035435",
  appId: "1:604485035435:web:876f003565cec1ac4a5eee",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
