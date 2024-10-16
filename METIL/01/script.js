(function(){
  const examId = "UTS_Metil";
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isExamActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-06T20:05:00');
    const endTime = new Date('2024-10-06T20:30:00');

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
              score += 4;
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

    // Quiz questions
    questions = [
      {
        "question": "Apa tujuan utama dari studi pendahuluan dalam penelitian ilmiah?",
        "choices": [
          "Mengumpulkan data utama penelitian",
          "Menentukan hipotesis penelitian",
          "Memperoleh gambaran awal tentang topik yang akan diteliti",
          "Menyusun kesimpulan penelitian"
        ],
        "answer": "Memperoleh gambaran awal tentang topik yang akan diteliti"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan metode umum dalam melakukan studi pendahuluan?",
        "choices": [
          "Wawancara informal",
          "Observasi lapangan",
          "Analisis dokumen",
          "Uji statistik lanjutan"
        ],
        "answer": "Uji statistik lanjutan"
      },
      {
        "question": "Kapan sebaiknya studi pendahuluan dilakukan dalam proses penelitian?",
        "choices": [
          "Setelah pengumpulan data utama",
          "Sebelum merumuskan masalah penelitian",
          "Selama analisis data",
          "Setelah menyusun kesimpulan"
        ],
        "answer": "Sebelum merumuskan masalah penelitian"
      },
      {
        "question": "Apa manfaat melakukan studi literatur sebagai bagian dari studi pendahuluan?",
        "choices": [
          "Mengetahui penelitian terkini tentang topik yang akan diteliti",
          "Mengidentifikasi kesenjangan dalam pengetahuan yang ada",
          "Membantu dalam perumusan pertanyaan penelitian",
          "Semua jawaban di atas benar"
        ],
        "answer": "Semua jawaban di atas benar"
      },
      {
        "question": "Dalam konteks studi pendahuluan, apa yang dimaksud dengan \"grand tour question\"?",
        "choices": [
          "Pertanyaan detail tentang topik penelitian",
          "Pertanyaan umum dan terbuka untuk memulai eksplorasi topik",
          "Pertanyaan hipotesis yang akan diuji",
          "Pertanyaan tentang anggaran penelitian"
        ],
        "answer": "Pertanyaan umum dan terbuka untuk memulai eksplorasi topik"
      },
      {
        "question": "Apa yang dimaksud dengan rancangan penelitian?",
        "choices": [
          "Proses pengumpulan data",
          "Kerangka kerja untuk melaksanakan penelitian",
          "Analisis hasil penelitian",
          "Penulisan laporan penelitian"
        ],
        "answer": "Kerangka kerja untuk melaksanakan penelitian"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan jenis utama rancangan penelitian?",
        "choices": [
          "Eksperimental",
          "Deskriptif",
          "Korelasional",
          "Manipulatif"
        ],
        "answer": "Manipulatif"
      },
      {
        "question": "Dalam rancangan penelitian eksperimental, apa yang dimaksud dengan \"kelompok kontrol\"?",
        "choices": [
          "Kelompok yang menerima perlakuan eksperimental",
          "Kelompok yang tidak menerima perlakuan eksperimental",
          "Kelompok yang mengontrol jalannya penelitian",
          "Kelompok yang menganalisis data penelitian"
        ],
        "answer": "Kelompok yang tidak menerima perlakuan eksperimental"
      },
      {
        "question": "Rancangan penelitian yang bertujuan untuk menggambarkan karakteristik suatu fenomena tanpa manipulasi variabel disebut:",
        "choices": [
          "Rancangan eksperimental",
          "Rancangan korelasional",
          "Rancangan deskriptif",
          "Rancangan longitudinal"
        ],
        "answer": "Rancangan deskriptif"
      },
      {
        "question": "Apa keuntungan utama dari menggunakan rancangan penelitian longitudinal?",
        "choices": [
          "Lebih murah dan cepat",
          "Dapat mengamati perubahan over time",
          "Selalu menghasilkan hubungan sebab-akibat",
          "Membutuhkan sampel yang lebih kecil"
        ],
        "answer": "Dapat mengamati perubahan over time"
      },
      {
        "question": "Apa fungsi utama dari perumusan masalah dalam penelitian ilmiah?",
        "choices": [
          "Menentukan metode penelitian",
          "Mengidentifikasi dan menjelaskan masalah yang akan diteliti",
          "Menganalisis data penelitian",
          "Menyimpulkan hasil penelitian"
        ],
        "answer": "Mengidentifikasi dan menjelaskan masalah yang akan diteliti"
      },
      {
        "question": "Karakteristik perumusan masalah yang baik adalah:",
        "choices": [
          "Kompleks dan sulit dipahami",
          "Terlalu luas dan umum",
          "Spesifik, jelas, dan dapat diteliti",
          "Tidak berkaitan dengan teori yang ada"
        ],
        "answer": "Spesifik, jelas, dan dapat diteliti"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan kriteria masalah penelitian yang baik?",
        "choices": [
          "Feasible (dapat dilaksanakan)",
          "Menarik",
          "Sudah pasti jawabannya",
          "Etis"
        ],
        "answer": "Sudah pasti jawabannya"
      },
      {
        "question": "Dalam perumusan masalah, pertanyaan penelitian sebaiknya:",
        "choices": [
          "Hanya dapat dijawab dengan \"ya\" atau \"tidak\"",
          "Bersifat terbuka dan memungkinkan eksplorasi mendalam",
          "Tidak berkaitan dengan tujuan penelitian",
          "Mengarahkan pada jawaban yang sudah diketahui"
        ],
        "answer": "Bersifat terbuka dan memungkinkan eksplorasi mendalam"
      },
      {
        "question": "Apa yang dimaksud dengan \"gap penelitian\" dalam konteks perumusan masalah?",
        "choices": [
          "Kesenjangan antara teori dan praktik",
          "Perbedaan pendapat antar peneliti",
          "Jarak waktu antara penelitian terdahulu dan sekarang",
          "Keterbatasan dalam metodologi penelitian"
        ],
        "answer": "Kesenjangan antara teori dan praktik"
      },
      {
        "question": "Apa yang dimaksud dengan hipotesis penelitian?",
        "choices": [
          "Kesimpulan akhir penelitian",
          "Dugaan sementara terhadap masalah penelitian",
          "Metode pengumpulan data",
          "Analisis statistik penelitian"
        ],
        "answer": "Dugaan sementara terhadap masalah penelitian"
      },
      {
        "question": "Hipotesis nol (H0) adalah:",
        "choices": [
          "Hipotesis yang menyatakan adanya hubungan antar variabel",
          "Hipotesis yang menyatakan tidak adanya hubungan antar variabel",
          "Hipotesis yang selalu diterima dalam penelitian",
          "Hipotesis yang tidak perlu diuji"
        ],
        "answer": "Hipotesis yang menyatakan tidak adanya hubungan antar variabel"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan karakteristik hipotesis yang baik?",
        "choices": [
          "Dapat diuji secara empiris",
          "Konsisten dengan teori yang ada",
          "Dinyatakan dalam kalimat yang kompleks",
          "Spesifik dan jelas"
        ],
        "answer": "Dinyatakan dalam kalimat yang kompleks"
      },
      {
        "question": "Dalam penelitian kualitatif, penggunaan hipotesis:",
        "choices": [
          "Selalu diperlukan",
          "Tidak pernah digunakan",
          "Dapat digunakan tapi tidak selalu diperlukan",
          "Menggantikan pertanyaan penelitian"
        ],
        "answer": "Dapat digunakan tapi tidak selalu diperlukan"
      },
      {
        "question": "Apa fungsi utama hipotesis dalam penelitian ilmiah?",
        "choices": [
          "Menggantikan perumusan masalah",
          "Memberikan arah yang jelas untuk penelitian",
          "Menentukan jumlah sampel penelitian",
          "Menggantikan tinjauan pustaka"
        ],
        "answer": "Memberikan arah yang jelas untuk penelitian"
      },
      {
        "question": "Apa yang dimaksud dengan abstrak dalam konteks penelitian ilmiah?",
        "choices": [
          "Daftar pustaka penelitian",
          "Ringkasan singkat dan padat dari keseluruhan penelitian",
          "Penjelasan detail metodologi penelitian",
          "Analisis mendalam hasil penelitian"
        ],
        "answer": "Ringkasan singkat dan padat dari keseluruhan penelitian"
      },
      {
        "question": "Berapa panjang ideal sebuah abstrak penelitian?",
        "choices": [
          "100-250 kata",
          "500-1000 kata",
          "1500-2000 kata",
          "Lebih dari 2000 kata"
        ],
        "answer": "100-250 kata"
      },
      {
        "question": "Manakah dari berikut ini yang seharusnya TIDAK ada dalam abstrak?",
        "choices": [
          "Tujuan penelitian",
          "Metodologi",
          "Hasil utama",
          "Referensi lengkap"
        ],
        "answer": "Referensi lengkap"
      },
      {
        "question": "Kapan sebaiknya abstrak ditulis dalam proses penelitian?",
        "choices": [
          "Sebelum memulai penelitian",
          "Saat mengumpulkan data",
          "Setelah menyelesaikan seluruh penelitian",
          "Saat merumuskan masalah penelitian"
        ],
        "answer": "Setelah menyelesaikan seluruh penelitian"
      },
      {
        "question": "Apa fungsi utama abstrak dalam sebuah artikel ilmiah?",
        "choices": [
          "Menjelaskan metode statistik yang digunakan",
          "Memberikan gambaran cepat tentang isi penelitian",
          "Menggantikan bagian diskusi",
          "Memperpanjang artikel"
        ],
        "answer": "Memberikan gambaran cepat tentang isi penelitian"
      }
    ];
})();