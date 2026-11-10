-- Seed konten awal bantuan dan ketentuan.
-- Aman dijalankan ulang: konten yang sudah diedit admin (updated_by terisi)
-- tidak akan ditimpa.
BEGIN;

INSERT INTO public.site_contents (content_type, audience, payload)
VALUES
(
  'faq',
  'consumer',
  $json$[
    {"question":"Bagaimana cara membuat akun konsumen?","answer":"Pilih Konsumen pada halaman Daftar, isi data yang diminta, baca Syarat & Ketentuan Konsumen, lalu centang persetujuan sebelum mengirim formulir."},
    {"question":"Bagaimana cara masuk ke akun?","answer":"Pilih Masuk, masukkan email dan kata sandi yang terdaftar, lalu tekan tombol Masuk."},
    {"question":"Bagaimana cara mencari makanan surplus?","answer":"Buka menu Jelajah untuk melihat makanan yang tersedia. Gunakan pencarian atau kategori untuk menemukan pilihan yang sesuai."},
    {"question":"Bagaimana cara melihat informasi lengkap makanan?","answer":"Pilih kartu makanan untuk melihat deskripsi, harga, stok, informasi supplier, dan batas waktu pengambilan yang tersedia."},
    {"question":"Bagaimana cara memesan makanan?","answer":"Pilih makanan dan jumlah yang diinginkan, tambahkan ke keranjang, lalu lanjutkan ke checkout untuk memeriksa pesanan."},
    {"question":"Bagaimana cara memilih pengambilan atau pengantaran?","answer":"Pada checkout, pilih opsi yang tersedia untuk pesanan. Pengantaran hanya dapat dipilih jika memang tersedia untuk pesanan tersebut."},
    {"question":"Bagaimana cara membayar pesanan?","answer":"Ikuti instruksi pembayaran yang muncul saat checkout. Periksa kembali jumlah dan rincian pesanan sebelum menyelesaikan pembayaran."},
    {"question":"Di mana saya bisa melihat status pesanan?","answer":"Buka menu Pesanan Saya, lalu pilih pesanan untuk melihat status dan informasi prosesnya."},
    {"question":"Bisakah saya membatalkan pesanan?","answer":"Ketersediaan pembatalan bergantung pada status pesanan dan aturan yang ditampilkan. Hubungi supplier atau admin sesegera mungkin jika perlu bantuan."},
    {"question":"Apa yang harus dilakukan jika pesanan tidak sesuai?","answer":"Simpan bukti pesanan dan dokumentasikan masalahnya, lalu hubungi supplier atau admin melalui informasi kontak pada halaman Bantuan."},
    {"question":"Apa yang harus saya lakukan jika makanan diduga tidak aman?","answer":"Jangan konsumsi makanan tersebut. Simpan bukti yang relevan dan segera laporkan kepada admin melalui kanal Bantuan."},
    {"question":"Bagaimana cara mengetahui bahan atau alergen makanan?","answer":"Periksa deskripsi makanan dan tanyakan langsung kepada supplier bila informasinya belum tersedia. Jangan mengonsumsi makanan jika ada risiko alergi yang belum dapat dipastikan."},
    {"question":"Bagaimana cara memberikan ulasan?","answer":"Jika fitur ulasan tersedia untuk pesanan yang telah selesai, buka pesanan tersebut dan ikuti petunjuk untuk mengirim ulasan."},
    {"question":"Bagaimana cara mengubah informasi profil?","answer":"Buka menu Profil, perbarui informasi yang tersedia, kemudian simpan perubahan."},
    {"question":"Bagaimana cara menghubungi admin?","answer":"Buka halaman Bantuan atau lihat bagian Hubungi Kami untuk mengetahui email, telepon, dan jam layanan yang berlaku."}
  ]$json$::jsonb
),
(
  'faq',
  'supplier',
  $json$[
    {"question":"Bagaimana cara mendaftar sebagai supplier?","answer":"Pilih Supplier pada halaman Daftar, isi data pemilik dan usaha, baca Syarat & Ketentuan Supplier, lalu centang persetujuan sebelum mengirim formulir."},
    {"question":"Informasi apa yang perlu disiapkan untuk mendaftar?","answer":"Siapkan nama pemilik, nama toko atau outlet, email aktif, nomor telepon, alamat usaha, dan informasi lain yang diminta pada formulir."},
    {"question":"Bagaimana cara masuk ke dashboard supplier?","answer":"Setelah akun berhasil dibuat, masuk menggunakan email dan kata sandi yang didaftarkan. Dashboard supplier akan terbuka jika akun memiliki peran supplier."},
    {"question":"Bagaimana cara menambahkan makanan surplus?","answer":"Buka menu Tambah Makanan, lengkapi informasi produk, harga, stok, kategori, waktu pengambilan, dan foto bila tersedia, kemudian simpan."},
    {"question":"Informasi apa yang harus dicantumkan pada makanan?","answer":"Cantumkan nama dan deskripsi yang benar, harga, stok, batas waktu pengambilan, serta informasi bahan atau alergen yang relevan dan diketahui."},
    {"question":"Bagaimana cara mengubah atau menghentikan penjualan makanan?","answer":"Buka daftar makanan di dashboard, pilih produk untuk diedit atau dinonaktifkan, lalu simpan perubahan agar informasi yang tampil tetap akurat."},
    {"question":"Bagaimana cara mengelola stok?","answer":"Perbarui stok sesegera mungkin ketika jumlah makanan berubah. Jangan menerima pesanan melebihi jumlah yang benar-benar tersedia."},
    {"question":"Bagaimana cara melihat pesanan masuk?","answer":"Buka menu Pesanan Masuk pada dashboard supplier untuk memeriksa pesanan dan statusnya."},
    {"question":"Apa yang harus dilakukan setelah menerima pesanan?","answer":"Periksa rincian dan tenggat pengambilan, siapkan jumlah yang dipesan, lalu perbarui status pesanan sesuai proses yang benar-benar terjadi."},
    {"question":"Bagaimana cara menangani pesanan yang tidak dapat dipenuhi?","answer":"Segera hubungi konsumen dan admin, jelaskan kendalanya dengan jujur, dan ikuti prosedur pembatalan atau penyelesaian yang berlaku."},
    {"question":"Apa kewajiban supplier terkait keamanan pangan?","answer":"Supplier bertanggung jawab menjaga makanan tetap aman, layak dikonsumsi, ditangani secara higienis, dan dikemas dengan sesuai selama berada dalam kendalinya."},
    {"question":"Bagaimana cara menyimpan dan mengemas makanan?","answer":"Gunakan kondisi penyimpanan dan kemasan yang sesuai dengan jenis makanan, cegah kontaminasi, dan berikan petunjuk penyimpanan atau konsumsi jika diperlukan."},
    {"question":"Apa yang harus dilakukan jika ada dugaan makanan tidak aman?","answer":"Hentikan penjualan produk yang terdampak, jangan serahkan produk tersebut, dan segera beri tahu admin serta pihak terkait sesuai ketentuan yang berlaku."},
    {"question":"Bagaimana cara memperbarui informasi toko?","answer":"Buka Profil Toko, perbarui nama, alamat, deskripsi, atau kontak yang tersedia, lalu simpan perubahan."},
    {"question":"Bagaimana cara menghubungi admin?","answer":"Buka halaman Bantuan atau lihat bagian Hubungi Kami untuk mengetahui kanal dan jam layanan admin."}
  ]$json$::jsonb
),
(
  'food_policy',
  'consumer',
  $json$[
    {"title":"Hak atas informasi pangan","content":"Sebelum memesan, konsumen sebaiknya memeriksa nama, deskripsi, harga, kondisi, dan batas waktu pengambilan yang dicantumkan. Jika informasi penting tidak tersedia atau tidak jelas, tanyakan kepada supplier sebelum membeli.","reference":"Undang-Undang Nomor 18 Tahun 2012 tentang Pangan sebagaimana diubah, antara lain, melalui Undang-Undang Nomor 6 Tahun 2023; Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen."},
    {"title":"Pemeriksaan saat menerima pesanan","content":"Periksa kesesuaian pesanan dan kondisi kemasan saat menerima makanan. Jika kemasan rusak, makanan tampak berubah, atau terdapat dugaan kontaminasi, jangan konsumsi dan segera dokumentasikan serta laporkan kepada supplier dan admin.","reference":"Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026."},
    {"title":"Penyimpanan dan konsumsi","content":"Ikuti petunjuk penyimpanan, batas waktu pengambilan, dan informasi konsumsi yang diberikan supplier. Setelah makanan berada dalam penguasaan konsumen, tangani dan simpan sesuai jenis makanan serta jangan konsumsi apabila kondisi atau keamanannya diragukan.","reference":"Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026."},
    {"title":"Alergi dan kebutuhan khusus","content":"Konsumen yang memiliki alergi atau kebutuhan pangan khusus perlu meminta informasi bahan kepada supplier sebelum memesan. Informasi bahan yang disampaikan melalui platform bukan pengganti konfirmasi langsung jika ada risiko kesehatan.","reference":"Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen; ketentuan pelabelan pangan yang berlaku untuk jenis produk terkait."},
    {"title":"Pelaporan dugaan masalah keamanan pangan","content":"Segera hentikan konsumsi bila muncul dugaan masalah keamanan pangan. Simpan bukti pesanan dan informasi produk, lalu hubungi supplier serta admin melalui halaman Bantuan agar laporan dapat ditindaklanjuti.","reference":"Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026; Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen."}
  ]$json$::jsonb
),
(
  'food_policy',
  'supplier',
  $json$[
    {"title":"Tanggung jawab atas keamanan pangan","content":"Supplier hanya boleh menawarkan pangan yang aman dan layak dikonsumsi serta wajib memenuhi ketentuan keamanan pangan yang berlaku untuk jenis pangan dan kegiatan usahanya. Kebijakan platform ini tidak menggantikan kewajiban perizinan atau kewajiban hukum lainnya.","reference":"Undang-Undang Nomor 18 Tahun 2012 tentang Pangan sebagaimana diubah, antara lain, melalui Undang-Undang Nomor 6 Tahun 2023; Peraturan Pemerintah Nomor 86 Tahun 2019 sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026."},
    {"title":"Higiene, penanganan, dan pencegahan kontaminasi","content":"Jaga kebersihan orang, alat, bahan, tempat, dan proses penanganan sesuai jenis pangan. Pisahkan pangan dari sumber pencemaran dan gunakan praktik penyimpanan serta pengangkutan yang menjaga keamanan dan mutu produk.","reference":"Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026."},
    {"title":"Informasi produk yang jujur dan jelas","content":"Cantumkan informasi produk, harga, jumlah, kondisi, batas waktu pengambilan, dan cara penyimpanan secara akurat serta tidak menyesatkan. Penuhi ketentuan label atau informasi pangan yang diwajibkan untuk kategori produk yang dijual.","reference":"Undang-Undang Nomor 18 Tahun 2012 tentang Pangan; Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen; ketentuan label pangan yang berlaku."},
    {"title":"Bahan, alergen, dan klaim produk","content":"Sampaikan informasi bahan dan alergen yang diketahui secara jujur. Jangan membuat klaim kesehatan, keamanan, sertifikasi, atau klaim lain yang tidak dapat dibuktikan dan tidak sesuai ketentuan.","reference":"Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen; ketentuan informasi dan label pangan yang berlaku untuk produk terkait."},
    {"title":"Kemasan dan penyerahan pesanan","content":"Gunakan kemasan yang sesuai dan bersih, lindungi pangan dari kontaminasi, serta serahkan pesanan sesuai waktu dan metode yang disepakati. Untuk pangan yang memerlukan kondisi penyimpanan tertentu, jaga kondisi tersebut selama pangan berada dalam kendali supplier.","reference":"Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026."},
    {"title":"Produk tidak aman, keluhan, dan penghentian penjualan","content":"Jika mengetahui atau menduga produk tidak aman, segera hentikan penawaran dan penyerahan produk terdampak, beri tahu admin, dan bekerja sama dalam penanganan keluhan atau penarikan sesuai ketentuan yang berlaku.","reference":"Peraturan Pemerintah Nomor 86 Tahun 2019 tentang Keamanan Pangan sebagaimana diubah dengan Peraturan Pemerintah Nomor 1 Tahun 2026; Undang-Undang Nomor 8 Tahun 1999 tentang Perlindungan Konsumen."}
  ]$json$::jsonb
),
(
  'terms',
  'consumer',
  $json$[
    {"title":"Akun dan informasi pengguna","content":"Konsumen wajib memberikan informasi pendaftaran yang benar dan menjaga kerahasiaan kredensial akun. Aktivitas yang dilakukan melalui akun menjadi tanggung jawab pengguna, kecuali diwajibkan lain oleh hukum."},
    {"title":"Informasi dan ketersediaan makanan","content":"Informasi produk, stok, harga, dan waktu pengambilan disediakan berdasarkan data supplier dan dapat berubah. Konsumen perlu memeriksa rincian pesanan sebelum melakukan pembayaran."},
    {"title":"Pesanan dan pembayaran","content":"Pesanan dianggap diajukan setelah konsumen mengikuti proses checkout. Konsumen wajib mengikuti instruksi pembayaran yang ditampilkan. Status pesanan mengikuti konfirmasi sistem dan supplier."},
    {"title":"Pengambilan atau pengantaran","content":"Konsumen wajib memilih metode yang tersedia dan mengikuti waktu, lokasi, serta petunjuk penyerahan yang ditampilkan. Pastikan informasi alamat dan kontak yang diberikan benar."},
    {"title":"Pembatalan, pengembalian, dan keluhan","content":"Permintaan pembatalan, pengembalian dana, atau penyelesaian masalah ditangani berdasarkan status transaksi, kebijakan yang ditampilkan, dan hak konsumen menurut peraturan perundang-undangan. Hubungi supplier atau admin dengan bukti yang relevan."},
    {"title":"Keamanan pangan","content":"Konsumen dianjurkan memeriksa kondisi pesanan dan mengikuti petunjuk penyimpanan atau konsumsi. Laporkan dugaan pangan tidak aman dan jangan konsumsi produk yang kondisinya diragukan."},
    {"title":"Perilaku dan penggunaan layanan","content":"Konsumen dilarang menggunakan layanan untuk penipuan, mengganggu pengguna lain, atau menyebarkan informasi yang melanggar hukum. Komunikasi dengan supplier dan admin harus dilakukan secara wajar dan sopan."},
    {"title":"Data pribadi","content":"Data pribadi diproses untuk menjalankan akun, pesanan, dukungan pelanggan, dan keamanan layanan sesuai kebijakan privasi yang berlaku serta peraturan perlindungan data pribadi."},
    {"title":"Perubahan layanan dan ketentuan","content":"Admin dapat memperbarui layanan dan ketentuan. Perubahan penting akan diinformasikan melalui platform. Persetujuan terhadap versi ketentuan yang berlaku dicatat saat pendaftaran."},
    {"title":"Hak berdasarkan hukum","content":"Ketentuan ini tidak dimaksudkan untuk menghapus atau membatasi hak konsumen yang tidak dapat dikesampingkan menurut peraturan perundang-undangan yang berlaku."}
  ]$json$::jsonb
),
(
  'terms',
  'supplier',
  $json$[
    {"title":"Akun dan informasi usaha","content":"Supplier wajib memberikan informasi pemilik, usaha, kontak, dan produk yang benar serta memperbaruinya jika berubah. Supplier bertanggung jawab menjaga keamanan akun dan tidak membagikan kredensial."},
    {"title":"Kepatuhan usaha dan perizinan","content":"Supplier bertanggung jawab memastikan kegiatan usaha, fasilitas, dan produk memenuhi perizinan, standar, sertifikasi, serta persyaratan hukum yang berlaku sesuai jenis produk dan skala usahanya."},
    {"title":"Keamanan dan mutu pangan","content":"Supplier bertanggung jawab atas keamanan dan mutu pangan selama berada dalam kendalinya, termasuk penanganan, kebersihan, penyimpanan, pengemasan, dan penyerahan sesuai peraturan yang berlaku."},
    {"title":"Informasi produk dan iklan","content":"Supplier wajib menyampaikan deskripsi, komposisi atau informasi bahan yang diketahui, kondisi, stok, harga, batas waktu pengambilan, dan klaim produk secara akurat serta tidak menyesatkan. Ketentuan label wajib dipenuhi apabila berlaku."},
    {"title":"Stok, harga, dan pemenuhan pesanan","content":"Supplier wajib menjaga data stok dan harga tetap akurat, hanya menerima pesanan yang mampu dipenuhi, menyiapkan produk sesuai pesanan, serta memperbarui status secara jujur."},
    {"title":"Pembatalan dan penanganan keluhan","content":"Jika pesanan tidak dapat dipenuhi atau ada masalah produk, supplier wajib segera memberi tahu konsumen dan admin serta bekerja sama menyelesaikan keluhan, pengembalian, atau tindakan korektif sesuai hukum dan kebijakan yang berlaku."},
    {"title":"Produk diduga tidak aman","content":"Supplier wajib segera menghentikan penjualan dan penyerahan produk yang diketahui atau diduga tidak aman, memberi tahu admin, dan melakukan tindakan penanganan yang diwajibkan peraturan."},
    {"title":"Biaya dan transaksi","content":"Supplier wajib memeriksa informasi biaya atau ketentuan transaksi yang ditampilkan platform. Pencatatan dan penyelesaian transaksi mengikuti status yang tercatat dalam sistem."},
    {"title":"Perilaku dan penggunaan platform","content":"Supplier dilarang menyalahgunakan platform, memanipulasi pesanan atau ulasan, mengunggah konten melanggar hukum, atau menggunakan data konsumen di luar keperluan transaksi dan dukungan yang sah."},
    {"title":"Peninjauan dan penangguhan akun","content":"Admin dapat meninjau konten atau aktivitas supplier dan mengambil tindakan yang proporsional, termasuk membatasi atau menangguhkan akun, apabila terdapat dugaan pelanggaran, risiko keamanan pangan, atau kewajiban hukum."},
    {"title":"Data pribadi","content":"Supplier hanya boleh menggunakan informasi konsumen untuk memenuhi pesanan dan keperluan layanan yang sah, menjaga kerahasiaannya, serta mematuhi peraturan perlindungan data pribadi."},
    {"title":"Perubahan ketentuan dan tanggung jawab","content":"Admin dapat memperbarui ketentuan dan akan menginformasikan perubahan penting melalui platform. Supplier tetap bertanggung jawab atas kewajiban hukum yang melekat pada produk dan kegiatan usahanya."}
  ]$json$::jsonb
)
ON CONFLICT (content_type, audience) DO UPDATE
SET payload = EXCLUDED.payload
WHERE public.site_contents.updated_by IS NULL
  AND public.site_contents.payload IS DISTINCT FROM EXCLUDED.payload;

COMMIT;
