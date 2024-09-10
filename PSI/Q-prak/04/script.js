(function(){
  const quizId = "Kuis 03"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
      const now = new Date();
      const startTime = new Date('2024-09-10T10:00:00');
      const endTime = new Date('2024-09-10T10:30:00');

      if (now < startTime || now > endTime) {
          alert('Akses kuis hanya tersedia pada 3 September 2024 pukul 10:00 - 10:30.');
          return false;
      }
      return true;
  }

  // Cek akses ganda
  function checkDuplicateAccess(fullname, nim, angkatan) {
      const accessKey = `${quizId}_${fullname}_${nim}_${angkatan}`;
      if (localStorage.getItem(accessKey)) {
          if (confirm('Anda sudah mengakses kuis ini sebelumnya. Apakah Anda ingin mencoba lagi? Ini akan menghapus akses sebelumnya.')) {
              localStorage.removeItem(accessKey);
              return true;
          }
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
          if (isQuizActive) {
              alert("Mohon tetap dalam mode fullscreen selama kuis berlangsung.");
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

  function preventExitFullscreen(event) {
      if (isQuizActive && (event.key === 'Escape' || event.keyCode === 27)) {
          event.preventDefault();
          event.stopPropagation();
          return false;
      }
      
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
          enterFullscreen(document.documentElement);
      }
  }

  // Quiz functions
  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  function startQuiz() {
      if (!validateAccess()) return;

      userData.fullname = document.getElementById('fullname').value;
      userData.nim = document.getElementById('nim').value;
      userData.angkatan = document.getElementById('angkatan').value;

      if (!userData.fullname || !userData.nim || !userData.angkatan) {
          alert('Mohon isi semua data diri.');
          return;
      }

      if (!checkDuplicateAccess(userData.fullname, userData.nim, userData.angkatan)) return;

      isQuizActive = true;
      enterFullscreen(document.documentElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);

      document.getElementById('registration-form').classList.add('hidden');
      document.getElementById('clear-access-btn').classList.add('hidden');
      document.getElementById('quiz-container').classList.remove('hidden');

      shuffleArray(questions);
      questions.forEach(q => shuffleArray(q.choices));

      showQuestion();
  }

  function showQuestion() {
      if (currentQuestion >= questions.length) {
          endQuiz();
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
              score += 5;
          }
      }

      currentQuestion++;
      clearInterval(timer);
      showQuestion();
  }

  function startTimer() {
      let timeLeft = 30;
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

  function endQuiz() {
      isQuizActive = false;
      document.getElementById('quiz-container').classList.add('hidden');
      document.getElementById('result-container').classList.remove('hidden');
      document.getElementById('score').textContent = score;

      let resultMessage = '';
      if (score >= 65) {
          resultMessage = 'Selamat! Anda Bisa Mengikuti Praktikum.';
      } else {
          resultMessage = 'ANDA TIDAK BERHAK MENGIKUTI PRAKTIKUM HARI INI.';
      }
      document.getElementById('result-message').textContent = resultMessage;

      sendResultToGoogleSheet(userData.fullname, userData.nim, score);

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  }

  function sendResultToGoogleSheet(fullName, nim, score) {
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbxWtm1SKkZ9oDhvvJ9qsuDU2MslV6OGwnFYT-SoB-jVx8TUMtcFL7uORzluODKKkcL0/exec';
      const now = new Date();
      const date = now.toLocaleDateString('id-ID');
      const time = now.toLocaleTimeString('id-ID');

      const data = {
          fullName: fullName,
          nim: nim,
          score: score,
          quizTitle: `${quizId} Praktikum PSI`,
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
          console.log('Data yang dikirim:', JSON.stringify(data));
      })
      .catch(error => {
          console.error('Error:', error);
          alert('Terjadi kesalahan saat mengirim data. Silakan coba lagi.');
      });
  }

  function clearAllAccess() {
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith(quizId)) {
              localStorage.removeItem(key);
          }
      });
      alert('Semua data akses untuk kuis ini telah dihapus.');
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
      const quizInfoElement = document.getElementById('quiz-info');
      if (quizInfoElement) {
          quizInfoElement.textContent = `${quizId}. Kuis ini dapat diambil secara independen dari kuis lainnya.`;
      }

      const clearAccessBtn = document.getElementById('clear-access-btn');
      clearAccessBtn.addEventListener('click', clearAllAccess);
      clearAccessBtn.classList.remove('hidden');

      document.getElementById('start-btn').addEventListener('click', startQuiz);
      document.getElementById('submit-btn').addEventListener('click', submitAnswer);
      document.getElementById('exit-fullscreen').addEventListener('click', function() {
          isQuizActive = false;
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

    // Quiz questions
    questions = [
  {
    "question": "Apa format file yang umumnya digunakan saat mengimpor data berbasis teks ke Microsoft Access?",
    "choices": [
      "DOC",
      "PDF",
      "CSV",
      "JPG",
      "EXE"
    ],
    "answer": "CSV"
  },
  {
    "question": "Dalam proses impor data dari Excel ke Access, apa yang dimaksud dengan 'penanganan baris judul'?",
    "choices": [
      "Menghapus baris judul",
      "Menjadikan baris pertama sebagai nama kolom",
      "Membuat baris judul baru",
      "Mengenkripsi baris judul",
      "Menggandakan baris judul"
    ],
    "answer": "Menjadikan baris pertama sebagai nama kolom"
  },
  {
    "question": "Apa fungsi utama dari 'wizard import teks' di Microsoft Access?",
    "choices": [
      "Untuk membuat tabel baru",
      "Untuk mengedit teks dalam tabel",
      "Untuk menganalisis dan mengimpor data dari file teks",
      "Untuk mengekspor data ke file teks",
      "Untuk menghapus teks dari tabel"
    ],
    "answer": "Untuk menganalisis dan mengimpor data dari file teks"
  },
  {
    "question": "Apa yang dimaksud dengan 'delimiter' dalam konteks impor file teks?",
    "choices": [
      "Karakter pembatas antar kolom data",
      "Batas maksimum jumlah baris",
      "Tanda akhir file",
      "Format encoding file",
      "Jenis font yang digunakan"
    ],
    "answer": "Karakter pembatas antar kolom data"
  },
  {
    "question": "Bagaimana cara terbaik mengatasi masalah ketidakcocokan tipe data saat mengimpor dari Excel ke Access?",
    "choices": [
      "Mengabaikan data yang tidak cocok",
      "Menghapus kolom yang bermasalah",
      "Menyesuaikan tipe data di Access sebelum impor",
      "Mengubah semua data menjadi teks",
      "Membatalkan proses impor"
    ],
    "answer": "Menyesuaikan tipe data di Access sebelum impor"
  },
  {
    "question": "Apa yang harus dilakukan jika ada nilai yang hilang saat mengimpor data?",
    "choices": [
      "Membatalkan impor",
      "Mengisi nilai yang hilang dengan nol",
      "Mengabaikan baris dengan nilai yang hilang",
      "Mengevaluasi dan memutuskan penanganan berdasarkan konteks data",
      "Menghapus kolom dengan nilai yang hilang"
    ],
    "answer": "Mengevaluasi dan memutuskan penanganan berdasarkan konteks data"
  },
  {
    "question": "Apa keuntungan menggunakan file CSV untuk impor data ke Access?",
    "choices": [
      "Ukuran file yang lebih kecil",
      "Kemampuan menyimpan format sel",
      "Dukungan untuk rumus kompleks",
      "Kompatibilitas yang tinggi dengan berbagai aplikasi",
      "Kemampuan menyimpan gambar"
    ],
    "answer": "Kompatibilitas yang tinggi dengan berbagai aplikasi"
  },
  {
    "question": "Bagaimana cara terbaik untuk mempersiapkan file teks sebelum diimpor ke Access?",
    "choices": [
      "Mengenkripsi file",
      "Mengompres file",
      "Membersihkan data dan memastikan konsistensi format",
      "Mengubah semua data menjadi huruf kapital",
      "Menghapus semua spasi dalam file"
    ],
    "answer": "Membersihkan data dan memastikan konsistensi format"
  },
  {
    "question": "Apa yang dimaksud dengan 'pemetaan tipe data' dalam proses impor?",
    "choices": [
      "Membuat peta visual dari data",
      "Mencocokkan tipe data sumber dengan tipe data di Access",
      "Mengubah semua data menjadi satu tipe",
      "Membuat indeks untuk setiap tipe data",
      "Menghitung jumlah tipe data berbeda"
    ],
    "answer": "Mencocokkan tipe data sumber dengan tipe data di Access"
  },
  {
    "question": "Bagaimana cara mengurutkan data dalam tampilan lembar data Access?",
    "choices": [
      "Menggunakan fungsi SORT() dalam query",
      "Menekan tombol F4",
      "Klik kanan pada kolom dan pilih opsi pengurutan",
      "Data selalu terurut otomatis",
      "Mengimpor ulang data dalam urutan yang diinginkan"
    ],
    "answer": "Klik kanan pada kolom dan pilih opsi pengurutan"
  },
  {
    "question": "Apa fungsi dari filter dalam tampilan lembar data?",
    "choices": [
      "Untuk menghapus data yang tidak diinginkan",
      "Untuk mengubah warna tampilan data",
      "Untuk menampilkan hanya data yang memenuhi kriteria tertentu",
      "Untuk menggabungkan beberapa tabel",
      "Untuk membuat backup data"
    ],
    "answer": "Untuk menampilkan hanya data yang memenuhi kriteria tertentu"
  },
  {
    "question": "Bagaimana cara terbaik untuk memodifikasi data yang sudah ada dalam lembar data?",
    "choices": [
      "Menghapus dan memasukkan ulang seluruh baris",
      "Mengklik sel yang ingin diubah dan mengetik nilai baru",
      "Mengimpor ulang seluruh dataset",
      "Membuat tabel baru untuk setiap perubahan",
      "Menggunakan query untuk mengubah data"
    ],
    "answer": "Mengklik sel yang ingin diubah dan mengetik nilai baru"
  },
  {
    "question": "Apa yang dimaksud dengan 'range sel' dalam konteks impor dari Excel?",
    "choices": [
      "Jarak antar sel dalam spreadsheet",
      "Rentang nilai yang diperbolehkan dalam sel",
      "Area sel yang akan diimpor ke Access",
      "Jumlah maksimum sel yang dapat diimpor",
      "Ukuran font dalam sel Excel"
    ],
    "answer": "Area sel yang akan diimpor ke Access"
  },
  {
    "question": "Bagaimana cara menambahkan catatan baru dalam tampilan lembar data Access?",
    "choices": [
      "Menggunakan tombol Insert pada keyboard",
      "Memilih 'New Record' dari menu File",
      "Mengklik baris kosong di bagian bawah lembar data",
      "Membuat tabel baru untuk setiap catatan",
      "Mengimpor data baru dari file eksternal"
    ],
    "answer": "Mengklik baris kosong di bagian bawah lembar data"
  },
  {
    "question": "Apa yang harus dilakukan jika tanda kutip dalam file teks menyebabkan masalah saat impor?",
    "choices": [
      "Menghapus semua tanda kutip",
      "Menggunakan opsi 'Text Qualifier' dalam wizard impor",
      "Mengubah format file menjadi Excel",
      "Membatalkan impor",
      "Mengganti tanda kutip dengan karakter lain"
    ],
    "answer": "Menggunakan opsi 'Text Qualifier' dalam wizard impor"
  },
  {
    "question": "Bagaimana cara terbaik untuk memastikan integritas data setelah proses impor?",
    "choices": [
      "Menghapus data yang mencurigakan",
      "Melakukan validasi manual pada setiap baris",
      "Menggunakan alat validasi bawaan Access dan memeriksa sampel data",
      "Mengabaikan proses validasi",
      "Mengimpor ulang data beberapa kali"
    ],
    "answer": "Menggunakan alat validasi bawaan Access dan memeriksa sampel data"
  },
  {
    "question": "Apa fungsi dari pengaturan format tampilan dalam lembar data?",
    "choices": [
      "Hanya untuk estetika",
      "Untuk mengenkripsi data",
      "Untuk meningkatkan kecepatan database",
      "Untuk mempermudah pembacaan dan interpretasi data",
      "Untuk mengurangi ukuran file database"
    ],
    "answer": "Untuk mempermudah pembacaan dan interpretasi data"
  },
  {
    "question": "Bagaimana cara menghapus catatan dalam tampilan lembar data Access?",
    "choices": [
      "Menekan tombol Delete pada keyboard",
      "Mengosongkan semua sel dalam baris",
      "Mengklik kanan pada nomor baris dan memilih 'Delete Record'",
      "Menghapus tabel dan membuatnya kembali",
      "Menggunakan query DELETE"
    ],
    "answer": "Mengklik kanan pada nomor baris dan memilih 'Delete Record'"
  },
  {
    "question": "Apa yang dimaksud dengan 'pengaturan format kolom' dalam impor file teks?",
    "choices": [
      "Mengubah warna latar belakang kolom",
      "Menentukan tipe data dan cara interpretasi data untuk setiap kolom",
      "Menghitung lebar optimal untuk setiap kolom",
      "Menambahkan border pada setiap kolom",
      "Mengganti nama kolom secara otomatis"
    ],
    "answer": "Menentukan tipe data dan cara interpretasi data untuk setiap kolom"
  },
  {
    "question": "Apa keuntungan menggunakan fungsi otomatis dalam Microsoft Access untuk memasukkan data?",
    "choices": [
      "Mengurangi ukuran file database",
      "Meningkatkan keamanan data",
      "Mempercepat proses input dan mengurangi kesalahan",
      "Mengenkripsi data secara otomatis",
      "Membuat backup otomatis setiap kali data dimasukkan"
    ],
    "answer": "Mempercepat proses input dan mengurangi kesalahan"
  }
];
})();
