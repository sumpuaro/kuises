(function(){
  const quizId = "Kuis 04"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-09-17T10:00:00');
    const endTime = new Date('2024-09-17T10:30:00');

    if (now < startTime || now > endTime) {
        alert(`Akses kuis hanya tersedia pada ${startTime.toLocaleDateString()} pukul ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}.`);
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
          quizInfoElement.textContent = `${quizId}. Selamat Bekerja Semoga Sukses.`;
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
          "question": "Apa saja jenis-jenis relationship dalam basis data yang dipelajari pada pertemuan keenam?",
          "choices": [
              "One-to-one, one-to-many, many-to-many",
              "One-to-one, one-to-two, two-to-many",
              "One-to-many, many-to-one, many-to-none",
              "One-to-all, all-to-many, many-to-few",
              "One-to-one, many-to-one, few-to-many"
          ],
          "answer": "One-to-one, one-to-many, many-to-many"
      },
      {
          "question": "Mengapa penting untuk membangun relationship yang tepat dalam basis data?",
          "choices": [
              "Untuk mempercepat proses penginputan data",
              "Untuk menjaga integritas data",
              "Untuk menghemat ruang penyimpanan",
              "Untuk meningkatkan keamanan database",
              "Untuk membuat tampilan lebih menarik"
          ],
          "answer": "Untuk menjaga integritas data"
      },
      {
          "question": "Apa fungsi primary key dalam membentuk relationship?",
          "choices": [
              "Sebagai identitas unik untuk setiap baris dalam tabel",
              "Sebagai kolom yang selalu bernilai kosong",
              "Sebagai penghubung antar database",
              "Sebagai penanda kolom yang akan dihapus",
              "Sebagai pengatur urutan data dalam tabel"
          ],
          "answer": "Sebagai identitas unik untuk setiap baris dalam tabel"
      },
      {
          "question": "Apa yang dimaksud dengan foreign key?",
          "choices": [
              "Kunci yang digunakan untuk mengenkripsi data",
              "Kunci utama dalam tabel utama",
              "Kunci yang menghubungkan tabel dengan tabel lain",
              "Kunci yang hanya ada dalam tabel sementara",
              "Kunci yang digunakan untuk menghapus data"
          ],
          "answer": "Kunci yang menghubungkan tabel dengan tabel lain"
      },
      {
          "question": "Dalam Microsoft Access, bagaimana cara memastikan referential integrity?",
          "choices": [
              "Dengan mengunci semua tabel",
              "Dengan menonaktifkan fitur keamanan",
              "Dengan mengaktifkan opsi referential integrity saat mengatur relationship",
              "Dengan menghapus data duplikat",
              "Dengan menambahkan lebih banyak primary key"
          ],
          "answer": "Dengan mengaktifkan opsi referential integrity saat mengatur relationship"
      },
      {
          "question": "Apa manfaat dari menghubungkan tabel-tabel dalam basis data?",
          "choices": [
              "Untuk membuat tabel menjadi lebih besar",
              "Untuk memungkinkan data dari satu tabel digunakan di tabel lain secara terstruktur dan logis",
              "Untuk mengurangi jumlah tabel dalam database",
              "Untuk meningkatkan kecepatan akses database",
              "Untuk menghapus data yang tidak diperlukan"
          ],
          "answer": "Untuk memungkinkan data dari satu tabel digunakan di tabel lain secara terstruktur dan logis"
      },
      {
          "question": "Pada sesi 'Membuat Tautan Tabel Bagian 1', langkah pertama yang dilakukan adalah:",
          "choices": [
              "Menghapus semua tabel",
              "Mengidentifikasi kolom yang akan dihubungkan",
              "Membuat query baru",
              "Menentukan jenis data",
              "Mengganti nama tabel"
          ],
          "answer": "Mengidentifikasi kolom yang akan dihubungkan"
      },
      {
          "question": "Apa tujuan dari pendekatan bertahap dalam pembuatan tautan tabel?",
          "choices": [
              "Agar mahasiswa dapat menyelesaikan tugas lebih cepat",
              "Untuk memastikan mahasiswa memahami proses pembuatan tautan dengan baik",
              "Untuk menghemat sumber daya komputer",
              "Untuk mengurangi ukuran database",
              "Untuk meningkatkan keamanan data"
          ],
          "answer": "Untuk memastikan mahasiswa memahami proses pembuatan tautan dengan baik"
      },
      {
          "question": "Dalam proses pengaturan relationship, apa yang dimaksud dengan referential integrity?",
          "choices": [
              "Konsistensi data antara tabel yang terhubung",
              "Kecepatan akses data antar tabel",
              "Ukuran tabel dalam database",
              "Jumlah kolom dalam sebuah tabel",
              "Nama tabel yang digunakan"
          ],
          "answer": "Konsistensi data antara tabel yang terhubung"
      },
      {
          "question": "Jika ingin mengedit relationship yang sudah ada, langkah yang perlu dilakukan adalah:",
          "choices": [
              "Menghapus database dan membuat yang baru",
              "Memodifikasi atau menghapus relationship melalui menu relationship",
              "Mengubah nama tabel terkait",
              "Menambahkan lebih banyak kolom ke tabel",
              "Mengubah tipe data kolom menjadi teks"
          ],
          "answer": "Memodifikasi atau menghapus relationship melalui menu relationship"
      },
      {
          "question": "Apa yang terjadi jika referential integrity tidak dijaga dengan baik?",
          "choices": [
              "Data akan tetap konsisten dan akurat",
              "Data mungkin menjadi tidak konsisten atau terjadi kesalahan",
              "Database akan berjalan lebih cepat",
              "Tidak ada efek sama sekali",
              "Database akan otomatis memperbaiki kesalahan"
          ],
          "answer": "Data mungkin menjadi tidak konsisten atau terjadi kesalahan"
      },
      {
          "question": "Jenis relationship yang memungkinkan satu baris dalam tabel A terkait dengan banyak baris dalam tabel B adalah:",
          "choices": [
              "One-to-one",
              "One-to-many",
              "Many-to-one",
              "Many-to-many",
              "One-to-all"
          ],
          "answer": "One-to-many"
      },
      {
          "question": "Dalam konteks Microsoft Access, primary key biasanya:",
          "choices": [
              "Kolom dengan nilai duplikat",
              "Kolom yang selalu bernilai null",
              "Kolom dengan nilai unik yang mengidentifikasi setiap baris",
              "Kolom yang tidak digunakan dalam relationship",
              "Kolom yang berisi data teks panjang"
          ],
          "answer": "Kolom dengan nilai unik yang mengidentifikasi setiap baris"
      },
      {
          "question": "Pada sesi 'Membuat Tautan Tabel Bagian 2', mahasiswa ditugaskan untuk:",
          "choices": [
              "Menghapus relationship yang ada",
              "Menambahkan hubungan tambahan antara tabel-tabel yang tersisa",
              "Mengganti nama semua tabel",
              "Membuat query untuk laporan",
              "Mengimpor data dari sumber lain"
          ],
          "answer": "Menambahkan hubungan tambahan antara tabel-tabel yang tersisa"
      },
      {
          "question": "Bagaimana cara menghubungkan tabel yang sebelumnya tidak terkait?",
          "choices": [
              "Dengan menambahkan foreign key yang sesuai",
              "Dengan menghapus primary key",
              "Dengan mengubah nama database",
              "Dengan menghapus semua data",
              "Dengan menginstal ulang Microsoft Access"
          ],
          "answer": "Dengan menambahkan foreign key yang sesuai"
      },
      {
          "question": "Apa yang dimaksud dengan one-to-one relationship?",
          "choices": [
              "Satu baris dalam tabel A terkait dengan banyak baris dalam tabel B",
              "Satu baris dalam tabel A terkait dengan satu baris dalam tabel B",
              "Banyak baris dalam tabel A terkait dengan banyak baris dalam tabel B",
              "Tidak ada hubungan antara tabel",
              "Semua baris dalam tabel A terkait dengan semua baris dalam tabel B"
          ],
          "answer": "Satu baris dalam tabel A terkait dengan satu baris dalam tabel B"
      },
      {
          "question": "Salah satu tujuan dari sesi 'Mengedit dan Menghubungkan Tabel' adalah:",
          "choices": [
              "Mengajarkan cara memodifikasi atau menghapus relationship jika diperlukan",
              "Menghapus semua data dalam database",
              "Mengganti tampilan antarmuka Microsoft Access",
              "Mengubah bahasa pemrograman yang digunakan",
              "Menambahkan efek animasi pada tabel"
          ],
          "answer": "Mengajarkan cara memodifikasi atau menghapus relationship jika diperlukan"
      },
      {
          "question": "Apa yang harus diperhatikan saat membuat relationship untuk memastikan data tetap konsisten?",
          "choices": [
              "Ukuran font dalam tabel",
              "Tipe data dari kolom yang dihubungkan harus kompatibel",
              "Warna latar belakang tabel",
              "Jumlah baris dalam setiap tabel",
              "Nama pengguna yang login"
          ],
          "answer": "Tipe data dari kolom yang dihubungkan harus kompatibel"
      },
      {
          "question": "Many-to-many relationship biasanya diimplementasikan dengan:",
          "choices": [
              "Menggunakan tabel ketiga sebagai tabel penghubung",
              "Menggabungkan semua tabel menjadi satu",
              "Menggunakan query khusus",
              "Menghapus primary key",
              "Menggunakan fitur canggih Microsoft Access"
          ],
          "answer": "Menggunakan tabel ketiga sebagai tabel penghubung"
      },
      {
          "question": "Apa manfaat dari memastikan referential integrity dalam database?",
          "choices": [
              "Memungkinkan perubahan data tanpa batas",
              "Mencegah perubahan yang dapat menyebabkan inkonsistensi data",
              "Memperbesar ukuran database secara signifikan",
              "Mengizinkan data duplikat dalam primary key",
              "Mengurangi keamanan data"
          ],
          "answer": "Mencegah perubahan yang dapat menyebabkan inkonsistensi data"
      }
  ];
})();