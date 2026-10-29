# Inventory API

RESTful API **Sistem Manajemen Inventaris Barang** — Node.js (Express) + PostgreSQL.

**Fitur:** register & login (JWT), CRUD barang (khusus user login), search + pagination, validasi input (Zod), pengurangan stok yang aman dari race condition.

## Stack & Keputusan Teknis

| Hal | Pilihan | Alasan singkat |
|---|---|---|
| Framework | Express 5 | Ringan, ekosistem luas |
| Database | PostgreSQL 16 | Transaksi & constraint kuat (penting untuk stok) |
| Akses data | `pg` + SQL langsung | Query atomik untuk stok terlihat eksplisit, tanpa abstraksi ORM |
| Validasi | Zod | Skema deklaratif, hasil parse sudah bersih/ter-coerce |
| Auth | JWT (HS256) + bcrypt | Stateless, password di-hash |

Barang bersifat **milik masing-masing user**: setiap query difilter `user_id`, jadi user A tidak bisa melihat/mengubah barang user B (akan mendapat 404).

## Struktur Proyek

```
src/
  app.js, server.js, config.js, db.js, errors.js
  middlewares/   auth.js (JWT) · validate.js (Zod) · errorHandler.js
  modules/
    auth/        routes → controller → service → repository (+ schema)
    items/       routes → controller → service → repository (+ schema)
db/init.sql      skema tabel + constraint
docs/postman_collection.json
scripts/         migrate.js · concurrency-test.js
```

## Menjalankan Lokal

### Opsi A — Docker Compose (paling mudah)

```bash
docker compose up --build
```
API: `http://localhost:3000` · cek: `GET /health`. Skema dibuat otomatis dari `db/init.sql` saat volume database pertama kali dibuat.
(Opsional) set secret sendiri: `JWT_SECRET=string-acak-panjang docker compose up --build`

Tips:
- Pastikan Docker Desktop sudah berjalan sebelum menjalankan perintah di atas.
- `init.sql` hanya dieksekusi sekali. Untuk mengulang dari database kosong: `docker compose down -v`, lalu `docker compose up --build`.
- Port PostgreSQL tidak dibuka ke host agar tidak bentrok dengan PostgreSQL lokal. Hanya API (port 3000) yang bisa diakses dari luar container.

### Opsi B — Manual (butuh Node.js ≥ 18 & PostgreSQL)

```bash
createdb inventory                 # atau lewat psql / pgAdmin
cp .env.example .env               # lalu isi DATABASE_URL & JWT_SECRET (lihat di bawah)
npm install
npm run migrate                    # membuat tabel
npm start                          # atau: npm run dev
```

**Mengisi file `.env`.** File `.env` tidak ikut di repository (ada di `.gitignore`), jadi buat sendiri dari `.env.example` dan sesuaikan dengan PostgreSQL di komputer Anda:

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/inventory
JWT_SECRET=<string-acak-minimal-32-karakter>
JWT_EXPIRES_IN=1h
```

- Ganti `<user>` dan `<password>` dengan akun PostgreSQL lokal Anda (umumnya user `postgres`).
- Jika password mengandung karakter khusus, tulis dalam bentuk URL-encoded, misalnya `@` menjadi `%40` dan `#` menjadi `%23`.
- `JWT_SECRET` bisa dibuat dengan perintah: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Aplikasi akan berhenti dengan pesan error jika `DATABASE_URL` atau `JWT_SECRET` belum diisi.

Dengan Docker Compose (Opsi A) langkah ini tidak diperlukan, karena database dan kredensialnya dibuat otomatis di dalam container.

## Dokumentasi API

Import **`docs/postman_collection.json`** ke Postman, lalu jalankan request secara berurutan: **Register → Login → Create Item → List → Get → Update → Decrease Stock → Delete**.

- *Login* menyimpan token otomatis ke variabel `{{token}}`, dan *Create Item* menyimpan `{{itemId}}` otomatis.
- Akun contoh di collection: `yahya@example.com` / `password123`. Jika email sudah terdaftar, *Register* akan membalas `409`. Itu normal, langsung jalankan *Login*.

