(function(){
  const quizId = "Kuis 07"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-15T10:00:00');
    const endTime = new Date('2024-10-15T10:23:00');

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
        "question": "Apa fungsi dari aturan validasi dalam Microsoft Access?",
        "choices": [
          "Untuk menghapus data yang tidak diperlukan",
          "Untuk memastikan data yang dimasukkan akurat dan sesuai dengan kriteria tertentu",
          "Untuk mempercepat proses input data",
          "Untuk mengubah tipe data",
          "Untuk membuat hubungan antar tabel"
        ],
        "answer": "Untuk memastikan data yang dimasukkan akurat dan sesuai dengan kriteria tertentu"
      },
      {
        "question": "Di mana aturan validasi dapat diterapkan dalam Microsoft Access?",
        "choices": [
          "Pada field dalam tabel",
          "Pada query",
          "Pada form",
          "Pada laporan",
          "Semua pilihan di atas benar"
        ],
        "answer": "Semua pilihan di atas benar"
      },
      {
        "question": "Apa yang ditampilkan oleh pesan kesalahan pada validasi data?",
        "choices": [
          "Waktu yang dibutuhkan untuk memproses data",
          "Jumlah data yang telah dimasukkan",
          "Informasi tentang mengapa data yang dimasukkan tidak valid",
          "Lokasi penyimpanan data",
          "Nama pengguna yang memasukkan data"
        ],
        "answer": "Informasi tentang mengapa data yang dimasukkan tidak valid"
      },
      {
        "question": "Ekspresi dalam Microsoft Access digunakan untuk?",
        "choices": [
          "Membuat tampilan form",
          "Menghitung nilai atau menerapkan logika pada data",
          "Menghapus data",
          "Mengurutkan data",
          "Membuat relasi antar tabel"
        ],
        "answer": "Menghitung nilai atau menerapkan logika pada data"
      },
      {
        "question": "Manakah dari berikut ini yang merupakan contoh penggunaan ekspresi untuk validasi data?",
        "choices": [
          "Mengganti nama tabel",
          "Membuat aturan bahwa nilai harus lebih besar dari 10",
          "Menggabungkan dua tabel",
          "Menghapus field",
          "Membuat laporan"
        ],
        "answer": "Membuat aturan bahwa nilai harus lebih besar dari 10"
      },
      {
        "question": "Dalam Microsoft Access, ekspresi dapat digunakan untuk melakukan perhitungan di mana?",
        "choices": [
          "Pada query, form, dan laporan",
          "Hanya pada laporan",
          "Pada halaman utama",
          "Hanya pada form",
          "Pada menu pengaturan"
        ],
        "answer": "Pada query, form, dan laporan"
      },
      {
        "question": "Apakah tujuan utama dari pembuatan laporan dalam Microsoft Access?",
        "choices": [
          "Mengatur relasi antar tabel",
          "Menyajikan data dalam format yang dapat dicetak atau dibagikan",
          "Mengubah tipe data",
          "Menghapus tabel yang tidak diperlukan",
          "Memperbaiki form"
        ],
        "answer": "Menyajikan data dalam format yang dapat dicetak atau dibagikan"
      },
      {
        "question": "Fitur apa yang dapat ditambahkan ke laporan untuk meningkatkan presentasi data?",
        "choices": [
          "Header dan footer",
          "Elemen grafis (garis, kotak)",
          "Pengelompokan dan pengurutan data",
          "Perhitungan total atau rata-rata",
          "Semua pilihan di atas benar"
        ],
        "answer": "Semua pilihan di atas benar"
      },
      {
        "question": "Bagaimana cara menambahkan pesan kesalahan untuk aturan validasi?",
        "choices": [
          "Menggunakan tabel relasi",
          "Melalui properti \"Validation Rule\" dan \"Validation Text\"",
          "Menggunakan menu \"Format\"",
          "Dengan menambahkan query baru",
          "Mengubah tipe data menjadi \"Error Message\""
        ],
        "answer": "Melalui properti \"Validation Rule\" dan \"Validation Text\""
      },
      {
        "question": "Apa tujuan dari penggunaan sub-laporan dalam laporan kompleks?",
        "choices": [
          "Untuk menampilkan data secara lebih terstruktur dari beberapa sumber data",
          "Untuk mengubah tipe data",
          "Untuk menghapus field",
          "Untuk menambah relasi antar tabel",
          "Untuk menyembunyikan data tertentu"
        ],
        "answer": "Untuk menampilkan data secara lebih terstruktur dari beberapa sumber data"
      },
      {
        "question": "Di mana ekspresi matematika biasanya diterapkan dalam Microsoft Access?",
        "choices": [
          "Pada field dalam tabel",
          "Pada query",
          "Pada form",
          "Pada laporan",
          "Semua pilihan di atas benar"
        ],
        "answer": "Semua pilihan di atas benar"
      },
      {
        "question": "Apakah tujuan dari penggunaan grafik dalam laporan Microsoft Access?",
        "choices": [
          "Menghapus data yang tidak diperlukan",
          "Menyederhanakan input data",
          "Menyajikan data dalam bentuk visual untuk analisis yang lebih mudah",
          "Menambah relasi antar tabel",
          "Mengubah tipe data"
        ],
        "answer": "Menyajikan data dalam bentuk visual untuk analisis yang lebih mudah"
      },
      {
        "question": "Apa yang dimaksud dengan validasi data?",
        "choices": [
          "Proses menghapus data",
          "Proses memastikan bahwa data sesuai dengan aturan yang telah ditentukan",
          "Proses menyembunyikan data",
          "Proses menambah data baru",
          "Proses menggabungkan tabel"
        ],
        "answer": "Proses memastikan bahwa data sesuai dengan aturan yang telah ditentukan"
      },
      {
        "question": "Ekspresi mana yang benar untuk memvalidasi bahwa data harus lebih besar dari 100?",
        "choices": [
          "<100",
          "<>100",
          ">100",
          "<=100",
          "100="
        ],
        "answer": ">100"
      },
      {
        "question": "Apa fungsi dari pengelompokan data dalam laporan kompleks?",
        "choices": [
          "Untuk menghapus data yang tidak diperlukan",
          "Untuk menyajikan data dalam kategori yang terorganisir",
          "Untuk mengubah tipe data",
          "Untuk membuat relasi antar tabel",
          "Untuk mempercepat proses pembuatan laporan"
        ],
        "answer": "Untuk menyajikan data dalam kategori yang terorganisir"
      },
      {
        "question": "Bagaimana cara menambahkan elemen grafis dalam laporan Microsoft Access?",
        "choices": [
          "Menggunakan menu \"Insert\"",
          "Mengubah tipe data",
          "Menambahkan relasi antar tabel",
          "Menggunakan menu \"Delete\"",
          "Menghapus data yang tidak diperlukan"
        ],
        "answer": "Menggunakan menu \"Insert\""
      },
      {
        "question": "Apa peran utama footer dalam laporan Microsoft Access?",
        "choices": [
          "Menyajikan data utama",
          "Menyediakan informasi tambahan seperti tanggal atau penomoran halaman",
          "Menambah validasi data",
          "Mengubah tipe data",
          "Menghapus field"
        ],
        "answer": "Menyediakan informasi tambahan seperti tanggal atau penomoran halaman"
      },
      {
        "question": "Laporan apa yang sebaiknya digunakan untuk menampilkan data dari beberapa tabel sekaligus?",
        "choices": [
          "Laporan dasar",
          "Laporan sederhana",
          "Laporan kompleks",
          "Laporan tunggal",
          "Laporan format"
        ],
        "answer": "Laporan kompleks"
      },
      {
        "question": "Bagaimana cara membuat perhitungan dasar di field dalam Microsoft Access?",
        "choices": [
          "Menggunakan \"Data Type\"",
          "Menggunakan ekspresi pada \"Control Source\"",
          "Menggunakan \"Validation Rule\"",
          "Menghapus field",
          "Mengubah relasi tabel"
        ],
        "answer": "Menggunakan ekspresi pada \"Control Source\""
      },
      {
        "question": "Apa yang dimaksud dengan \"Sub-Report\" dalam laporan Microsoft Access?",
        "choices": [
          "Sebuah tabel tambahan",
          "Sebuah relasi antar field",
          "Sebuah laporan kecil yang dimasukkan ke dalam laporan utama",
          "Sebuah form input",
          "Sebuah elemen grafis"
        ],
        "answer": "Sebuah laporan kecil yang dimasukkan ke dalam laporan utama"
      },
      {
        "question": "Apa fungsi dari ekspresi IIf() dalam Microsoft Access?",
        "choices": [
          "Untuk menggabungkan teks",
          "Untuk melakukan perhitungan matematika kompleks",
          "Untuk membuat kondisi logika sederhana",
          "Untuk mengubah tipe data",
          "Untuk membuat relasi antar tabel"
        ],
        "answer": "Untuk membuat kondisi logika sederhana"
      },
      {
        "question": "Bagaimana cara menambahkan grafik ke dalam laporan di Microsoft Access?",
        "choices": [
          "Menggunakan menu \"Insert\" dan memilih jenis grafik yang diinginkan",
          "Mengimpor grafik dari file eksternal",
          "Menambahkan sub-laporan berisi grafik",
          "Menggunakan ekspresi untuk membuat grafik",
          "Grafik tidak dapat ditambahkan ke dalam laporan Access"
        ],
        "answer": "Menggunakan menu \"Insert\" dan memilih jenis grafik yang diinginkan"
      },
      {
        "question": "Apa yang dimaksud dengan \"calculated field\" dalam Microsoft Access?",
        "choices": [
          "Field yang berisi data yang dimasukkan secara manual",
          "Field yang nilainya dihitung berdasarkan ekspresi atau formula",
          "Field yang hanya dapat berisi angka",
          "Field yang digunakan untuk menyimpan tanggal",
          "Field yang digunakan untuk membuat relasi antar tabel"
        ],
        "answer": "Field yang nilainya dihitung berdasarkan ekspresi atau formula"
      },
      {
        "question": "Bagaimana cara menerapkan format kondisional pada laporan di Microsoft Access?",
        "choices": [
          "Menggunakan menu \"Format\" dan memilih \"Conditional Formatting\"",
          "Menambahkan aturan validasi pada laporan",
          "Menggunakan ekspresi IIf() pada setiap field",
          "Membuat query terpisah untuk setiap kondisi",
          "Format kondisional tidak tersedia dalam laporan Access"
        ],
        "answer": "Menggunakan menu \"Format\" dan memilih \"Conditional Formatting\""
      },
      {
        "question": "Apa fungsi dari properti \"Input Mask\" pada field dalam tabel Microsoft Access?",
        "choices": [
          "Untuk mengenkripsi data yang dimasukkan",
          "Untuk membatasi tipe data yang dapat dimasukkan",
          "Untuk mengatur format tampilan data saat dimasukkan",
          "Untuk memvalidasi data setelah dimasukkan",
          "Untuk mengubah tipe data secara otomatis"
        ],
        "answer": "Untuk mengatur format tampilan data saat dimasukkan"
      }
    ];
})();