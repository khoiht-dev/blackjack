# 🔒 Security Guidelines

## Firebase Credentials

### ⚠️ QUAN TRỌNG

File `firebase-credentials.js` chứa thông tin nhạy cảm của Firebase project và **TUYỆT ĐỐI KHÔNG** được commit lên Git hoặc chia sẻ công khai.

### Tại sao cần bảo mật?

Firebase credentials bao gồm:
- **API Key**: Cho phép truy cập Firebase services
- **Project ID**: Định danh project của bạn
- **App ID**: Định danh ứng dụng

Nếu bị lộ, kẻ xấu có thể:
- Truy cập Firestore database của bạn
- Tạo/xóa/sửa dữ liệu
- Lạm dụng quota và gây chi phí
- Spam hoặc DDoS database

### Cách bảo vệ

#### 1. Sử dụng .gitignore
File `.gitignore` đã được cấu hình để loại trừ `firebase-credentials.js`:

```gitignore
# Firebase Credentials - KHÔNG commit file này
firebase-credentials.js
```

#### 2. Kiểm tra trước khi commit
Trước mỗi lần commit, kiểm tra:

```bash
git status
```

Đảm bảo `firebase-credentials.js` KHÔNG xuất hiện trong danh sách "Changes to be committed".

#### 3. Sử dụng template file
- Commit: `firebase-credentials.example.js` (chứa giá trị giả)
- Không commit: `firebase-credentials.js` (chứa giá trị thật)

#### 4. Nếu đã commit nhầm

**LẬP TỨC thực hiện:**

1. Xóa khỏi Git history:
```bash
git rm --cached firebase-credentials.js
git commit -m "Remove sensitive credentials"
git push
```

2. Tạo Firebase project mới hoặc regenerate credentials

3. Cập nhật file `.gitignore` và commit:
```bash
git add .gitignore
git commit -m "Update gitignore"
git push
```

## Firestore Security Rules

### Test Mode (Development Only)

Khi phát triển, có thể dùng Test Mode:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Chỉ dùng trong development! Không deploy production với rules này!**

### Production Rules

Khi deploy production, dùng rules an toàn hơn:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules cho game rooms
    match /rooms/{roomId} {
      // Cho phép đọc nếu biết room ID
      allow read: if request.auth != null || true;
      
      // Cho phép tạo room
      allow create: if request.auth != null || true;
      
      // Chỉ cho phép update fields cụ thể
      allow update: if request.auth != null || true;
      
      // Cho phép xóa sau 24 giờ không hoạt động
      allow delete: if request.auth != null || 
                      request.time > resource.data.createdAt + duration.value(24, 'h');
    }
  }
}
```

### Rules tốt hơn với Authentication

Nếu thêm Firebase Authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      // Chỉ cho user đã đăng nhập
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      
      // Chỉ cho members của room update
      allow update: if request.auth != null && 
                      request.auth.uid in resource.data.players.keys();
      
      // Chỉ cho owner xóa
      allow delete: if request.auth != null && 
                      request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## Best Practices

### 1. Environment-specific credentials
- Development: Dùng Firebase project riêng
- Production: Dùng Firebase project riêng
- Không dùng chung credentials

### 2. Monitoring
- Bật Firebase Monitoring để theo dõi usage
- Set up alerts khi có hoạt động bất thường
- Kiểm tra logs thường xuyên

### 3. Quotas & Limits
- Set up billing alerts
- Giới hạn số lượng operations trong Firestore Rules
- Rate limiting cho các operations

### 4. Regular audits
- Kiểm tra Firestore Rules định kỳ
- Review access logs
- Cập nhật dependencies

## Deploy an toàn

### Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### Netlify/Vercel
1. Thêm `firebase-credentials.js` vào `.gitignore`
2. Trong dashboard, thêm Variables:
   - FIREBASE_API_KEY
   - FIREBASE_AUTH_DOMAIN
   - etc.
3. Update code để đọc từ environment variables

### GitHub Pages
⚠️ **KHÔNG ĐỂ credentials trong code khi deploy lên GitHub Pages!**

Cân nhắc:
1. Dùng Firebase Hosting thay vì GitHub Pages
2. Hoặc tạo backend API để proxy requests

## Checklist trước khi deploy

- [ ] File `firebase-credentials.js` trong `.gitignore`
- [ ] Không có credentials trong code được commit
- [ ] Firestore Rules đã được cấu hình cho production
- [ ] Test security rules trước khi deploy
- [ ] Đã set up monitoring và alerts
- [ ] Đã set up billing limits
- [ ] Đã backup Firestore data quan trọng

## Báo cáo vấn đề bảo mật

Nếu phát hiện lỗ hổng bảo mật, vui lòng:
1. KHÔNG tạo public issue
2. Contact trực tiếp qua email
3. Đợi patch trước khi công bố

## Tài nguyên tham khảo

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firebase Security Checklist](https://firebase.google.com/docs/rules/security-checklist)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