Semua response berformat `{ "success": true|false, "data": ..., "meta": ... }`.

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/auth/register` | – | `name`, `email`, `password` (min 8) → 201 |
| POST | `/auth/login` | – | → `{ token, user }` |
| POST | `/items` | ✔ | `name`, `description?`, `stock` (int ≥ 0), `price` (≥ 0) → 201 |
| GET | `/items?search=&page=1&limit=10` | ✔ | Cari di nama/deskripsi; `limit` maks 100; `meta`: page, limit, total, totalPages |
| GET | `/items/:id` | ✔ | Detail barang |
| PUT | `/items/:id` | ✔ | Ganti seluruh data barang |
| DELETE | `/items/:id` | ✔ | → 204 |
| PATCH | `/items/:id/decrease-stock` | ✔ | `{ "quantity": n }` — atomik; 409 jika stok tidak cukup |

Header untuk endpoint ber-auth: `Authorization: Bearer <token>`.

Catatan: `id` dikembalikan sebagai string karena kolom `BIGSERIAL` dibaca driver `pg` sebagai bigint (aman untuk angka besar). Field `stock` dan `price` berupa number.

Kode status: `400` JSON rusak · `401` token tidak ada/invalid · `404` tidak ditemukan · `409` duplikat / stok tidak cukup · `413` body lebih dari 100 KB · `422` validasi gagal · `500` kesalahan server.

**Validasi:** `stock` harus integer ≥ 0 dan bertipe number (string `"5"` ditolak), `price` ≥ 0, email valid, panjang field dibatasi. Validasi dilakukan di middleware sebelum menyentuh database, ditambah `CHECK (stock >= 0)` di database sebagai pertahanan terakhir.

## Contoh Request (curl)

```bash
# Register & Login
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Yahya","email":"yahya@example.com","password":"password123"}'

curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"yahya@example.com","password":"password123"}'
# -> salin nilai "token" dari response, simpan ke TOKEN

TOKEN="<token>"

# Tambah barang
curl -X POST http://localhost:3000/items -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Kabel USB-C","description":"Panjang 1 meter","stock":10,"price":25000}'

# Daftar barang (search + pagination)
curl "http://localhost:3000/items?search=kabel&page=1&limit=10" -H "Authorization: Bearer $TOKEN"

