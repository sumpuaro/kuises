(function(){
  const quizId = "Kuis 05"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-01T10:05:00');
    const endTime = new Date('2024-10-01T10:20:00');

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
          "question": "Apa kegunaan utama dari Form Wizard di Microsoft Access?",
          "choices": [
            "Membuat query otomatis",
            "Mengimpor data dari Excel",
            "Membuat form dengan cepat dan efisien berdasarkan tabel atau kueri yang ada",
            "Mendesain laporan",
            "Mengoptimalkan kinerja database"
          ],
          "answer": "Membuat form dengan cepat dan efisien berdasarkan tabel atau kueri yang ada"
        },
        {
          "question": "Apa perbedaan utama antara Single View dan Continuous View pada form?",
          "choices": [
            "Single View hanya untuk tabel, Continuous View untuk query",
            "Single View menampilkan satu record pada satu waktu, Continuous View menampilkan beberapa record sekaligus",
            "Single View untuk data numerik, Continuous View untuk data teks",
            "Single View tidak bisa diedit, Continuous View bisa",
            "Tidak ada perbedaan, keduanya istilah yang sama"
          ],
          "answer": "Single View menampilkan satu record pada satu waktu, Continuous View menampilkan beberapa record sekaligus"
        },
        {
          "question": "Apa yang dimaksud dengan subform dalam Microsoft Access?",
          "choices": [
            "Form yang hanya bisa diakses oleh admin",
            "Form yang otomatis terhapus setelah digunakan",
            "Form yang disematkan di dalam form lain untuk menampilkan data terkait",
            "Form yang tidak memiliki tombol submit",
            "Form yang hanya bisa menampilkan data tanpa bisa mengedit"
          ],
          "answer": "Form yang disematkan di dalam form lain untuk menampilkan data terkait"
        },
        {
          "question": "Dalam tampilan apa elemen-elemen form seperti kotak teks dan label dapat disusun ulang secara visual?",
          "choices": [
            "Tampilan Data",
            "Tampilan SQL",
            "Tampilan Layout",
            "Tampilan Print",
            "Tampilan Pivot"
          ],
          "answer": "Tampilan Layout"
        },
        {
          "question": "Apa fungsi dari pengaturan tab order pada form?",
          "choices": [
            "Mengurutkan data dalam tabel",
            "Mengatur urutan tabulasi antar elemen form untuk navigasi keyboard",
            "Membuat tab baru pada form",
            "Mengubah warna tab pada form",
            "Menghapus tab yang tidak diperlukan"
          ],
          "answer": "Mengatur urutan tabulasi antar elemen form untuk navigasi keyboard"
        },
        {
          "question": "Apa yang perlu diperhatikan saat menghubungkan subform dengan form utama?",
          "choices": [
            "Warna background harus sama",
            "Ukuran font harus identik",
            "Properti subform harus diatur agar terhubung efektif dengan form utama",
            "Jumlah field harus sama",
            "Subform harus selalu dalam mode edit"
          ],
          "answer": "Properti subform harus diatur agar terhubung efektif dengan form utama"
        },
        {
          "question": "Dalam konteks form property, apa yang dimaksud dengan 'sumber data'?",
          "choices": [
            "Lokasi fisik database",
            "Tabel atau query yang menjadi basis data untuk form",
            "Pengguna yang membuat form",
            "Tanggal pembuatan form",
            "Versi Access yang digunakan"
          ],
          "answer": "Tabel atau query yang menjadi basis data untuk form"
        },
        {
          "question": "Apa keuntungan menggunakan tampilan rancangan (Design View) pada form?",
          "choices": [
            "Hanya bisa menampilkan data",
            "Tidak perlu coding",
            "Memungkinkan pengaturan yang lebih detail dan teknis pada form",
            "Otomatis menyinkronkan dengan database eksternal",
            "Hanya untuk form yang sederhana"
          ],
          "answer": "Memungkinkan pengaturan yang lebih detail dan teknis pada form"
        },
        {
          "question": "Bagaimana cara terbaik untuk memastikan data dalam subform disinkronkan dengan benar dengan data di form utama?",
          "choices": [
            "Selalu menyimpan form setiap 5 menit",
            "Menggunakan properti LinkChildFields dan LinkMasterFields",
            "Menghindari penggunaan subform",
            "Selalu menggunakan mode offline",
            "Mematikan AutoSave"
          ],
          "answer": "Menggunakan properti LinkChildFields dan LinkMasterFields"
        },
        {
          "question": "Apa yang dimaksud dengan validasi data dalam konteks form Access?",
          "choices": [
            "Proses mengenkripsi data",
            "Memeriksa apakah data yang dimasukkan memenuhi kriteria tertentu",
            "Menghapus data duplikat secara otomatis",
            "Mengkonversi semua data menjadi teks",
            "Membackup data secara otomatis"
          ],
          "answer": "Memeriksa apakah data yang dimasukkan memenuhi kriteria tertentu"
        },
        {
          "question": "Dalam Form Wizard, apa langkah pertama yang biasanya dilakukan?",
          "choices": [
            "Memilih warna form",
            "Menentukan judul form",
            "Memilih sumber data (tabel atau query)",
            "Mengatur ukuran font",
            "Menambahkan logo perusahaan"
          ],
          "answer": "Memilih sumber data (tabel atau query)"
        },
        {
          "question": "Apa kegunaan dari properti 'Allow Edits' pada form?",
          "choices": [
            "Mengizinkan pengguna untuk mengubah desain form",
            "Mengontrol apakah data dalam form dapat diubah atau hanya bisa dilihat",
            "Memungkinkan form untuk dicetak",
            "Mengaktifkan fitur spell-check",
            "Mengizinkan pengguna menambah field baru"
          ],
          "answer": "Mengontrol apakah data dalam form dapat diubah atau hanya bisa dilihat"
        },
        {
          "question": "Bagaimana cara terbaik untuk menambahkan kalkulator sederhana ke dalam form?",
          "choices": [
            "Menggunakan subform",
            "Menambahkan control ActiveX",
            "Membuat macro",
            "Mengimpor dari Excel",
            "Menggunakan query"
          ],
          "answer": "Menambahkan control ActiveX"
        },
        {
          "question": "Apa yang dimaksud dengan 'bound control' dalam form Access?",
          "choices": [
            "Kontrol yang tidak bisa digerakkan",
            "Kontrol yang terhubung langsung dengan field dalam tabel atau query",
            "Kontrol yang hanya bisa digunakan oleh admin",
            "Kontrol yang dibatasi oleh password",
            "Kontrol yang hanya muncul saat form di-print"
          ],
          "answer": "Kontrol yang terhubung langsung dengan field dalam tabel atau query"
        },
        {
          "question": "Apa fungsi dari tombol 'New Record' pada form?",
          "choices": [
            "Membuat form baru",
            "Menambahkan field baru ke tabel",
            "Membuat entri data baru dalam tabel yang terkait dengan form",
            "Membuat salinan dari form yang ada",
            "Menghapus semua record lama"
          ],
          "answer": "Membuat entri data baru dalam tabel yang terkait dengan form"
        },
        {
          "question": "Bagaimana cara terbaik untuk membatasi input pada form agar hanya menerima angka?",
          "choices": [
            "Menggunakan validasi data",
            "Mengganti tipe kontrol menjadi label",
            "Mengunci form",
            "Hanya mengizinkan admin untuk input",
            "Menggunakan subform"
          ],
          "answer": "Menggunakan validasi data"
        },
        {
          "question": "Apa yang dimaksud dengan 'modal form' di Access?",
          "choices": [
            "Form yang hanya bisa dibuka sekali",
            "Form yang membutuhkan input sebelum pengguna bisa melanjutkan",
            "Form yang otomatis tertutup setelah 5 menit",
            "Form yang hanya bisa dibuka oleh admin",
            "Form yang tidak bisa di-resize"
          ],
          "answer": "Form yang membutuhkan input sebelum pengguna bisa melanjutkan"
        },
        {
          "question": "Bagaimana cara terbaik untuk menambahkan gambar latar belakang ke form?",
          "choices": [
            "Menggunakan subform",
            "Melalui properti form di Design View",
            "Mengimpor dari Word",
            "Menggunakan query",
            "Menambahkan sebagai header"
          ],
          "answer": "Melalui properti form di Design View"
        },
        {
          "question": "Apa fungsi dari 'AutoFormat' dalam pembuatan form?",
          "choices": [
            "Otomatis memperbaiki kesalahan spelling",
            "Menerapkan gaya dan format standar ke form",
            "Mengubah ukuran form secara otomatis",
            "Menambahkan field secara otomatis",
            "Mengenkripsi data dalam form"
          ],
          "answer": "Menerapkan gaya dan format standar ke form"
        },
        {
          "question": "Dalam konteks form Access, apa yang dimaksud dengan 'event procedure'?",
          "choices": [
            "Prosedur untuk membuat event baru",
            "Kode VBA yang dijalankan saat event tertentu terjadi pada form",
            "Cara untuk menghapus semua event",
            "Metode untuk menggabungkan beberapa form",
            "Prosedur untuk mencetak form"
          ],
          "answer": "Kode VBA yang dijalankan saat event tertentu terjadi pada form"
        }
      ];
})();