(function(){
  const examId = "UAS_PSI";
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isExamActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-12-09T08:00:00');
    const endTime = new Date('2024-12-09T10:00:00');

    if (now < startTime || now > endTime) {
        alert(`Akses ujian hanya tersedia pada ${startTime.toLocaleDateString()} pukul ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}.`);
        return false;
    }
    return true;
  }

  // Cek akses ganda
  function checkDuplicateAccess(fullname, nim, angkatan) {
      const accessKey = `${examId}_${fullname}_${nim}_${angkatan}`;
      if (localStorage.getItem(accessKey)) {
          alert('Anda sudah mengakses ujian ini sebelumnya.');
          return false;
      }
      localStorage.setItem(accessKey, 'true');
      return true;
  }

  // Fullscreen functions
  function enterFullscreen(element) {
      if(element.requestFullscreen) {
          element.requestFullscreen();
      } else if(element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
      } else if(element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen();
      } else if(element.msRequestFullscreen) {
          element.msRequestFullscreen();
      }
  }

  function handleFullscreenChange() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && 
          !document.mozFullScreenElement && !document.msFullscreenElement) {
          if (isExamActive) {
              alert("Mohon tetap dalam mode fullscreen selama ujian berlangsung.");
              enterFullscreen(document.documentElement);
          }
      }
  }

  function exitFullscreen() {
      if(document.exitFullscreen) {
          document.exitFullscreen();
      } else if(document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
      } else if(document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
      } else if(document.msExitFullscreen) {
          document.msExitFullscreen();
      }
  }

  // Exam functions
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  function startExam() {
      if (!validateAccess()) return;

      userData.fullname = document.getElementById('fullname').value;
      userData.nim = document.getElementById('nim').value;
      userData.angkatan = document.getElementById('angkatan').value;

      if (!userData.fullname || !userData.nim || !userData.angkatan) {
          alert('Mohon isi semua data diri.');
          return;
      }

      if (!checkDuplicateAccess(userData.fullname, userData.nim, userData.angkatan)) return;

      isExamActive = true;
      enterFullscreen(document.documentElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      document.getElementById('registration-form').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');

      shuffleArray(questions);

      // Select only 50 questions
      questions = questions.slice(0, 60);
      questions.forEach(q => shuffleArray(q.choices));

      showQuestion();
  }

  function showQuestion() {
      if (currentQuestion >= questions.length) {
          endExam();
          return;
      }

      const question = questions[currentQuestion];
      document.getElementById('question').textContent = question.question;
      document.getElementById('current-question').textContent = currentQuestion + 1;
      document.getElementById('total-questions').textContent = questions.length;

      const optionsContainer = document.getElementById('options');
      optionsContainer.innerHTML = '';
      question.choices.forEach((choice, index) => {
          const option = document.createElement('div');
          option.classList.add('option');
          option.textContent = choice;
          option.onclick = () => selectOption(index);
          optionsContainer.appendChild(option);
      });

      document.getElementById('progress').style.width = `${(currentQuestion + 1) / questions.length * 100}%`;

      startTimer();
  }

  function selectOption(index) {
      const options = document.querySelectorAll('.option');
      options.forEach(option => option.classList.remove('selected'));
      options[index].classList.add('selected');
  }

  function submitAnswer() {
      const selectedOption = document.querySelector('.option.selected');
      if (selectedOption) {
          const answer = selectedOption.textContent;
          if (answer === questions[currentQuestion].answer) {
              score += 1.67;
          }
      }

      currentQuestion++;
      clearInterval(timer);
      showQuestion();
  }

  function startTimer() {
      let timeLeft = 60;
      document.getElementById('timer').textContent = `Waktu: ${timeLeft}`;

      timer = setInterval(() => {
          timeLeft--;
          document.getElementById('timer').textContent = `Waktu: ${timeLeft}`;

          if (timeLeft <= 0) {
              clearInterval(timer);
              submitAnswer();
          }
      }, 1000);
  }

  function endExam() {
      isExamActive = false;
      document.getElementById('quiz-container').classList.add('hidden');
      document.getElementById('result-container').classList.remove('hidden');
      document.getElementById('score').textContent = score;

      sendResultToGoogleSheet(userData.fullname, userData.nim, score);

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  }

  function sendResultToGoogleSheet(fullName, nim, score) {
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbyktDAUd5UMImJskThFzrHFx4mWKfo7iLdBtrgL7VYqRDiuDaYx1lwrVOBRcO0L-cZX0w/exec';
      const now = new Date();
      const date = now.toLocaleDateString('id-ID');
      const time = now.toLocaleTimeString('id-ID');

      const data = {
          fullName: fullName,
          nim: nim,
          score: score,
          examTitle: examId,
          date: date,
          time: time
      };

      fetch(webAppUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
              'Content-Type': 'text/plain',
          },
          body: JSON.stringify(data)
      })
      .then(response => {
          console.log('Data berhasil dikirim ke Google Sheet');
      })
      .catch(error => {
          console.error('Error:', error);
          alert('Terjadi kesalahan saat mengirim data. Silakan coba lagi.');
      });
  }


  // Menghapus Data Residen
function clearResidentData() {
    const keysToRemove = Object.keys(localStorage).filter(key => key.startsWith("UAS_PSI_"));
    keysToRemove.forEach(key => localStorage.removeItem(key));
    alert("Data residen berhasil dihapus. Anda sekarang dapat mengikuti ujian kembali.");
}

// Event listener untuk tombol hapus data residen
document.addEventListener('DOMContentLoaded', function() {
    const clearAccessBtn = document.getElementById('clear-access-btn');
    if (clearAccessBtn) {
        clearAccessBtn.addEventListener('click', clearResidentData);
    }
});

  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
      const examInfoElement = document.getElementById('quiz-info');
      if (examInfoElement) {
          examInfoElement.textContent = `${examId}. Selamat Bekerja Semoga Sukses.`;
      }

      document.getElementById('start-btn').addEventListener('click', startExam);
      document.getElementById('submit-btn').addEventListener('click', submitAnswer);
      document.getElementById('exit-fullscreen').addEventListener('click', function() {
          isExamActive = false;
          exitFullscreen();
      });
  });

  // Prevent shortcuts and right-click
  window.blockShortcuts = function(e) {
      if(e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
          e.preventDefault();
          return false;
      }
  };

  document.oncontextmenu = function(e) {
      e.preventDefault();
      return false;
  };

  // Prevent back function
  history.pushState(null, null, location.href);
  window.onpopstate = function () {
      history.go(1);
  };

