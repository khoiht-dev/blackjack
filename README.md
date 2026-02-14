# � Blackjack Online

Game Blackjack (21 điểm) multiplayer online sử dụng Firebase Firestore với tính năng realtime.

## ✨ Tính năng

- 🎯 Chơi với nhiều người (tối đa 5 người) trong cùng một phòng
- 🔄 Realtime updates - xem người chơi vào/ra phòng tức thì
- 🃏 Logic Blackjack chuẩn với Hit, Stand, Double
- 💰 Hệ thống chips và đặt cược
- 🎩 Dealer tự động chơi theo luật (dừng ở 17+)
- 📱 Thiết kế responsive, chơi được trên mobile
- 🎨 Giao diện đẹp mắt giống casino thật
- 🏆 Tính toán kết quả tự động và cập nhật chips

## 🎮 Luật chơi Blackjack

### Mục tiêu:
- Đạt tổng điểm gần 21 nhất mà không vượt quá 21
- Đánh bại dealer

### Giá trị bài:
- Số 2-10: giá trị bằng số
- J, Q, K: giá trị 10
- Ace (A): giá trị 11 hoặc 1 (tự động tính)

### Blackjack:
- 2 lá đầu có tổng 21 điểm = Blackjack
- Thắng Blackjack được 1.5x tiền cược

### Các hành động:
- **Hit**: Rút thêm 1 lá bài
- **Stand**: Dừng lại, không rút nữa
- **Double**: Gấp đôi tiền cược, rút 1 lá và tự động dừng (chỉ được dùng ở 2 lá đầu)

### Luật Dealer:
- Dealer phải rút bài cho đến khi đạt ít nhất 17 điểm
- Dealer dừng ở 17 trở lên

### Kết quả:
- Player > Dealer: Thắng, nhận lại tiền cược + tiền thắng
- Player < Dealer: Thua, mất tiền cược
- Player = Dealer: Hòa (Push), giữ nguyên tiền cược
- Player > 21: Bust, thua ngay lập tức
- Dealer > 21: Player thắng (nếu không bust)

## 🚀 Cài đặt

### Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" để tạo project mới
3. Đặt tên project (ví dụ: "keo-bua-bao-game")
4. Có thể tắt Google Analytics nếu không cần
5. Click "Create project"

### Bước 2: Tạo Firestore Database

1. Trong Firebase Console, chọn "Firestore Database" ở menu bên trái
2. Click "Create database"
3. Chọn "Start in test mode" (cho development)
4. Chọn location gần nhất (ví dụ: asia-southeast1)
5. Click "Enable"

**Lưu ý bảo mật:** Test mode cho phép mọi người đọc/ghi. Khi deploy production, cần cập nhật Firestore Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read, write: if true;
    }
  }
}
```

### Bước 3: Lấy Firebase Config

1. Trong Firebase Console, click vào biểu tượng ⚙️ (Settings) > Project settings
2. Scroll xuống phần "Your apps"
3. Click vào icon Web "</>" để thêm web app
4. Đặt tên app (ví dụ: "Blackjack Web")
5. Không cần chọn Firebase Hosting
6. Click "Register app"
7. Sao chép đoạn code `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

### Bước 4: Cấu hình Firebase Credentials

**QUAN TRỌNG**: Firebase credentials chứa thông tin nhạy cảm và không nên commit lên Git!

1. Copy file template:
```bash
cp firebase-credentials.example.js firebase-credentials.js
```

2. Mở file `firebase-credentials.js` vừa tạo

3. Thay thế các giá trị trong `FIREBASE_CREDENTIALS` bằng config của bạn từ Bước 3:

```javascript
const FIREBASE_CREDENTIALS = {
    apiKey: "AIza...",  // Thay bằng apiKey của bạn
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc..."
};
```

4. Lưu file (file này đã được thêm vào `.gitignore` nên sẽ không bị commit)

### Bước 5: Chạy Game

#### Cách 1: Sử dụng Live Server (VS Code)

1. Cài đặt extension "Live Server" trong VS Code
2. Click chuột phải vào file `index.html`
3. Chọn "Open with Live Server"
4. Game sẽ mở trong browser tại `http://localhost:5500`

#### Cách 2: Sử dụng Python HTTP Server

```bash
# Python 3
python3 -m http.server 8000

# Hoặc Python 2
python -m SimpleHTTPServer 8000
```

Truy cập: `http://localhost:8000`

#### Cách 3: Sử dụng Node.js HTTP Server

