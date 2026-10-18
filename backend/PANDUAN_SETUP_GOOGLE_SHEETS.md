# 🛠️ Panduan Menghubungkan Google Sheets & Apps Script ke BudgetKu

Panduan langkah demi langkah (hanya butuh waktu ~3 menit) untuk menyiapkan database Google Sheets gratis Anda.

---

### Langkah 1: Buat Google Spreadsheet Baru
1. Buka browser dan pergi ke: [sheets.new](https://sheets.new) (atau buka Google Drive lalu buat Spreadsheet baru).
2. Beri nama file Spreadsheet Anda, misalnya: **Database BudgetKu**.

---

### Langkah 2: Buka Google Apps Script Editor
1. Di menu atas Google Spreadsheet, klik: **Extensions (Ekstensi)** > **Apps Script**.
2. Tab baru Apps Script editor akan terbuka.
3. Hapus semua kode default (`function myFunction() { ... }`).
4. Buka file [Code.gs](./Code.gs) di folder proyek ini, **salin (copy) semua isinya**, lalu **tempel (paste)** ke editor Apps Script tersebut.
5. Klik ikon **Save (Simpan / Ctrl+S)**.

---

### Langkah 3: Inisialisasi Database Otomatis (Hanya Sekali)
1. Di bagian atas editor Apps Script, pada menu dropdown fungsi, pilih: **`setupSheet`**.
2. Klik tombol **Run (Jalankan)**.
3. Google akan meminta izin akses (*Authorization Required*):
   - Klik **Review permissions (Tinjau izin)**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced (Lanjutan)** di kiri bawah > klik **Go to Untitled project (unsafe)**.
   - Klik **Allow (Izinkan)**.
4. Tunggu ~5 detik sampai log eksekusi selesai (*Execution completed*).
5. Sekarang kembali ke tab Google Spreadsheet Anda: Anda akan melihat 5 tab sheet (`Transactions`, `Wallets`, `Categories`, `Budgets`, `RecurringBills`) sudah terbuat rapi secara otomatis lengkap dengan warna dan data contoh!

---

### Langkah 4: Deploy Menjadi Web App API
1. Di kanan atas editor Apps Script, klik tombol biru: **Deploy (Terapkan)** > **New deployment (Penerapan baru)**.
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Isi konfigurasi berikut:
   - **Description**: `BudgetKu API v1`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: **`Anyone`** *(PENTING: Pilih "Anyone" agar aplikasi web di HP Anda bisa mengirim & mengambil data tanpa error CORS)*.
4. Klik tombol **Deploy (Terapkan)**.
5. Google akan menampilkan **Web app URL** (URL berakhiran `/exec`).
6. **Salin (Copy) Web app URL tersebut!**

---

### Langkah 5: Tempel URL ke Web BudgetKu
1. Buka aplikasi web **BudgetKu** di HP atau browser Anda.
2. Buka menu **Pengaturan (Settings)**.
3. Tempel Web App URL tadi ke kolom **URL Google Apps Script**, lalu klik **Simpan & Tes Koneksi**.
4. Selesai! Web BudgetKu Anda sekarang 100% terhubung secara *live* dengan Google Spreadsheet Anda!