// Bank Soal dalam format JSON
questions = [
  {
    "question": "Apa yang dimaksud dengan jaringan komputer?",
    "choices": [
      "Sistem operasi untuk perangkat keras",
      "Sistem yang menghubungkan perangkat untuk berbagi sumber daya",
      "Program untuk membuat aplikasi",
      "Metode untuk mengatur data dalam database",
      "Kumpulan protokol komunikasi data"
    ],
    "answer": "Sistem yang menghubungkan perangkat untuk berbagi sumber daya"
  },
  {
    "question": "Jenis jaringan komputer yang mencakup area geografis luas disebut?",
    "choices": [
      "LAN",
      "MAN",
      "WAN",
      "PAN",
      "SAN"
    ],
    "answer": "WAN"
  },
  {
    "question": "Apa singkatan dari LAN?",
    "choices": [
      "Local Access Network",
      "Large Area Network",
      "Local Area Network",
      "Low Access Network",
      "Limited Area Network"
    ],
    "answer": "Local Area Network"
  },
  {
    "question": "Apa fungsi utama dari switch dalam jaringan?",
    "choices": [
      "Menghubungkan komputer ke internet",
      "Membagi bandwidth internet",
      "Menghubungkan perangkat dalam satu jaringan lokal",
      "Mengelola alamat IP perangkat",
      "Menyimpan data backup jaringan"
    ],
    "answer": "Menghubungkan perangkat dalam satu jaringan lokal"
  },
  {
    "question": "Protokol apa yang digunakan untuk mengirimkan email?",
    "choices": [
      "FTP",
      "SMTP",
      "HTTP",
      "SNMP",
      "POP3"
    ],
    "answer": "SMTP"
  },
  {
    "question": "Apa perbedaan utama antara IP versi 4 (IPv4) dan IP versi 6 (IPv6)?",
    "choices": [
      "Panjang alamat IP",
      "Protokol keamanan",
      "Kecepatan transfer data",
      "Kapasitas RAM yang didukung",
      "Jumlah port yang tersedia"
    ],
    "answer": "Panjang alamat IP"
  },
  {
    "question": "Apa fungsi dari firewall dalam jaringan?",
    "choices": [
      "Mengelola koneksi perangkat",
      "Melindungi jaringan dari akses tidak sah",
      "Mempercepat transfer data",
      "Menggandakan data jaringan",
      "Mengoptimalkan bandwidth jaringan"
    ],
    "answer": "Melindungi jaringan dari akses tidak sah"
  },
  {
    "question": "Apa yang dimaksud dengan topologi jaringan?",
    "choices": [
      "Alat yang digunakan untuk menghubungkan perangkat",
      "Proses pengiriman data di jaringan",
      "Struktur fisik atau logis dari jaringan",
      "Protokol untuk mengatur komunikasi",
      "Metode pembagian bandwidth jaringan"
    ],
    "answer": "Struktur fisik atau logis dari jaringan"
  },
  {
    "question": "Teknologi yang menggunakan gelombang radio untuk menghubungkan perangkat tanpa kabel disebut?",
    "choices": [
      "Wi-Fi",
      "Ethernet",
      "Bluetooth",
      "Fiber Optic",
      "Infrared"
    ],
    "answer": "Wi-Fi"
  },
  {
    "question": "Apa nama perangkat keras yang digunakan untuk menghubungkan dua jaringan berbeda?",
    "choices": [
      "Router",
      "Switch",
      "Hub",
      "Modem",
      "Bridge"
    ],
    "answer": "Router"
  },
  {
    "question": "Apa yang dimaksud dengan e-commerce?",
    "choices": [
      "Sistem untuk pengolahan data bisnis",
      "Proses jual beli produk atau jasa secara elektronik",
      "Metode untuk meningkatkan produktivitas perusahaan",
      "Sistem pembukuan digital untuk bisnis",
      "Platform komunikasi digital antar perusahaan"
    ],
    "answer": "Proses jual beli produk atau jasa secara elektronik"
  },
  {
    "question": "Platform berikut yang termasuk dalam kategori e-commerce adalah…",
    "choices": [
      "Facebook",
      "Shopee",
      "Google Docs",
      "WhatsApp",
      "Instagram"
    ],
    "answer": "Shopee"
  },
  {
    "question": "Apa jenis e-commerce yang melibatkan transaksi langsung antara konsumen dengan konsumen lain?",
    "choices": [
      "B2B (Business to Business)",
      "B2C (Business to Consumer)",
      "C2C (Consumer to Consumer)",
      "G2C (Government to Consumer)",
      "P2P (Peer to Peer)"
    ],
    "answer": "C2C (Consumer to Consumer)"
  },
  {
    "question": "Mana yang merupakan keuntungan utama e-commerce bagi konsumen?",
    "choices": [
      "Biaya produksi lebih rendah",
      "Akses ke produk dari mana saja dan kapan saja",
      "Proses perekrutan karyawan lebih mudah",
      "Peningkatan pengelolaan logistik",
      "Kemudahan dalam mengelola inventaris"
    ],
    "answer": "Akses ke produk dari mana saja dan kapan saja"
  },
  {
    "question": "Apa yang dimaksud dengan \"checkout\" dalam e-commerce?",
    "choices": [
      "Proses pencarian produk di platform",
      "Proses pembayaran dan konfirmasi pembelian",
      "Proses pengiriman produk ke gudang",
      "Proses pencatatan transaksi oleh penjual",
      "Proses pengembalian barang oleh pembeli"
    ],
    "answer": "Proses pembayaran dan konfirmasi pembelian"
  },
  {
    "question": "Protokol keamanan yang digunakan untuk melindungi data konsumen saat transaksi online disebut?",
    "choices": [
      "HTTP",
      "FTP",
      "SSL/TLS",
      "SMTP",
      "HTTPS"
    ],
    "answer": "SSL/TLS"
  },
  {
    "question": "Apa peran utama dari \"digital wallet\" dalam e-commerce?",
    "choices": [
      "Mengelola pemasaran produk",
      "Menyimpan informasi pelanggan",
      "Mempermudah proses pembayaran secara elektronik",
      "Meningkatkan keamanan jaringan",
      "Mengatur stok barang digital"
    ],
    "answer": "Mempermudah proses pembayaran secara elektronik"
  },
  {
    "question": "Apa yang dimaksud dengan dropshipping dalam e-commerce?",
    "choices": [
      "Penjual menyimpan stok barang di gudang",
      "Barang dikirim langsung dari pemasok ke pelanggan tanpa melewati penjual",
      "Proses diskon besar-besaran oleh penjual",
      "Pengiriman barang melalui sistem logistik khusus",
      "Sistem penyimpanan barang di multiple warehouse"
    ],
    "answer": "Barang dikirim langsung dari pemasok ke pelanggan tanpa melewati penjual"
  },
  {
    "question": "Apa yang menjadi tantangan utama dalam menjalankan e-commerce?",
    "choices": [
      "Biaya pemasaran yang rendah",
      "Kompetisi yang lebih sedikit",
      "Keamanan data pelanggan",
      "Kemudahan bertransaksi",
      "Pengelolaan rantai pasok digital"
    ],
    "answer": "Keamanan data pelanggan"
  },
  {
    "question": "Istilah \"SEO\" dalam e-commerce merujuk pada?",
    "choices": [
      "Strategi untuk mempercepat proses pembayaran",
      "Teknik untuk mengoptimalkan visibilitas website di mesin pencari",
      "Sistem untuk memantau aktivitas pelanggan",
      "Metode untuk mengelola stok produk",
      "Sistem otomatisasi email marketing"
    ],
    "answer": "Teknik untuk mengoptimalkan visibilitas website di mesin pencari"
  },
  {
    "question": "Apa yang dimaksud dengan e-business?",
    "choices": [
      "Proses jual beli barang melalui internet",
      "Penggunaan teknologi digital untuk menjalankan seluruh aspek bisnis",
      "Sistem pembayaran online melalui aplikasi",
      "Proses pengolahan data bisnis manual",
      "Sistem pemasaran digital untuk produk"
    ],
    "answer": "Penggunaan teknologi digital untuk menjalankan seluruh aspek bisnis"
  },
  {
    "question": "Perbedaan utama antara e-business dan e-commerce adalah?",
    "choices": [
      "E-commerce mencakup semua aktivitas bisnis, sedangkan e-business hanya jual beli",
      "E-business mencakup seluruh aktivitas bisnis, termasuk operasional internal",
      "E-commerce fokus pada logistik, sedangkan e-business fokus pada pemasaran",
      "Tidak ada perbedaan, keduanya sama",
      "E-business hanya fokus pada pemasaran digital"
    ],
    "answer": "E-business mencakup seluruh aktivitas bisnis, termasuk operasional internal"
  },
  {
    "question": "Model e-business yang melibatkan interaksi antara dua perusahaan disebut?",
    "choices": [
      "B2B (Business to Business)",
      "B2C (Business to Consumer)",
      "C2C (Consumer to Consumer)",
      "G2B (Government to Business)",
      "P2P (Peer to Peer)"
    ],
    "answer": "B2B (Business to Business)"
  },
  {
    "question": "Salah satu keuntungan utama e-business bagi perusahaan adalah?",
    "choices": [
      "Peningkatan biaya operasional",
      "Akses ke pasar global",
      "Ketergantungan pada teknologi manual",
      "Pengurangan penggunaan teknologi digital",
      "Penurunan efisiensi kerja"
    ],
    "answer": "Akses ke pasar global"
  },
  {
    "question": "Apa yang dimaksud dengan supply chain management (SCM) dalam e-business?",
    "choices": [
      "Proses pengelolaan tenaga kerja",
      "Pengelolaan aliran barang, informasi, dan uang dalam bisnis",
      "Proses pemasaran produk kepada konsumen",
      "Sistem pembukuan transaksi",
      "Manajemen hubungan pelanggan"
    ],
    "answer": "Pengelolaan aliran barang, informasi, dan uang dalam bisnis"
  },
  {
    "question": "Alat utama yang digunakan untuk menjalankan e-business adalah?",
    "choices": [
      "Buku catatan",
      "Sistem ERP (Enterprise Resource Planning)",
      "Mesin cetak",
      "Kalkulator manual",
      "Sistem manajemen manual"
    ],
    "answer": "Sistem ERP (Enterprise Resource Planning)"
  },
  {
    "question": "Teknologi berikut yang mendukung e-business adalah?",
    "choices": [
      "Radio AM/FM",
      "Internet of Things (IoT)",
      "Mesin tik",
      "Televisi analog",
      "Telepon kabel tradisional"
    ],
    "answer": "Internet of Things (IoT)"
  },
  {
    "question": "Apa yang dimaksud dengan Customer Relationship Management (CRM)?",
    "choices": [
      "Sistem untuk mengelola keuangan perusahaan",
      "Strategi untuk membangun hubungan baik dengan pelanggan",
      "Alat untuk mengatur pengiriman barang",
      "Proses pemilihan supplier dalam bisnis",
      "Sistem manajemen inventaris"
    ],
    "answer": "Strategi untuk membangun hubungan baik dengan pelanggan"
  },
  {
    "question": "Platform berikut yang mendukung kegiatan e-business adalah?",
    "choices": [
      "Marketplace (seperti Amazon, Tokopedia)",
      "Surat kabar cetak",
      "Mesin fax",
      "Radio tradisional",
      "Billboard konvensional"
    ],
    "answer": "Marketplace (seperti Amazon, Tokopedia)"
  },
  {
    "question": "Apa tantangan utama dalam implementasi e-business?",
    "choices": [
      "Biaya teknologi yang murah",
      "Kurangnya kompetisi dalam pasar online",
      "Keamanan data dan privasi pelanggan",
      "Tidak adanya koneksi internet",
      "Terlalu banyak pilihan teknologi"
    ],
    "answer": "Keamanan data dan privasi pelanggan"
  },
  {
    "question": "Jenis teknologi berikut yang digunakan untuk menganalisis data dalam e-business adalah?",
    "choices": [
      "Big Data Analytics",
      "Mesin fotokopi",
      "Printer 3D",
      "Kamera analog",
      "Scanner dokumen"
    ],
    "answer": "Big Data Analytics"
  },
  {
    "question": "Apa yang dimaksud dengan \"personalization\" dalam konteks e-business?",
    "choices": [
      "Memberikan rekomendasi produk berdasarkan preferensi pelanggan",
      "Menyediakan produk yang sama untuk semua pelanggan",
      "Mengurangi biaya teknologi dalam bisnis",
      "Menargetkan pelanggan tanpa analisis data",
      "Membuat produk custom secara manual"
    ],
    "answer": "Memberikan rekomendasi produk berdasarkan preferensi pelanggan"
  },
  {
    "question": "Salah satu contoh penerapan Internet of Things (IoT) dalam e-business adalah?",
    "choices": [
      "Pembayaran menggunakan kartu kredit",
      "Pelacakan logistik melalui sensor pintar",
      "Pembuatan katalog cetak",
      "Menggunakan papan tulis untuk rapat",
      "Penggunaan mesin kasir manual"
    ],
    "answer": "Pelacakan logistik melalui sensor pintar"
  },
  {
    "question": "Apa yang menjadi fokus utama dalam strategi digital marketing untuk e-business?",
    "choices": [
      "Meningkatkan kunjungan ke toko fisik",
      "Menjangkau pelanggan melalui platform digital",
      "Membuat produk secara manual",
      "Menjual barang tanpa promosi",
      "Menggunakan media cetak tradisional"
    ],
    "answer": "Menjangkau pelanggan melalui platform digital"
  },
  {
    "question": "Apa yang dimaksud dengan istilah \"cloud computing\" dalam e-business?",
    "choices": [
      "Penyimpanan dan pengolahan data di server berbasis internet",
      "Penyimpanan data secara manual",
      "Menggunakan komputer untuk mencetak dokumen",
      "Memindahkan data secara fisik",
      "Menggunakan server lokal untuk penyimpanan"
    ],
    "answer": "Penyimpanan dan pengolahan data di server berbasis internet"
  },
  {
    "question": "Apa yang dimaksud dengan keamanan sistem?",
    "choices": [
      "Pengelolaan perangkat keras komputer",
      "Upaya untuk melindungi sistem komputer dari ancaman dan serangan",
      "Sistem untuk mengatur proses bisnis",
      "Metode untuk meningkatkan kinerja jaringan",
      "Prosedur backup data sistematis"
    ],
    "answer": "Upaya untuk melindungi sistem komputer dari ancaman dan serangan"
  },
  {
    "question": "Apa fungsi utama dari firewall dalam sistem keamanan?",
    "choices": [
      "Meningkatkan kecepatan internet",
      "Menyimpan data penting secara offline",
      "Mencegah akses tidak sah ke jaringan komputer",
      "Mengatur proses login pengguna",
      "Mengoptimalkan kinerja server"
    ],
    "answer": "Mencegah akses tidak sah ke jaringan komputer"
  },
  {
    "question": "Serangan yang melibatkan pengiriman data berlebihan ke server sehingga menyebabkan gangguan disebut?",
    "choices": [
      "Phishing",
      "Malware",
      "Denial of Service (DoS)",
      "Keylogging",
      "SQL Injection"
    ],
    "answer": "Denial of Service (DoS)"
  },
  {
    "question": "Apa yang dimaksud dengan \"phishing\"?",
    "choices": [
      "Serangan yang melibatkan virus komputer",
      "Upaya mencuri informasi sensitif dengan menyamar sebagai entitas terpercaya",
      "Teknik untuk mempercepat transfer data",
      "Proses enkripsi data untuk keamanan",
      "Teknik pemindaian kerentanan sistem"
    ],
    "answer": "Upaya mencuri informasi sensitif dengan menyamar sebagai entitas terpercaya"
  },
  {
    "question": "Teknologi apa yang digunakan untuk memastikan data tetap aman selama pengiriman?",
    "choices": [
      "VPN",
      "HTTP",
      "SSL/TLS",
      "FTP",
      "SFTP"
    ],
    "answer": "SSL/TLS"
  },
  {
    "question": "Apa istilah untuk perangkat lunak yang dirancang untuk merusak atau mengganggu sistem?",
    "choices": [
      "Firewall",
      "Malware",
      "Encryption",
      "Antivirus",
      "Spyware"
    ],
    "answer": "Malware"
  },
  {
    "question": "Apa tujuan utama dari enkripsi dalam keamanan sistem?",
    "choices": [
      "Mempercepat pengiriman data",
      "Mengubah data menjadi format yang tidak dapat dibaca tanpa kunci",
      "Menyimpan data dalam format yang mudah diakses",
      "Menghapus data yang tidak diperlukan",
      "Membackup data penting"
    ],
    "answer": "Mengubah data menjadi format yang tidak dapat dibaca tanpa kunci"
  },
  {
    "question": "Serangan keamanan yang memanfaatkan kelemahan pada perangkat lunak disebut?",
    "choices": [
      "Zero-Day Attack",
      "Social Engineering",
      "Ransomware",
      "Rootkit",
      "Man-in-the-Middle Attack"
    ],
    "answer": "Zero-Day Attack"
  },
  {
    "question": "Apa yang dimaksud dengan autentikasi dua faktor (2FA)?",
    "choices": [
      "Proses login menggunakan dua akun yang berbeda",
      "Sistem keamanan yang memerlukan dua lapisan verifikasi untuk akses",
      "Teknik untuk mengenkripsi data dengan dua algoritma",
      "Metode untuk menghapus data secara permanen",
      "Sistem backup ganda"
    ],
    "answer": "Sistem keamanan yang memerlukan dua lapisan verifikasi untuk akses"
  },
  {
    "question": "Apa peran utama dari perangkat lunak antivirus?",
    "choices": [
      "Mempercepat akses internet",
      "Mendeteksi dan menghapus perangkat lunak berbahaya dari sistem",
      "Mengatur konfigurasi jaringan",
      "Menyimpan data pengguna dalam database",
      "Mengoptimalkan kinerja sistem"
    ],
    "answer": "Mendeteksi dan menghapus perangkat lunak berbahaya dari sistem"
  },
  {
    "question": "Apa yang dimaksud dengan pengembangan sistem?",
    "choices": [
      "Proses penjualan perangkat lunak",
      "Proses merancang, membangun, dan mengelola sistem untuk memenuhi kebutuhan pengguna",
      "Proses penghapusan data dari sistem",
      "Proses pemasaran sistem informasi",
      "Proses instalasi perangkat keras"
    ],
    "answer": "Proses merancang, membangun, dan mengelola sistem untuk memenuhi kebutuhan pengguna"
  },
  {
    "question": "Tahap pertama dalam pengembangan sistem informasi adalah?",
    "choices": [
      "Implementasi",
      "Analisis kebutuhan",
      "Pemeliharaan",
      "Desain sistem",
      "Pengujian sistem"
    ],
    "answer": "Analisis kebutuhan"
  },
  {
    "question": "Metodologi pengembangan sistem yang dilakukan secara bertahap dan terstruktur disebut?",
    "choices": [
      "Prototyping",
      "Waterfall",
      "Agile",
      "Scrum",
      "Spiral"
    ],
    "answer": "Waterfall"
  },
  {
    "question": "Apa tujuan utama dari analisis kebutuhan dalam pengembangan sistem?",
    "choices": [
      "Membuat desain visual untuk sistem",
      "Mengidentifikasi kebutuhan pengguna dan bisnis",
      "Menguji performa sistem",
      "Meningkatkan keamanan sistem",
      "Membuat dokumentasi teknis"
    ],
    "answer": "Mengidentifikasi kebutuhan pengguna dan bisnis"
  },
  {
    "question": "Model pengembangan sistem yang menggunakan iterasi cepat untuk membuat prototipe disebut?",
    "choices": [
      "Agile",
      "Waterfall",
      "RAD (Rapid Application Development)",
      "Spiral",
      "Incremental"
    ],
    "answer": "RAD (Rapid Application Development)"
  },
  {
    "question": "Apa yang dimaksud dengan sistem berbasis cloud?",
    "choices": [
      "Sistem yang dijalankan di komputer lokal pengguna",
      "Sistem yang berjalan di server online dan dapat diakses melalui internet",
      "Sistem yang menggunakan perangkat keras mahal",
      "Sistem yang hanya dapat digunakan secara offline",
      "Sistem yang menggunakan penyimpanan eksternal"
    ],
    "answer": "Sistem yang berjalan di server online dan dapat diakses melalui internet"
  },
  {
    "question": "Salah satu keuntungan utama menggunakan metodologi Agile adalah?",
    "choices": [
      "Proyek selesai tanpa perlu masukan pengguna",
      "Kemampuan untuk beradaptasi dengan perubahan kebutuhan selama pengembangan",
      "Proses yang panjang dan terstruktur tanpa revisi",
      "Tidak memerlukan pengujian",
      "Dokumentasi yang sangat detail di awal"
    ],
    "answer": "Kemampuan untuk beradaptasi dengan perubahan kebutuhan selama pengembangan"
  },
  {
    "question": "Dalam siklus hidup pengembangan sistem (SDLC), tahap pengujian bertujuan untuk?",
    "choices": [
      "Menentukan kebutuhan pengguna",
      "Memastikan bahwa sistem berjalan sesuai dengan spesifikasi",
      "Membuat prototipe",
      "Menyebarkan sistem ke pengguna",
      "Membuat dokumentasi sistem"
    ],
    "answer": "Memastikan bahwa sistem berjalan sesuai dengan spesifikasi"
  },
  {
    "question": "Apa yang dimaksud dengan \"maintenance\" dalam pengembangan sistem?",
    "choices": [
      "Proses menambahkan fitur baru ke sistem",
      "Proses memperbaiki bug dan meningkatkan performa sistem setelah implementasi",
      "Proses mendesain antarmuka pengguna",
      "Proses pemasaran sistem",
      "Proses backup data sistem"
    ],
    "answer": "Proses memperbaiki bug dan meningkatkan performa sistem setelah implementasi"
  },
  {
    "question": "Dokumen yang menggambarkan kebutuhan fungsional dan non-fungsional sistem disebut?",
    "choices": [
      "User Manual",
      "System Requirement Specification (SRS)",
      "Test Case",
      "Proposal Sistem",
      "Technical Documentation"
    ],
    "answer": "System Requirement Specification (SRS)"
  },
  {
    "question": "Apa tujuan utama dari tahap implementasi dalam pengembangan sistem?",
    "choices": [
      "Mengidentifikasi kebutuhan pengguna",
      "Menginstal sistem yang telah selesai kepada pengguna akhir",
      "Membuat desain awal untuk sistem",
      "Menghapus data lama dari sistem",
      "Membuat dokumentasi sistem"
    ],
    "answer": "Menginstal sistem yang telah selesai kepada pengguna akhir"
  },
  {
    "question": "Apa yang dimaksud dengan rekayasa ulang proses bisnis (Business Process Reengineering)?",
    "choices": [
      "Meningkatkan kinerja bisnis dengan menghapus teknologi lama",
      "Mendesain ulang proses bisnis untuk meningkatkan efisiensi dan efektivitas",
      "Menambahkan lebih banyak langkah dalam proses bisnis",
      "Mengurangi kebutuhan teknologi dalam bisnis",
      "Mengotomatisasi seluruh proses bisnis"
    ],
    "answer": "Mendesain ulang proses bisnis untuk meningkatkan efisiensi dan efektivitas"
  },
  {
    "question": "Salah satu alat bantu yang digunakan dalam pengembangan sistem untuk menggambarkan alur proses adalah?",
    "choices": [
      "Flowchart",
      "Spreadsheet",
      "Text Editor",
      "Browser",
      "Project Management Tool"
    ],
    "answer": "Flowchart"
  },
  {
    "question": "Apa yang dimaksud dengan feasibility study dalam pengembangan sistem?",
    "choices": [
      "Studi untuk memastikan sistem berjalan sesuai keinginan pengguna",
      "Studi untuk mengevaluasi kelayakan teknis, ekonomi, dan operasional dari sistem yang direncanakan",
      "Studi untuk mempercepat proses implementasi sistem",
      "Studi untuk menentukan struktur data",
      "Studi untuk menganalisis kompetitor"
    ],
    "answer": "Studi untuk mengevaluasi kelayakan teknis, ekonomi, dan operasional dari sistem yang direncanakan"
  },
  {
    "question": "Apa peran utama dari pengujian sistem (system testing)?",
    "choices": [
      "Membuat prototipe untuk pengguna",
      "Memastikan bahwa seluruh komponen sistem bekerja dengan baik secara bersama-sama",
      "Mengidentifikasi kebutuhan pengguna",
      "Membuat dokumentasi teknis",
      "Melatih pengguna akhir"
    ],
    "answer": "Memastikan bahwa seluruh komponen sistem bekerja dengan baik secara bersama-sama"
  },
  {
    "question": "Apa yang dimaksud dengan business process management (BPM)?",
    "choices": [
      "Sistem untuk menyimpan data perusahaan",
      "Upaya yang disengaja untuk merencanakan, mendokumentasikan, mengimplementasikan, dan mendistribusikan proses bisnis dengan dukungan teknologi informasi",
      "Proses untuk meningkatkan penjualan perusahaan",
      "Sistem untuk mengelola karyawan",
      "Metode untuk mengotomatisasi seluruh proses bisnis"
    ],
    "answer": "Upaya yang disengaja untuk merencanakan, mendokumentasikan, mengimplementasikan, dan mendistribusikan proses bisnis dengan dukungan teknologi informasi"
  },
  {
    "question": "Apa manfaat utama dari dokumentasi proses bisnis?",
    "choices": [
      "Hanya untuk memenuhi persyaratan audit",
      "Memastikan kontrol dan standardisasi aktivitas dalam organisasi",
      "Membuat pekerjaan lebih rumit",
      "Mengurangi jumlah karyawan",
      "Memperlambat proses bisnis"
    ],
    "answer": "Memastikan kontrol dan standardisasi aktivitas dalam organisasi"
  },
  {
    "question": "Berikut ini yang merupakan alat bantu untuk mendokumentasikan proses bisnis adalah?",
    "choices": [
      "Microsoft Word",
      "Business Process Modeling Notation (BPMN)",
      "Adobe Photoshop",
      "Web browser",
      "Media sosial"
    ],
    "answer": "Business Process Modeling Notation (BPMN)"
  },
  {
    "question": "Apa yang dimaksud dengan Transaction Processing System (TPS)?",
    "choices": [
      "Sistem untuk mengirim email",
      "Sistem yang mengumpulkan, memodifikasi dan mengambil data transaksi bisnis",
      "Sistem untuk membuat presentasi",
      "Sistem untuk manajemen proyek",
      "Sistem untuk mendesain website"
    ],
    "answer": "Sistem yang mengumpulkan, memodifikasi dan mengambil data transaksi bisnis"
  },
  {
    "question": "Apa fungsi utama dari Enterprise Resource Planning (ERP)?",
    "choices": [
      "Hanya untuk mengelola keuangan",
      "Mengintegrasikan seluruh data dan proses organisasi dalam satu sistem",
      "Hanya untuk manajemen persediaan",
      "Hanya untuk pemasaran digital",
      "Hanya untuk komunikasi internal"
    ],
    "answer": "Mengintegrasikan seluruh data dan proses organisasi dalam satu sistem"
  },
  {
    "question": "Apa yang dimaksud dengan Business Process Reengineering (BPR)?",
    "choices": [
      "Perbaikan kecil pada proses yang ada",
      "Perancangan ulang proses bisnis secara fundamental untuk mencapai peningkatan dramatis",
      "Penggantian seluruh karyawan",
      "Implementasi software baru",
      "Perubahan struktur organisasi"
    ],
    "answer": "Perancangan ulang proses bisnis secara fundamental untuk mencapai peningkatan dramatis"
  },
  {
    "question": "Apa keuntungan utama dari menggunakan Customer Relationship Management (CRM)?",
    "choices": [
      "Mengurangi jumlah pelanggan",
      "Mempersonalisasi hubungan dengan setiap pelanggan",
      "Menghilangkan kebutuhan layanan pelanggan",
      "Meningkatkan biaya operasional",
      "Membatasi interaksi dengan pelanggan"
    ],
    "answer": "Mempersonalisasi hubungan dengan setiap pelanggan"
  },
  {
    "question": "Apa peran Supply Chain Management (SCM) dalam organisasi?",
    "choices": [
      "Hanya mengelola gudang",
      "Mengelola aliran barang, informasi, dan uang dalam rantai pasok",
      "Hanya untuk pembelian barang",
      "Hanya untuk pengiriman produk",
      "Hanya untuk menghitung stok"
    ],
    "answer": "Mengelola aliran barang, informasi, dan uang dalam rantai pasok"
  },
  {
    "question": "Apa manfaat utama dari Knowledge Management System?",
    "choices": [
      "Hanya menyimpan dokumen",
      "Menangkap, menyimpan, dan berbagi pengetahuan organisasi",
      "Hanya untuk pelatihan karyawan baru",
      "Hanya untuk menyimpan data pelanggan",
      "Hanya untuk backup data"
    ],
    "answer": "Menangkap, menyimpan, dan berbagi pengetahuan organisasi"
  },
  {
    "question": "Apa keuntungan menggunakan Electronic Data Interchange (EDI)?",
    "choices": [
      "Meningkatkan penggunaan kertas",
      "Mengintegrasikan rantai pasok secara elektronik dan mengurangi biaya",
      "Memperlambat proses bisnis",
      "Meningkatkan kesalahan input data",
      "Menambah kompleksitas sistem"
    ],
    "answer": "Mengintegrasikan rantai pasok secara elektronik dan mengurangi biaya"
  },

  {
    "question": "Dalam konteks proses bisnis, apa yang dimaksud dengan 'batch processing'?",
    "choices": [
      "Pemrosesan data secara real-time",
      "Pengumpulan data selama periode tertentu untuk diproses bersama-sama",
      "Pemrosesan data secara manual",
      "Sistem penyimpanan data jangka panjang",
      "Metode untuk menghapus data lama"
    ],
    "answer": "Pengumpulan data selama periode tertentu untuk diproses bersama-sama"
  },
  {
    "question": "Apa keunggulan utama penggunaan database terpusat dalam sistem ERP?",
    "choices": [
      "Membutuhkan lebih sedikit ruang penyimpanan",
      "Data yang dimasukkan di satu bagian dapat langsung tersedia untuk bagian lain",
      "Lebih mudah untuk dihapus",
      "Tidak memerlukan backup",
      "Dapat diakses tanpa koneksi internet"
    ],
    "answer": "Data yang dimasukkan di satu bagian dapat langsung tersedia untuk bagian lain"
  },
  {
    "question": "Apa tantangan utama dalam implementasi sistem ERP?",
    "choices": [
      "Biaya yang terlalu murah",
      "Terlalu sederhana untuk dipahami",
      "Customization dan pemeliharaan perubahan sistem",
      "Terlalu sedikit fitur",
      "Mudah untuk diupgrade"
    ],
    "answer": "Customization dan pemeliharaan perubahan sistem"
  },
  {
    "question": "Apa yang dimaksud dengan 'online processing'?",
    "choices": [
      "Hanya bekerja saat terhubung internet",
      "Pemrosesan data secara langsung saat transaksi terjadi",
      "Penyimpanan data di cloud",
      "Penggunaan media sosial untuk bisnis",
      "Metode pembayaran online"
    ],
    "answer": "Pemrosesan data secara langsung saat transaksi terjadi"
  },
  {
    "question": "Dalam konteks Document Management System, apa fungsi 'versions and timestamps'?",
    "choices": [
      "Menghapus dokumen lama",
      "Menyimpan dan melacak berbagai versi dokumen dengan waktu pembuatannya",
      "Mengenkripsi dokumen",
      "Membatasi akses dokumen",
      "Memindahkan dokumen ke cloud"
    ],
    "answer": "Menyimpan dan melacak berbagai versi dokumen dengan waktu pembuatannya"
  },
  {
    "question": "Apa manfaat utama dari Business Process Management (BPM) bagi karyawan?",
    "choices": [
      "Mengurangi gaji karyawan",
      "Memberdayakan karyawan untuk mengimplementasikan proses dengan otoritas mereka sendiri",
      "Membatasi kreativitas karyawan",
      "Menghilangkan kebutuhan pelatihan",
      "Mengurangi jumlah karyawan"
    ],
    "answer": "Memberdayakan karyawan untuk mengimplementasikan proses dengan otoritas mereka sendiri"
  },
  {
    "question": "Bagaimana cara ERP system menegakkan best practices dalam organisasi?",
    "choices": [
      "Dengan mengabaikan proses yang ada",
      "Dengan membangun aturan dan prosedur standar ke dalam sistem",
      "Dengan menghapus semua proses lama",
      "Dengan membatasi akses pengguna",
      "Dengan menghilangkan customization"
    ],
    "answer": "Dengan membangun aturan dan prosedur standar ke dalam sistem"
  },
  {
    "question": "Apa peran Management Information System (MIS) dalam organisasi?",
    "choices": [
      "Hanya untuk menyimpan data",
      "Mengekstrak data dari database untuk membuat laporan yang membantu pengambilan keputusan rutin",
      "Hanya untuk komunikasi internal",
      "Hanya untuk mengelola karyawan",
      "Hanya untuk pemasaran"
    ],
    "answer": "Mengekstrak data dari database untuk membuat laporan yang membantu pengambilan keputusan rutin"
  },
  {
    "question": "Apa yang membedakan sistem ERP dari sistem informasi tradisional?",
    "choices": [
      "ERP lebih murah",
      "ERP mengintegrasikan semua fungsi bisnis dalam satu sistem",
      "ERP hanya fokus pada keuangan",
      "ERP tidak memerlukan maintenance",
      "ERP tidak memerlukan pelatihan"
    ],
    "answer": "ERP mengintegrasikan semua fungsi bisnis dalam satu sistem"
  },
  {
    "question": "Apa manfaat menggunakan diagram alir (flowchart) dalam dokumentasi proses bisnis?",
    "choices": [
      "Hanya untuk dekorasi",
      "Memvisualisasikan langkah-langkah proses dengan jelas dan sistematis",
      "Membuat proses lebih rumit",
      "Mengurangi efisiensi",
      "Menyembunyikan detail proses"
    ],
    "answer": "Memvisualisasikan langkah-langkah proses dengan jelas dan sistematis"
  },
  {
    "question": "Apa yang dimaksud dengan big data?",
    "choices": [
      "Data yang berukuran kecil dan sederhana",
      "Data yang sangat besar dan kompleks sehingga sulit diproses oleh sistem tradisional",
      "Data yang hanya berasal dari satu sumber",
      "Data yang mudah dianalisis dengan spreadsheet biasa",
      "Data yang hanya berisi angka dan teks"
    ],
    "answer": "Data yang sangat besar dan kompleks sehingga sulit diproses oleh sistem tradisional"
  },
  {
    "question": "Apa saja komponen dari 'Three V's' dalam big data?",
    "choices": [
      "Volume, Variety, Velocity",
      "Vision, Value, Validation",
      "Verification, Validation, Vector",
      "Virtual, Visual, Verbal",
      "Version, Variant, Variable"
    ],
    "answer": "Volume, Variety, Velocity"
  },
  {
    "question": "Apa tujuan utama dari Decision Support System (DSS)?",
    "choices": [
      "Untuk menyimpan data perusahaan",
      "Untuk membantu manajer membuat keputusan dengan model komputer interaktif",
      "Untuk mengelola inventaris",
      "Untuk membuat laporan keuangan",
      "Untuk memproses transaksi harian"
    ],
    "answer": "Untuk membantu manajer membuat keputusan dengan model komputer interaktif"
  },
  {
    "question": "Manakah dari berikut ini yang merupakan jenis keputusan berdasarkan strukturnya?",
    "choices": [
      "Keputusan strategis dan taktis",
      "Keputusan jangka pendek dan jangka panjang", 
      "Keputusan terstruktur, semi-terstruktur, dan tidak terstruktur",
      "Keputusan operasional dan manajerial",
      "Keputusan primer dan sekunder"
    ],
    "answer": "Keputusan terstruktur, semi-terstruktur, dan tidak terstruktur"
  },
  {
    "question": "Apa yang membedakan Executive Information System (EIS) dari sistem informasi lainnya?",
    "choices": [
      "Hanya digunakan untuk level operasional",
      "Dirancang khusus untuk kebutuhan eksekutif dan pengambilan keputusan strategis",
      "Hanya fokus pada transaksi harian",
      "Tidak memerlukan database",
      "Hanya untuk departemen IT"
    ],
    "answer": "Dirancang khusus untuk kebutuhan eksekutif dan pengambilan keputusan strategis"
  },
  {
    "question": "Apa yang dimaksud dengan data mining?",
    "choices": [
      "Proses manual input data",
      "Pencarian data yang hilang",
      "Analisis data untuk menemukan pola dan tren yang sebelumnya tidak diketahui",
      "Proses backup data",
      "Pemindahan data antar sistem"
    ],
    "answer": "Analisis data untuk menemukan pola dan tren yang sebelumnya tidak diketahui"
  },
  {
    "question": "Apa perbedaan antara data mart dan data warehouse?",
    "choices": [
      "Tidak ada perbedaan, keduanya sama",
      "Data mart lebih kecil dan fokus pada satu area bisnis, data warehouse mencakup seluruh organisasi",
      "Data mart untuk eksternal, data warehouse untuk internal",
      "Data mart gratis, data warehouse berbayar",
      "Data mart untuk data lama, data warehouse untuk data baru"
    ],
    "answer": "Data mart lebih kecil dan fokus pada satu area bisnis, data warehouse mencakup seluruh organisasi"
  },
  {
    "question": "Apa fungsi utama dari Online Analytical Processing (OLAP)?",
    "choices": [
      "Untuk transaksi online",
      "Untuk menganalisis data multidimensi secara cepat",
      "Untuk menyimpan email",
      "Untuk mencadangkan data",
      "Untuk mengirim notifikasi"
    ],
    "answer": "Untuk menganalisis data multidimensi secara cepat"
  },
  {
    "question": "Apa yang dimaksud dengan business intelligence?",
    "choices": [
      "Kecerdasan buatan untuk bisnis",
      "Proses pengumpulan dan analisis data untuk keunggulan kompetitif",
      "Sistem pembayaran online",
      "Manajemen inventaris",
      "Sistem komunikasi internal"
    ],
    "answer": "Proses pengumpulan dan analisis data untuk keunggulan kompetitif"
  },
  {
    "question": "Apa tujuan dari data visualization?",
    "choices": [
      "Untuk membuat data lebih rumit",
      "Untuk menyimpan data",
      "Untuk menampilkan data secara grafis agar lebih mudah dipahami",
      "Untuk menghapus data",
      "Untuk mengenkripsi data"
    ],
    "answer": "Untuk menampilkan data secara grafis agar lebih mudah dipahami"
  },
  {
    "question": "Apa yang dimaksud dengan data governance?",
    "choices": [
      "Proses pembuatan data",
      "Komitmen organisasi untuk memastikan data memenuhi karakteristik bernilai",
      "Sistem penyimpanan data",
      "Metode penghapusan data",
      "Teknik visualisasi data"
    ],
    "answer": "Komitmen organisasi untuk memastikan data memenuhi karakteristik bernilai"
  },
  {
    "question": "Apa fungsi utama dari dashboard dalam business intelligence?",
    "choices": [
      "Untuk bermain game",
      "Untuk menampilkan metrik dan KPI penting secara visual",
      "Untuk menyimpan password",
      "Untuk mengirim email",
      "Untuk merekam video"
    ],
    "answer": "Untuk menampilkan metrik dan KPI penting secara visual"
  },
  {
    "question": "Apa manfaat utama dari data warehouse?",
    "choices": [
      "Menghemat ruang penyimpanan",
      "Menyediakan pandangan terpusat dari data organisasi",
      "Mempercepat internet",
      "Mengurangi jumlah karyawan",
      "Meningkatkan keamanan fisik"
    ],
    "answer": "Menyediakan pandangan terpusat dari data organisasi"
  },
  {
    "question": "Apa yang dimaksud dengan structured decision?",
    "choices": [
      "Keputusan yang tidak memiliki pola",
      "Keputusan yang dibuat berdasarkan intuisi",
      "Keputusan yang sering dibuat dan memiliki input yang jelas",
      "Keputusan yang sangat kompleks",
      "Keputusan yang jarang dibuat"
    ],
    "answer": "Keputusan yang sering dibuat dan memiliki input yang jelas"
  },
  {
    "question": "Apa peran data scientist dalam organisasi?",
    "choices": [
      "Hanya mengumpulkan data",
      "Menganalisis data besar untuk menemukan pengetahuan baru",
      "Hanya membuat laporan",
      "Memperbaiki komputer",
      "Mengatur jaringan"
    ],
    "answer": "Menganalisis data besar untuk menemukan pengetahuan baru"
  },
  {
    "question": "Apa yang dimaksud dengan predictive analytics?",
    "choices": [
      "Analisis data masa lalu saja",
      "Teknik untuk memprediksi tren dan perilaku masa depan",
      "Pencatatan transaksi",
      "Pembuatan dashboard",
      "Penyimpanan data"
    ],
    "answer": "Teknik untuk memprediksi tren dan perilaku masa depan"
  },
  {
    "question": "Apa fungsi utama dari Expert System?",
    "choices": [
      "Untuk menggantikan semua karyawan",
      "Memberikan saran seperti konsultan manusia",
      "Hanya untuk menyimpan data",
      "Untuk mengirim email",
      "Untuk membuat website"
    ],
    "answer": "Memberikan saran seperti konsultan manusia"
  },
  {
    "question": "Apa yang dimaksud dengan legacy system?",
    "choices": [
      "Sistem terbaru",
      "Sistem yang sudah usang dan sulit berintegrasi dengan teknologi baru",
      "Sistem gratis",
      "Sistem berbayar",
      "Sistem tanpa database"
    ],
    "answer": "Sistem yang sudah usang dan sulit berintegrasi dengan teknologi baru"
  },
  {
    "question": "Apa itu data analytics?",
    "choices": [
      "Proses penyimpanan data",
      "Analisis data masa lalu untuk memahami kejadian dan membuat prediksi",
      "Pembuatan database",
      "Sistem backup",
      "Manajemen jaringan"
    ],
    "answer": "Analisis data masa lalu untuk memahami kejadian dan membuat prediksi"
  },
  {
    "question": "Apa manfaat utama dari Business Process Management (BPM)?",
    "choices": [
      "Mengurangi jumlah karyawan",
      "Meningkatkan efektivitas dan efisiensi proses bisnis",
      "Menambah peralatan kantor",
      "Memperbesar ruang kerja",
      "Mengurangi penggunaan komputer"
    ],
    "answer": "Meningkatkan efektivitas dan efisiensi proses bisnis"
  },
  {
    "question": "Apa yang dimaksud dengan artificial intelligence (AI)?",
    "choices": [
      "Kemampuan manusia untuk berpikir",
      "Kemampuan komputer atau mesin untuk berpikir dan belajar serta meniru perilaku manusia",
      "Program komputer biasa",
      "Sistem operasi komputer",
      "Perangkat keras komputer"
    ],
    "answer": "Kemampuan komputer atau mesin untuk berpikir dan belajar serta meniru perilaku manusia"
  },
  {
    "question": "Apa kontribusi penting Alan Turing dalam perkembangan AI?",
    "choices": [
      "Menciptakan robot pertama",
      "Mengembangkan Turing Test untuk menguji kecerdasan mesin",
      "Menemukan internet", 
      "Membuat bahasa pemrograman pertama",
      "Mengembangkan chip komputer"
    ],
    "answer": "Mengembangkan Turing Test untuk menguji kecerdasan mesin"
  },
  {
    "question": "Apa perbedaan utama antara mesin biasa dengan mesin yang menggunakan AI?",
    "choices": [
      "AI lebih mahal",
      "AI dapat menganalisis data dan membuat keputusan seperti manusia",
      "AI berjalan lebih cepat",
      "AI memiliki tampilan lebih bagus",
      "AI menggunakan listrik lebih banyak"
    ],
    "answer": "AI dapat menganalisis data dan membuat keputusan seperti manusia"
  },
  {
    "question": "Manakah dari berikut yang bukan merupakan jenis AI berdasarkan kemampuan?",
    "choices": [
      "Artificial Narrow Intelligence (ANI)",
      "Artificial General Intelligence (AGI)", 
      "Artificial Super Intelligence (ASI)",
      "Artificial Basic Intelligence (ABI)",
      "Artificial Neural Intelligence (ANI)"
    ],
    "answer": "Artificial Basic Intelligence (ABI)"
  },
  {
    "question": "Apa yang dimaksud dengan machine learning?",
    "choices": [
      "Pembelajaran manual oleh manusia",
      "Teknik yang memungkinkan komputer menganalisis data dan membuat prediksi secara otomatis",
      "Proses menggunakan mesin",
      "Metode memperbaiki mesin",
      "Cara mengoperasikan mesin"
    ],
    "answer": "Teknik yang memungkinkan komputer menganalisis data dan membuat prediksi secara otomatis"
  },
  {
    "question": "Apa perbedaan utama antara supervised learning dan unsupervised learning?",
    "choices": [
      "Waktu prosesnya",
      "Ukuran datanya",
      "Supervised learning menggunakan data berlabel, unsupervised learning menggunakan data tidak berlabel",
      "Biaya prosesnya",
      "Jumlah prosessornya"
    ],  
    "answer": "Supervised learning menggunakan data berlabel, unsupervised learning menggunakan data tidak berlabel"
  },
  {
    "question": "Manakah yang merupakan contoh autonomous technology?",
    "choices": [
      "Mesin cuci manual",
      "Mobil self-driving",
      "Telepon biasa",
      "Lampu manual",
      "Radio portabel"
    ],
    "answer": "Mobil self-driving"
  },
  {
    "question": "Apa yang dimaksud dengan expert system?",
    "choices": [
      "Sistem operasi komputer",
      "Sistem yang meniru proses pengambilan keputusan ahli manusia",
      "Sistem backup data",
      "Sistem jaringan",
      "Sistem keamanan"
    ],
    "answer": "Sistem yang meniru proses pengambilan keputusan ahli manusia"
  },
  {
    "question": "Apakah yang dimaksud dengan extended reality (XR)?", 
    "choices": [
      "Hanya realitas virtual",
      "Istilah umum yang mencakup AR, VR dan realitas campuran",
      "Realitas tambahan saja",
      "Teknologi hologram",
      "Sistem proyeksi"
    ],
    "answer": "Istilah umum yang mencakup AR, VR dan realitas campuran"
  },
  {
    "question": "Apa perbedaan utama antara augmented reality (AR) dan virtual reality (VR)?",
    "choices": [
      "AR menambahkan elemen digital ke dunia nyata, VR menciptakan lingkungan virtual sepenuhnya",
      "AR lebih mahal dari VR",
      "VR lebih baru dari AR",
      "AR hanya untuk game, VR untuk bisnis",
      "Tidak ada perbedaan signifikan"
    ],
    "answer": "AR menambahkan elemen digital ke dunia nyata, VR menciptakan lingkungan virtual sepenuhnya"
  },
  {
    "question": "Apa yang dimaksud dengan Internet of Things (IoT)?",
    "choices": [
      "Jaringan internet cepat",
      "Jaringan perangkat fisik yang terhubung dan dapat bertukar data",
      "Koneksi WiFi",
      "Sistem cloud computing",
      "Layanan streaming online"
    ],
    "answer": "Jaringan perangkat fisik yang terhubung dan dapat bertukar data"
  },
  {
    "question": "Manakah yang merupakan contoh aplikasi AI dalam bisnis?",
    "choices": [
      "Menggunakan kalkulator",
      "Chatbot untuk layanan pelanggan",
      "Mengirim email manual",
      "Mencetak dokumen", 
      "Menyimpan file di komputer"
    ],
    "answer": "Chatbot untuk layanan pelanggan"
  },
  {
    "question": "Apa yang dimaksud dengan deep learning?",
    "choices": [
      "Pembelajaran tingkat dasar",
      "Bagian dari machine learning yang menggunakan neural networks kompleks",
      "Belajar secara mendalam",
      "Metode pembelajaran manual",
      "Sistem pembelajaran jarak jauh"
    ],
    "answer": "Bagian dari machine learning yang menggunakan neural networks kompleks"
  },
  {
    "question": "Apa fungsi dari natural language processing (NLP)?",
    "choices": [
      "Mempercepat proses komputer",
      "Memungkinkan komputer memahami dan memproses bahasa manusia",
      "Mengatur jaringan komputer",
      "Menyimpan data",
      "Mengirim email"
    ],
    "answer": "Memungkinkan komputer memahami dan memproses bahasa manusia"
  },
  {
    "question": "Apa tantangan etis utama dalam pengembangan AI?",
    "choices": [
      "Biaya pengembangan",
      "Privasi dan keamanan data",
      "Kecepatan proses",
      "Ukuran perangkat",
      "Konsumsi listrik"
    ],
    "answer": "Privasi dan keamanan data"
  },
  {
    "question": "Apa yang dimaksud dengan quantum computing?",
    "choices": [
      "Komputasi biasa",
      "Teknologi komputasi yang menggunakan prinsip mekanika kuantum",
      "Komputer mini",
      "Komputer portabel",
      "Sistem operasi baru"
    ],
    "answer": "Teknologi komputasi yang menggunakan prinsip mekanika kuantum"
  },
  {
    "question": "Manakah yang merupakan contoh penggunaan wearable technology?",
    "choices": [
      "Komputer desktop",
      "Smartwatch yang memantau kesehatan",
      "Printer",
      "Scanner",
      "Server"
    ],
    "answer": "Smartwatch yang memantau kesehatan"
  },
  {
    "question": "Apa yang dimaksud dengan collaborative technology?",
    "choices": [
      "Teknologi individual",
      "Teknologi untuk berbagi data dan informasi dengan pengguna lain",
      "Sistem offline",
      "Perangkat keras komputer",
      "Program antivirus"
    ],
    "answer": "Teknologi untuk berbagi data dan informasi dengan pengguna lain"
  },
  {
    "question": "Apa manfaat utama penggunaan AI dalam bisnis?",
    "choices": [
      "Hanya mengurangi biaya",
      "Meningkatkan efisiensi dan pengambilan keputusan",
      "Menggantikan semua karyawan",
      "Menghilangkan kompetisi",
      "Menghapus kebutuhan teknologi"
    ],
    "answer": "Meningkatkan efisiensi dan pengambilan keputusan"
  },
  {
    "question": "Apa peran robotik dalam industri modern?",
    "choices": [
      "Hanya untuk hiburan",
      "Mengotomatisasi tugas berulang dan berbahaya",
      "Menggantikan semua pekerja",
      "Sebagai dekorasi",
      "Untuk permainan"
    ],
    "answer": "Mengotomatisasi tugas berulang dan berbahaya"
      }
    ];
})();