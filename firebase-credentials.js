// Firebase Credentials
// ĐÂY LÀ FILE MẪU - KHÔNG CHỨA THÔNG TIN THẬT
// 
// Cách sử dụng:
// 1. Copy file này thành "firebase-credentials.js"
// 2. Điền thông tin Firebase thật của bạn vào file đó
// 3. File firebase-credentials.js sẽ không được commit lên Git (đã có trong .gitignore)

// Lấy thông tin Firebase Config:
// 1. Truy cập https://console.firebase.google.com/
// 2. Chọn project hoặc tạo project mới
// 3. Vào Project Settings > General
// 4. Scroll xuống phần "Your apps" và chọn Web app (hoặc tạo mới)
// 5. Sao chép firebaseConfig

const FIREBASE_CREDENTIALS = {
  apiKey: "AIzaSyDtc1V5_3XScFI-bLmkEqI9lSOf_d9nYFQ",
  authDomain: "blackjack-36f3d.firebaseapp.com",
  projectId: "blackjack-36f3d",
  storageBucket: "blackjack-36f3d.firebasestorage.app",
  messagingSenderId: "62892564365",
  appId: "1:62892564365:web:90b60ce258c0c54abe67c4",
  measurementId: "G-XEW52DNHT9"
};

// Export để firebase-config.js sử dụng
window.FIREBASE_CREDENTIALS = FIREBASE_CREDENTIALS;
