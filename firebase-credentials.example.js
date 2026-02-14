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
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Export để firebase-config.js sử dụng
window.FIREBASE_CREDENTIALS = FIREBASE_CREDENTIALS;
