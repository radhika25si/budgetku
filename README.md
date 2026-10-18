# 📱 BudgetKu - Pencatat Keuangan Pintar Ramah Smartphone

> Aplikasi web pencatat keuangan harian yang ringan, ramah layar smartphone, dan menggunakan **Google Sheets** sebagai database gratis via **Google Apps Script**.

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-blue?style=flat&logo=github)](https://radhika25si.github.io/budgetku/)

---

## ✨ Fitur Unggulan
1. **⚡ Quick Add Transaction**: Input cepat ramah jempol dengan keypad dan chip tombol nominal (`+10rb`, `+20rb`, `+50rb`, `+100rb`).
2. **💼 Multi-Dompet & Transfer Saldo**: Pisahkan uang Tunai, Bank (BCA/Mandiri), dan E-Wallet (GoPay/OVO/ShopeePay) lengkap dengan mutasi transfer antar akun.
3. **📊 Anggaran Fleksibel**:
   - Pemantauan batas pengeluaran **Mingguan** & **Bulanan**.
   - Analisis makro **Metode 50/30/20** (*Needs 50%*, *Wants 30%*, *Savings 20%*).
4. **🔔 Tagihan Rutin (Recurring Bills)**: Pantau langganan bulanan (WiFi, Kos, Netflix) dan bayar sekali klik.
5. **👁️ Privasi Saldo**: Sensor mata untuk menyembunyikan nominal saldo saat berada di ruang publik.
6. **🌓 Dual Theme**: *Modern Dark Mode* (elegan & hemat baterai OLED) dan *Clean Minimalist Light Mode*.
7. **📲 PWA Ready**: Bisa di-instal langsung ke layar utama smartphone (*Add to Home Screen*).

---

## 🚀 Cara Menjalankan & Menghubungkan ke Google Sheets

### 1. Buka Aplikasi Web
- Anda bisa membuka file `index.html` langsung di browser, atau
- Aktifkan **GitHub Pages** (Settings > Pages > Branch `main` > Save) agar web ini memiliki URL online gratis (misal: `https://radhika25si.github.io/budgetku/`) yang bisa dibuka langsung dari HP!

### 2. Hubungkan ke Google Sheets (Hanya 3 Menit)
Panduan lengkap ada di file [backend/PANDUAN_SETUP_GOOGLE_SHEETS.md](./backend/PANDUAN_SETUP_GOOGLE_SHEETS.md):
1. Buat Google Spreadsheet baru di [sheets.new](https://sheets.new).
2. Buka menu **Extensions > Apps Script**, tempel kode dari [backend/Code.gs](./backend/Code.gs).
3. Jalankan fungsi **`setupSheet`** satu kali untuk membuat 5 lembar sheet otomatis.
4. Klik **Deploy > New deployment > Web app** (pilih *Who has access: Anyone*), lalu salin Web App URL.
5. Masuk ke menu **Setelan (Settings)** di BudgetKu, tempel URL-nya, lalu klik **Simpan & Tes Koneksi**. Selesai!

---

## 📂 Struktur Berkas
```text
mybudget/
├── backend/
│   ├── Code.gs                          # Kode backend Google Apps Script REST API
│   └── PANDUAN_SETUP_GOOGLE_SHEETS.md   # Panduan integrasi Spreadsheet
├── index.html                           # Antarmuka web mobile BudgetKu
├── app.js                              # Logika state, API sync, & interaktivitas
├── manifest.json                        # PWA web manifest untuk HP
├── sw.js                                # Service worker caching
├── PRD.md                               # Dokumen Product Requirements lengkap
├── .gitignore
└── README.md
```

---

## 📄 Spesifikasi Lengkap
Pelajari arsitektur dan spesifikasi mendalam pada [PRD.md](./PRD.md).