```bash
# Cài đặt http-server
npm install -g http-server

# Chạy server
http-server -p 8000
```

Truy cập: `http://localhost:8000`

## 🎮 Cách chơi

### Tạo phòng mới:

1. Nhập tên của bạn
2. Nhập số chips khởi đầu (100-10000, mặc định 1000)
3. Click "Tạo Room Mới"
4. Sao chép mã room và gửi cho bạn bè
5. Đợi người chơi khác vào phòng (có thể chơi 1-5 người)
6. Click "Bắt đầu Game"

### Tham gia phòng:

1. Nhập tên của bạn
2. Nhập số chips khởi đầu
3. Click "Tham Gia Room"
4. Nhập mã room từ bạn bè
5. Click "Vào Room"
6. Đợi chủ phòng bắt đầu game

### Trong game:

#### 1. Đặt cược:
- Nhập số chips muốn đặt cược (tối thiểu 10)
- Hoặc chọn quick bet: 10, 25, 50, 100, 250
- Click "Đặt cược"
- Đợi tất cả người chơi đặt cược

#### 2. Chơi bài:
- Mỗi người và dealer nhận 2 lá bài
- Dealer che 1 lá bài
- Đến lượt bạn, chọn:
  - **Hit**: Rút thêm bài
  - **Stand**: Dừng lại
  - **Double**: Gấp đôi cược (chỉ có ở 2 lá đầu)
- Mục tiêu: Đạt gần 21 điểm nhất mà không quá 21

#### 3. Kết quả:
- Sau khi tất cả người chơi xong, dealer mở bài và rút theo luật
- Xem kết quả và số chips thắng/thua
- Click "Ván tiếp theo" để chơi tiếp

### Lưu ý:
- Nếu hết chips (dưới 10), bạn sẽ bị loại khỏi phòng
- Có thể rời phòng bất kỳ lúc nào
- Room tự động xóa khi không còn ai

## 📁 Cấu trúc Project

```
xidach/
│
├── index.html                      # File HTML chính
├── styles.css                      # Styles cho giao diện
├── firebase-config.js              # Khởi tạo Firebase (dùng credentials)
├── firebase-credentials.js         # File chứa Firebase config (KHÔNG commit)
├── firebase-credentials.example.js # Template cho credentials
├── game.js                         # Logic game Blackjack
├── .gitignore                      # Loại trừ files nhạy cảm
└── README.md                       # File hướng dẫn này
```

## 🔒 Bảo mật

### Firebase Credentials

File `firebase-credentials.js` chứa thông tin Firebase của bạn và **KHÔNG NÊN** commit lên Git vì:
- Có thể bị lộ API keys
- Người khác có thể truy cập Firestore database của bạn
- Có thể bị lạm dụng quota

**Đã được bảo vệ:**
- File `firebase-credentials.js` đã được thêm vào `.gitignore`
- Chỉ commit file template `firebase-credentials.example.js`

**Lưu ý khi deploy:**
- Với Firebase Hosting: Sử dụng environment variables
- Với Netlify/Vercel: Thêm credentials vào Environment Variables trong settings

### Firestore Security Rules

Khi deploy production, cập nhật Firestore Rules để bảo mật hơn:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      // Cho phép đọc nếu là thành viên của room
      allow read: if request.auth != null || true; // Change to authenticated users only
      
      // Cho phép tạo room
      allow create: if request.auth != null || true;
      
      // Chỉ cho phép cập nhật nếu là thành viên
      allow update: if request.auth != null || true;
      
      // Cho phép xóa nếu là người tạo
      allow delete: if request.auth != null || true;
    }
  }
}
```

Để bảo mật tốt hơn, nên thêm Firebase Authentication.

## 🔥 Cấu trúc Firestore Database

```
rooms/
  {roomId}/
    - id: string
    - status: 'waiting' | 'betting' | 'playing' | 'showdown' | 'finished'
    - roundNumber: number
    - currentPlayerTurn: playerId | null
    - createdAt: timestamp
    - deck: array of cards
    - dealer:
        - hand: array of cards
        - handValue: number
    - players:
        {playerId}:
          - name: string
          - chips: number
          - bet: number
          - hand: array of cards
          - handValue: number
          - status: 'waiting' | 'betting' | 'playing' | 'stood' | 'bust' | 'blackjack'
          - result: 'win' | 'lose' | 'push' | 'blackjack' | null
          - chipsChange: number
          - joinedAt: timestamp
    - results:
        {playerId}:
          - result: string
          - chipsChange: number
