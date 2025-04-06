import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, "..", ".env") });

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};


const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

/**
 * Upload a base64 image to Firebase Storage and return its public download URL
 * @param {string} base64Image - image in data URL form 
 * @param {string} path - the storage path 
 * @returns {string} public URL for the uploaded image
 */
export const uploadImageToFirebase = async (base64Image, path) => {
  const imageRef = ref(storage, path);
  await uploadString(imageRef, base64Image, "data_url");
  return getDownloadURL(imageRef);
};
