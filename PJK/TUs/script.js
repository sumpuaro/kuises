(function(){
  const examId = "Ujian Tengah Semester";
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isExamActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-04T14:05:00');
    const endTime = new Date('2024-10-04T14:30:00');

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
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbyPhMU3DXeOPrApuM7oK2E2EowbnJiRyZeW3IC2HEiyvSAo1vhx6Co29hFj6CIPii54AA/exec';
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
        "question": "Apa yang dimaksud dengan penginderaan jauh?",
        "choices": [
          "Proses pengamatan objek secara langsung di lapangan",
          "Teknik pengambilan gambar menggunakan kamera digital",
          "Metode pengukuran jarak antar objek di permukaan bumi",
          "Ilmu dan seni untuk memperoleh informasi tentang objek melalui analisis data yang diperoleh dengan alat tanpa kontak langsung"
        ],
        "answer": "Ilmu dan seni untuk memperoleh informasi tentang objek melalui analisis data yang diperoleh dengan alat tanpa kontak langsung"
      },
      {
        "question": "Komponen apa yang TIDAK termasuk dalam sistem penginderaan jauh?",
        "choices": [
          "Sumber energi",
          "Sensor",
          "Objek",
          "Mikroskop"
        ],
        "answer": "Mikroskop"
      },
      {
        "question": "Manakah dari berikut ini yang merupakan contoh aplikasi penginderaan jauh?",
        "choices": [
          "Pengukuran suhu tubuh menggunakan termometer",
          "Pemetaan tutupan lahan menggunakan citra satelit",
          "Pengamatan sel darah menggunakan mikroskop",
          "Pengukuran tekanan darah menggunakan sphygmomanometer"
        ],
        "answer": "Pemetaan tutupan lahan menggunakan citra satelit"
      },
      {
        "question": "Apa fungsi utama dari sensor dalam sistem penginderaan jauh?",
        "choices": [
          "Menghasilkan energi yang dipancarkan ke objek",
          "Menyimpan data yang telah dianalisis",
          "Merekam energi yang dipantulkan atau dipancarkan oleh objek",
          "Mentransmisikan data langsung ke pengguna akhir"
        ],
        "answer": "Merekam energi yang dipantulkan atau dipancarkan oleh objek"
      },
      {
        "question": "Dalam penginderaan jauh, apa yang dimaksud dengan resolusi spasial?",
        "choices": [
          "Kemampuan sensor untuk membedakan objek berdasarkan warnanya",
          "Ukuran terkecil objek yang dapat dideteksi oleh sensor",
          "Jumlah band spektral yang dapat direkam oleh sensor",
          "Frekuensi pengambilan data oleh satelit pada area yang sama"
        ],
        "answer": "Ukuran terkecil objek yang dapat dideteksi oleh sensor"
      },
      {
        "question": "Dalam penginderaan jauh, gelombang elektromagnetik yang digunakan mencakup spektrum yang luas. Manakah dari berikut ini yang BUKAN merupakan bagian dari spektrum elektromagnetik yang umum digunakan dalam penginderaan jauh?",
        "choices": [
          "Sinar gamma",
          "Gelombang radio",
          "Inframerah",
          "Gelombang suara"
        ],
        "answer": "Gelombang suara"
      },
      {
        "question": "Dalam interaksi energi elektromagnetik dengan atmosfer, fenomena apa yang menyebabkan pengurangan intensitas energi yang mencapai permukaan bumi?",
        "choices": [
          "Difraksi",
          "Absorpsi",
          "Refleksi",
          "Transmisi"
        ],
        "answer": "Absorpsi"
      },
      {
        "question": "Jika sebuah objek memantulkan lebih banyak energi pada panjang gelombang merah dibandingkan dengan panjang gelombang hijau dan biru, warna apakah yang akan terlihat oleh mata manusia?",
        "choices": [
          "Hijau",
          "Biru",
          "Merah",
          "Kuning"
        ],
        "answer": "Merah"
      },
      {
        "question": "Dalam penginderaan jauh, apa yang dimaksud dengan \"jendela atmosfer\"?",
        "choices": [
          "Bagian atmosfer yang transparan terhadap radiasi elektromagnetik tertentu",
          "Lubang pada lapisan ozon yang memungkinkan radiasi UV mencapai bumi",
          "Area di atmosfer di mana satelit dapat beroperasi dengan aman",
          "Wilayah di mana data penginderaan jauh dikumpulkan secara intensif"
        ],
        "answer": "Bagian atmosfer yang transparan terhadap radiasi elektromagnetik tertentu"
      },
      {
        "question": "Hukum fisika apa yang menjelaskan hubungan antara suhu objek dan puncak emisi radiasi elektromagnetiknya?",
        "choices": [
          "Hukum Snell",
          "Hukum Wien",
          "Hukum Planck",
          "Hukum Stefan-Boltzmann"
        ],
        "answer": "Hukum Wien"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan jenis sensor dalam penginderaan jauh?",
        "choices": [
          "Sensor aktif",
          "Sensor pasif",
          "Sensor termal",
          "Sensor gravitasi"
        ],
        "answer": "Sensor gravitasi"
      },
      {
        "question": "Wahana penginderaan jauh yang beroperasi di luar atmosfer bumi disebut:",
        "choices": [
          "Pesawat terbang",
          "Balon udara",
          "Satelit",
          "Drone"
        ],
        "answer": "Satelit"
      },
      {
        "question": "Apa fungsi utama dari koreksi geometrik dalam pengolahan citra penginderaan jauh?",
        "choices": [
          "Menghilangkan noise pada citra",
          "Memperbaiki distorsi bentuk dan posisi objek pada citra",
          "Meningkatkan kontras citra",
          "Mengklasifikasikan objek pada citra"
        ],
        "answer": "Memperbaiki distorsi bentuk dan posisi objek pada citra"
      },
      {
        "question": "Sensor yang menghasilkan energinya sendiri untuk menyinari objek disebut:",
        "choices": [
          "Sensor pasif",
          "Sensor aktif",
          "Sensor multispektral",
          "Sensor hiperspektral"
        ],
        "answer": "Sensor aktif"
      },
      {
        "question": "Koreksi radiometrik dalam pengolahan citra bertujuan untuk:",
        "choices": [
          "Memperbaiki posisi piksel",
          "Menghilangkan efek atmosfer dan memperbaiki nilai piksel",
          "Mengubah resolusi spasial citra",
          "Menggabungkan beberapa citra"
        ],
        "answer": "Menghilangkan efek atmosfer dan memperbaiki nilai piksel"
      },
      {
        "question": "Manakah dari berikut ini yang merupakan contoh wahana penginderaan jauh?",
        "choices": [
          "GPS",
          "Spektrometer",
          "Pesawat terbang",
          "Barometer"
        ],
        "answer": "Pesawat terbang"
      },
      {
        "question": "Dalam klasifikasi visual citra penginderaan jauh, apa yang dimaksud dengan \"kunci interpretasi\"?",
        "choices": [
          "Kode warna untuk setiap kelas objek",
          "Karakteristik objek yang membantu identifikasi",
          "Alat untuk membuka file citra terenkripsi",
          "Metode statistik untuk klasifikasi otomatis"
        ],
        "answer": "Karakteristik objek yang membantu identifikasi"
      },
      {
        "question": "Apa perbedaan utama antara sensor multispektral dan hiperspektral?",
        "choices": [
          "Jumlah band spektral yang direkam",
          "Resolusi spasial",
          "Jenis wahana yang digunakan",
          "Metode pemrosesan data"
        ],
        "answer": "Jumlah band spektral yang direkam"
      },
      {
        "question": "Dalam koreksi geometrik, proses mencocokkan koordinat citra dengan koordinat peta disebut:",
        "choices": [
          "Resampling",
          "Rektifikasi",
          "Registrasi",
          "Ortorektifikasi"
        ],
        "answer": "Registrasi"
      },
      {
        "question": "Klasifikasi visual citra penginderaan jauh paling cocok digunakan ketika:",
        "choices": [
          "Area studi sangat luas",
          "Diperlukan klasifikasi yang sangat detail",
          "Waktu pengolahan terbatas",
          "Pengetahuan lokal dan pengalaman interpreter dibutuhkan"
        ],
        "answer": "Pengetahuan lokal dan pengalaman interpreter dibutuhkan"
      },
      {
        "question": "Apa yang dimaksud dengan \"resolusi radiometrik\" dalam penginderaan jauh?",
        "choices": [
          "Jumlah band spektral yang dapat direkam sensor",
          "Ukuran terkecil objek yang dapat dideteksi",
          "Sensitivitas sensor terhadap perbedaan intensitas energi",
          "Frekuensi pengambilan data pada area yang sama"
        ],
        "answer": "Sensitivitas sensor terhadap perbedaan intensitas energi"
      },
      {
        "question": "Dalam koreksi radiometrik, proses menghilangkan efek hamburan atmosfer pada citra disebut:",
        "choices": [
          "Kalibrasi sensor",
          "Koreksi topografik",
          "Koreksi atmosferik",
          "Normalisasi histogram"
        ],
        "answer": "Koreksi atmosferik"
      },
      {
        "question": "Manakah dari berikut ini yang BUKAN merupakan elemen interpretasi visual dalam penginderaan jauh?",
        "choices": [
          "Tekstur",
          "Bentuk",
          "Polarisasi",
          "Asosiasi"
        ],
        "answer": "Polarisasi"
      },
      {
        "question": "Apa keuntungan utama menggunakan UAV (Unmanned Aerial Vehicle) sebagai wahana penginderaan jauh?",
        "choices": [
          "Dapat beroperasi di luar atmosfer",
          "Memiliki resolusi temporal yang sangat tinggi",
          "Dapat menghasilkan citra dengan cakupan global",
          "Biaya operasional lebih rendah untuk area yang kecil"
        ],
        "answer": "Biaya operasional lebih rendah untuk area yang kecil"
      },
      {
        "question": "Dalam proses koreksi geometrik, metode apa yang digunakan untuk menentukan nilai piksel pada posisi baru?",
        "choices": [
          "Filtering",
          "Resampling",
          "Thresholding",
          "Clustering"
        ],
        "answer": "Resampling"
      }
    ];
})();