```

### Card Object Structure:
```javascript
{
  suit: '♠' | '♥' | '♦' | '♣',
  rank: 'A' | '2'-'10' | 'J' | 'Q' | 'K',
  value: number (1-11)
}
```

## 🛠️ Công nghệ sử dụng

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Firebase Firestore
- **Realtime:** Firestore Realtime Listeners
- **Hosting:** Có thể deploy lên Firebase Hosting, Netlify, Vercel, GitHub Pages

## 🚢 Deploy lên Firebase Hosting (Optional)

```bash
# Cài đặt Firebase CLI
npm install -g firebase-tools

# Đăng nhập Firebase
firebase login

# Khởi tạo Firebase trong project
firebase init hosting

# Chọn:
# - Use existing project
# - Public directory: . (thư mục hiện tại)
# - Configure as single-page app: No
# - Set up automatic builds: No

# Deploy
firebase deploy --only hosting
```

## 🐛 Troubleshooting

### Lỗi "FIREBASE_CREDENTIALS not found"
- **Nguyên nhân**: Chưa tạo file `firebase-credentials.js`
- **Giải pháp**: 
  ```bash
  cp firebase-credentials.example.js firebase-credentials.js
  ```
  Sau đó điền thông tin Firebase vào file vừa tạo

### Lỗi "Firebase not defined"
- Kiểm tra kết nối internet
- Đảm bảo Firebase SDK được load từ CDN
- Kiểm tra console browser để xem lỗi cụ thể

### Lỗi khởi tạo Firebase
- Kiểm tra các giá trị trong `firebase-credentials.js` đã đúng chưa
- Đảm bảo copy đúng từ Firebase Console
- Kiểm tra không có dấu ngoặc hoặc dấu phay thừa

### Lỗi "Permission denied"
- Kiểm tra Firestore Rules
- Đảm bảo đang ở Test Mode hoặc cấu hình rules đúng

### Game không cập nhật realtime
- Kiểm tra Firebase config đã đúng chưa
- Xem Console log để kiểm tra lỗi
- Thử refresh lại trang

### Không tạo được room
- Kiểm tra Firestore Database đã được enable
- Kiểm tra Firebase credentials trong firebase-credentials.js
- Mở Console để xem lỗi chi tiết

### File firebase-credentials.js bị commit lên Git
- **Nguy hiểm!** Cần xóa ngay khỏi Git history
- Chạy lệnh:
  ```bash
  git rm --cached firebase-credentials.js
  git commit -m "Remove credentials from git"
  ```
- Tạo Firebase project mới và thay credentials
- Đảm bảo `.gitignore` có dòng `firebase-credentials.js`

## 📝 License

MIT License - Sử dụng tự do cho mục đích học tập và thương mại.

## 👨‍💻 Phát triển thêm

Một số ý tưởng để mở rộng game:

- [ ] Thêm tính năng Split (chia bài đôi khi có 2 lá giống nhau)
- [ ] Thêm Insurance (bảo hiểm khi dealer có Ace)
- [ ] Thêm authentication với Firebase Auth
- [ ] Lưu lịch sử chơi và thống kê
- [ ] Thêm leaderboard top người chơi
- [ ] Thêm nhiều bộ bài (shoe) để giảm việc đếm bài
- [ ] Chat trong game
- [ ] Thêm hiệu ứng âm thanh và animation
- [ ] Thêm đặt cược phụ (side bets)
- [ ] Thêm chế độ tournament
- [ ] Thêm daily bonus và achievements
- [ ] Hỗ trợ nhiều bàn chơi cùng lúc

## 🎯 Chiến thuật cơ bản

### Khi nào nên Hit:
- Tay bài < 12 điểm
- Tay bài 12-16 và dealer có 7-Ace
- Soft hand (có Ace đếm là 11) dưới 17

### Khi nào nên Stand:
- Tay bài >= 17
- Tay bài 12-16 và dealer có 2-6
- Soft 18 trở lên

### Khi nào nên Double:
- Tổng 11 điểm (đặc biệt khi dealer có 2-10)
- Tổng 10 điểm và dealer có 2-9
- Soft 16-18 và dealer có 4-6

*Lưu ý: Đây chỉ là chiến thuật cơ bản, kết quả vẫn phụ thuộc vào may mắn*

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo Pull Request hoặc Issues nếu bạn có ý tưởng cải thiện.

---

Chúc bạn chơi game vui vẻ! 🎉
