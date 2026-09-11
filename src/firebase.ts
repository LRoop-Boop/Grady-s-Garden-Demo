import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDUTH1G0FQZ06gz335H8rqMANAGOOCLqt8",
  authDomain: "grady-s-garden-ai-demo.firebaseapp.com",
  projectId: "grady-s-garden-ai-demo",
  storageBucket: "grady-s-garden-ai-demo.firebasestorage.app",
  messagingSenderId: "761861874054",
  appId: "1:761861874054:web:198a7c3c6d226dd055cc07"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);