# Teknik Servis Yönetim Sistemi

Modern, hızlı ve güvenli teknik servis takip ve yönetim platformu.

## 🚀 Özellikler

- **Üç Kademeli Yetkilendirme (RBAC):**
  - **Sistem Yöneticisi (Admin):** Tüm sisteme tam erişim, yetkili servis ve personel yönetimi.
  - **Hizmet Yöneticisi (Manager):** Sadece kendi firmasına ait personelleri ve servis kayıtlarını yönetme.
  - **Saha Personeli (Staff):** Yeni servis kaydı oluşturma ve mevcut servislerin durumunu güncelleme.
- **Kapsamlı Takip Sistemi:** Servisler, müşteriler ve personeller için tam CRUD (Oluşturma, Okuma, Güncelleme, Silme) desteği.
- **Müşteri Autocomplete:** Yeni servis oluştururken eski müşteri bilgilerine hızlı erişim.
- **Modern ve Duyarlı Tasarım:** Masaüstü, tablet ve mobil cihazlar için optimize edilmiş responsive arayüz.
- **Karanlık ve Aydınlık Tema:** Kullanıcı tercihine göre değişen ve kaydedilen tema seçenekleri.
- **Güvenli Kimlik Doğrulama:** BCrypt şifreleme ve session bazlı oturum yönetimi.

## 🛠️ Teknoloji Yığını

- **Backend:** Node.js, Express.js
- **Veritabanı:** SQLite (better-sqlite3)
- **Frontend:** Vanilla JS (Modern ES6+), HTML5, CSS3 (Custom Properties / Variables)
- **Güvenlik:** bcryptjs, express-session

## 📦 Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. Uygulamayı başlatın:
   ```bash
   npm start
   ```
   *Not: Varsayılan admin bilgileri: `admin / admin123`*

3. Tarayıcınızda açın: `http://localhost:3001`

## 📂 Dosya Yapısı

- `/public`: Frontend dosyaları (HTML, CSS, JS)
- `/routes`: Express API rotaları
- `/middleware`: Kimlik doğrulama ve yetkilendirme katmanları
- `server.js`: Uygulama giriş noktası
- `db.js`: Veritabanı yapılandırması ve şemalar

## 📝 Lisans

Bu proje eğitim amaçlı geliştirilmiştir.