# Kurangi stok
curl -X PATCH http://localhost:3000/items/1/decrease-stock -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"quantity":1}'
```

## Skema Database

| Tabel | Kolom penting | Constraint |
|---|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `created_at` | `email` UNIQUE |
| `items` | `id`, `user_id`, `name`, `description`, `stock`, `price`, `created_at`, `updated_at` | `CHECK (stock >= 0)`, `CHECK (price >= 0)`, `user_id` → `users(id)` ON DELETE CASCADE |

## Uji Konkurensi

Dengan API berjalan:

```bash
npm run test:concurrency
```
Skrip membuat barang dengan stok 1 lalu menembakkan 20 request pengurangan stok **bersamaan**. Hasil yang benar: 1 sukses (200), 19 ditolak (409), stok akhir 0.

Hasil pada pengujian lokal:

```
Request paralel : 20
Sukses (200)    : 1
Ditolak (409)   : 19
Stok akhir      : 0
```

---

# Jawaban Pertanyaan Pemahaman

## 1. Alur Request

Request dari client masuk ke Express dulu, lewat `helmet` dan `express.json` (supaya body JSON bisa dibaca). Lalu router mencocokkan method dan path ke handler yang sesuai. Sebelum sampai ke handler, request melewati dua middleware. Yang pertama `auth`, yang mengecek token JWT dan menyimpan id user di `req.user`. Yang kedua `validate`, yang memeriksa body atau query dengan skema Zod. Kalau token salah atau datanya tidak valid, request berhenti di situ dan langsung dibalas 401 atau 422, jadi database tidak tersentuh sama sekali.

Kalau lolos, controller mengambil data dari request lalu memanggil service. Service berisi aturan bisnis, misalnya melempar 404 kalau barang tidak ditemukan, atau 409 kalau stok tidak cukup. Setelah itu service memanggil repository, satu-satunya tempat saya menulis query SQL ke PostgreSQL. Hasilnya dikembalikan lewat jalur yang sama sampai controller menulis response. Kalau ada error di mana pun, `errorHandler` di bagian akhir yang membuat responsnya, jadi formatnya selalu seragam.

```
Client -> Express -> Router -> auth + validate -> Controller -> Service -> Repository -> PostgreSQL
```

Contohnya `POST /items`. Token dicek dulu, lalu body divalidasi (nama wajib diisi, stok harus bilangan bulat dan tidak negatif). Controller meneruskan `req.user.id` dan body ke service, service memanggil repository, dan repository menjalankan `INSERT ... RETURNING`. Hasilnya dikirim kembali dengan status 201.

Alasan saya memisahkan lapisan seperti ini sederhana: tiap bagian punya satu tugas. Controller hanya mengurus HTTP, service mengurus aturan, repository mengurus database. Kalau nanti saya mau mengganti query atau pindah ke ORM, yang berubah cuma repository. Aturan seperti "stok tidak boleh kurang dari nol" juga cukup ditulis di satu tempat, tidak diulang di setiap endpoint, dan kalau ada bug lebih mudah dicari asalnya. Jujur saja, untuk project sekecil ini beberapa fungsi service cuma meneruskan ke repository, jadi terasa agak berlebihan. Tapi saya sengaja tetap memakai pola ini supaya gampang dikembangkan.

## 2. Penyimpanan Token JWT di Frontend

Saya memilih HttpOnly cookie, dengan flag `Secure` dan `SameSite=Lax` atau `Strict`.

Alasannya, token yang disimpan di localStorage bisa dibaca oleh JavaScript apa pun yang jalan di halaman itu. Kalau ada celah XSS, atau salah satu library npm yang dipakai frontend disusupi, token bisa dicuri dan dipakai dari mana saja. Cookie HttpOnly tidak bisa dibaca JavaScript, jadi token tidak bisa dibawa keluar walaupun halamannya kena XSS. Penyerang masih bisa mengirim request dari browser korban, tapi tokennya sendiri tetap aman.

Cookie juga punya risiko, yaitu CSRF, karena browser mengirim cookie secara otomatis. Tapi risiko ini lebih mudah ditutup, misalnya dengan `SameSite`, CORS yang hanya mengizinkan origin tertentu, dan CSRF token kalau perlu. Sedangkan XSS sulit dijamin tidak akan pernah terjadi. Karena itu cookie menurut saya pilihan yang lebih aman.

API saya sekarang mengembalikan token di body response dan membacanya dari header `Authorization: Bearer`, supaya mudah diuji lewat Postman. Kalau dipakai frontend browser sungguhan, saya akan mengubah login supaya mengirim `Set-Cookie` HttpOnly dan menambahkan refresh token. Header Bearer tetap masuk akal untuk mobile app atau komunikasi antar server.

## 3. Penanganan Konkurensi (stok tersisa 1, dua request bersamaan)

Masalahnya muncul kalau stok dicek dulu, baru dikurangi di langkah terpisah. Dua request bisa sama-sama membaca stok 1, sama-sama lolos pengecekan, lalu sama-sama mengurangi, sehingga stok jadi -1.

Solusi saya adalah menggabungkan pengecekan dan pengurangan dalam satu query:

```sql
UPDATE items
   SET stock = stock - $3
 WHERE id = $1 AND user_id = $2 AND stock >= $3
RETURNING *;
```

Saat query ini jalan, PostgreSQL mengunci baris yang sedang di-update. Request kedua menunggu sampai yang pertama selesai, lalu mengevaluasi ulang kondisi `WHERE` dengan data terbaru. Stok sudah 0, jadi `stock >= 1` tidak terpenuhi, tidak ada baris yang berubah, dan service membalas 409. Tidak perlu lock di sisi aplikasi, dan cara ini tetap aman walaupun API dijalankan di banyak instance. Sebagai pengaman tambahan, tabel `items` punya `CHECK (stock >= 0)` sehingga database sendiri menolak nilai negatif.

Saya membuktikannya dengan `scripts/concurrency-test.js`: 20 request dikirim bersamaan ke barang yang stoknya 1. Hasilnya 1 berhasil, 19 ditolak dengan 409, dan stok akhir 0.

Ada cara lain yang saya tahu. Yang pertama `SELECT ... FOR UPDATE` di dalam transaksi, berguna kalau ada logika rumit di antara membaca dan menulis, tapi transaksinya lebih lama dan bisa menyebabkan deadlock. Yang kedua optimistic locking dengan kolom `version`, cocok kalau konflik jarang terjadi. Untuk kasus ini UPDATE atomik paling sederhana dan sudah cukup.

## Rencana Pengembangan

Kalau dilanjutkan ke produksi, saya akan menambahkan rate limiting di endpoint login, refresh token dan logout, CORS dengan daftar origin yang diizinkan, logging yang lebih rapi, test otomatis, dan sistem migrasi database sebagai pengganti `init.sql`.