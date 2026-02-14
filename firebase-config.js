// Firebase Configuration
// File này sử dụng credentials từ firebase-credentials.js
// 
// QUAN TRỌNG: 
// - File firebase-credentials.js chứa thông tin nhạy cảm và KHÔNG được commit lên Git
// - Sử dụng firebase-credentials.example.js làm template để tạo firebase-credentials.js

// Kiểm tra xem credentials đã được load chưa
if (typeof window.FIREBASE_CREDENTIALS === 'undefined') {
    console.error('❌ FIREBASE_CREDENTIALS không tìm thấy!');
    console.error('Vui lòng:');
    console.error('1. Copy file "firebase-credentials.example.js" thành "firebase-credentials.js"');
    console.error('2. Điền thông tin Firebase của bạn vào file đó');
    console.error('3. Đảm bảo file firebase-credentials.js được load trước firebase-config.js trong HTML');
    throw new Error('Firebase credentials not found');
}

// Lấy credentials từ biến global
const firebaseConfig = window.FIREBASE_CREDENTIALS;

// Khởi tạo Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase đã được khởi tạo thành công!');
} catch (error) {
    console.error('❌ Lỗi khởi tạo Firebase:', error);
    console.error('Vui lòng kiểm tra lại thông tin trong firebase-credentials.js');
    throw error;
}

// Khởi tạo Firestore
const db = firebase.firestore();

// Export để sử dụng trong các file khác
window.db = db;

console.log('🎰 Blackjack game ready!');
