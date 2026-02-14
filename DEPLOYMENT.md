# Hướng dẫn Deploy và Bảo mật Firebase

## ⚠️ Quan trọng: Firebase Web API Key

**Firebase API Key cho web app là PUBLIC KEY** - nó được thiết kế để exposed trên browser và KHÔNG CẦN che giấu.

❌ **KHÔNG CẦN**: Dùng environment variables, GitHub secrets cho API key này  
✅ **CẦN PHẢI**: Bảo vệ bằng Firebase Security Rules và giới hạn domain

---

## 🔒 Cách Bảo mật Đúng

### 1. Setup Firebase Security Rules

Vào Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ cho phép đọc/ghi rooms collection
    match /rooms/{roomId} {
      // Cho phép tạo room mới
      allow create: if request.auth == null;
      
      // Cho phép đọc nếu có trong room
      allow read: if true;
      
      // Cho phép update nếu đang trong room
      allow update: if request.auth == null;
      
      // Không cho phép delete
      allow delete: if false;
    }
    
    // Block tất cả các collection khác
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 2. Giới hạn API Key theo Domain

Vào Firebase Console → Project Settings → Scroll xuống "Your apps" → Web app → App Check:

**Thêm các domain được phép:**
- `localhost:8000` (dev)
- `localhost:8001` (dev)
- `your-domain.github.io` (production)
- `your-custom-domain.com` (nếu có)

**Bước thực hiện:**
1. Vào Firebase Console
2. Click vào Settings (⚙️) → Project settings
3. Tab "General" → Scroll xuống "Your apps"
4. Click vào app name
5. Chọn "API restrictions"
6. Thêm HTTP referrers (websites)

---

## 🚀 Các Cách Deploy

### Option 1: GitHub Pages (Đơn giản nhất)

1. **Commit code lên GitHub** (credentials có thể public):
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Enable GitHub Pages**:
   - Vào repo → Settings → Pages
   - Source: Deploy from branch
   - Branch: main / root
   - Save

3. **Truy cập tại**: `https://username.github.io/repo-name`

### Option 2: Firebase Hosting (Tốt nhất cho Firebase app)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Option 3: Vercel (Nhanh, Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 4: Netlify (Drag & Drop)

1. Vào https://app.netlify.com/
2. Drag & drop folder vào
3. Done!

---

## 📝 File Structure cho Deploy

Chỉ cần commit các file này:

```
xidach/
├── index.html
├── game.js
├── styles.css
├── firebase-config.js
├── firebase-credentials.js      ← OK to commit
├── firebase-credentials.example.js
├── .gitignore                   ← Quan trọng
├── README.md
└── SECURITY.md
```

**.gitignore** đã có (kiểm tra):
```
# Local credentials (nếu muốn che giấu)
# firebase-credentials.js

# Nhưng thực ra KHÔNG CẦN gitignore nó
# Vì đây là public key
```

---

## 🛡️ Best Practices

### 1. ✅ Luôn dùng Security Rules
- Giới hạn quyền đọc/ghi
- Validate data
- Rate limiting

### 2. ✅ Enable App Check (Optional nhưng tốt)
```bash
firebase init appcheck
```

### 3. ✅ Monitoring
- Firebase Console → Usage
- Set up alerts nếu có usage bất thường

### 4. ✅ Quota Limits
- Firestore Spark (Free): 50k reads/day
- Nếu vượt, upgrade lên Blaze (pay as you go)

---

## 🎯 Khuyến nghị

**Cho project này:**

1. **Commit firebase-credentials.js lên GitHub** - OK vì là public key
2. **Setup Security Rules** - BẮT BUỘC để bảo vệ database
3. **Deploy lên GitHub Pages hoặc Firebase Hosting**
4. **Thêm domain restriction** trong Firebase Console
5. **Monitor usage** định kỳ

**Firebase API Key không phải là secret key** - nó giống như Google Maps API Key, được thiết kế để public.

---

## ❓ FAQ

**Q: Người khác có thể dùng API key của tôi không?**  
A: Có, nhưng họ chỉ làm được những gì Security Rules cho phép. Nếu rules đúng, họ chỉ có thể tạo/update rooms, không thể xóa hay access data khác.

**Q: Làm sao hạn chế abuse?**  
A: 
- Security Rules với rate limiting
- App Check để verify requests từ app của bạn
- Monitor usage và set alerts

**Q: Tôi có nên dùng environment variables không?**  
A: Không cần thiết cho Firebase web app. Nó chỉ thêm complexity mà không tăng security.

---

## 🚀 Quick Deploy

```bash
# 1. Kiểm tra Security Rules đã setup chưa
# 2. Commit code
git add .
git commit -m "Ready to deploy"
git push origin main

# 3. Enable GitHub Pages trong repo settings
# 4. Truy cập https://username.github.io/xidach
```

Done! 🎉
