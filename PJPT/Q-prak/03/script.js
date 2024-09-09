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
      const startTime = new Date('2023-09-10T10:00:00');
      const endTime = new Date('2025-09-10T10:30:00');

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
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbx64b7_TbZZ4F1vkDxI8eh5RcONi0caUVq8Q4nEgx-YWiBbJvCQhMvZSGC-_q9Zw07t/exec';
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
        "question": "Apa yang dimaksud dengan ImageCollection dalam Earth Engine?",
        "choices": [
        "Kumpulan gambar acak",
        "Satu gambar satelit tunggal",
        "Kumpulan gambar terorganisir dengan informasi lokasi dan tanggal",
        "Album foto digital",
        "Koleksi seni visual"
        ],
        "answer": "Kumpulan gambar terorganisir dengan informasi lokasi dan tanggal"
        },
        {
        "question": "Apa fungsi utama dari filterDate dalam Earth Engine?",
        "choices": [
        "Menghapus gambar lama",
        "Menyortir gambar berdasarkan kualitas",
        "Memperbaiki tanggal yang salah pada metadata",
        "Mempersempit rentang tanggal dari ImageCollection",
        "Mengubah format tanggal pada gambar"
        ],
        "answer": "Mempersempit rentang tanggal dari ImageCollection"
        },
        {
        "question": "Apa yang dilakukan oleh fungsi filterBounds dalam Earth Engine?",
        "choices": [
        "Memperbesar gambar",
        "Memotong gambar",
        "Memfilter gambar berdasarkan lokasi",
        "Menghapus batas gambar",
        "Menambahkan batas pada gambar"
        ],
        "answer": "Memfilter gambar berdasarkan lokasi"
        },
        {
        "question": "Apa yang dimaksud dengan 'surface reflectance' dalam konteks citra satelit?",
        "choices": [
        "Pantulan cahaya dari permukaan laut",
        "Estimasi rasio radiasi ke atas dan ke bawah di permukaan Bumi",
        "Refleksi cahaya dari awan",
        "Pantulan cahaya dari atmosfer",
        "Kecerahan gambar satelit"
        ],
        "answer": "Estimasi rasio radiasi ke atas dan ke bawah di permukaan Bumi"
        },
        {
        "question": "Apa keuntungan utama dari menggunakan citra 'surface reflectance' dibandingkan citra mentah?",
        "choices": [
        "Resolusi yang lebih tinggi",
        "Ukuran file yang lebih kecil",
        "Koreksi efek atmosfer",
        "Warna yang lebih cerah",
        "Cakupan area yang lebih luas"
        ],
        "answer": "Koreksi efek atmosfer"
        },
        {
        "question": "Apa yang dimaksud dengan pre-made composites dalam Earth Engine?",
        "choices": [
        "Gambar yang dibuat sebelum peluncuran satelit",
        "Gabungan beberapa gambar terbaik dari suatu periode",
        "Gambar yang diambil pada waktu yang sama setiap hari",
        "Koleksi gambar yang belum diproses",
        "Gambar yang dibuat oleh pengguna Earth Engine"
        ],
        "answer": "Gabungan beberapa gambar terbaik dari suatu periode"
        },
        {
        "question": "Berapa resolusi spasial umum dari band visible MODIS?",
        "choices": [
        "10 m",
        "30 m",
        "100 m",
        "250 m",
        "500 m"
        ],
        "answer": "500 m"
        },
        {
        "question": "Apa yang diukur oleh dataset Sentinel-5 yang dibahas dalam bab ini?",
        "choices": [
        "Suhu permukaan",
        "Ketinggian awan",
        "Konsentrasi metana",
        "Kecepatan angin",
        "Tingkat hujan"
        ],
        "answer": "Konsentrasi metana"
        },
        {
        "question": "Apa nama dataset cuaca dan iklim yang digunakan dalam contoh di bab ini?",
        "choices": [
        "NOAA Global Forecast System",
        "ERA5",
        "WorldClim",
        "CHIRPS",
        "MERRA-2"
        ],
        "answer": "ERA5"
        },
        {
        "question": "Berapa jumlah kelas tutupan lahan yang digunakan dalam dataset ESA WorldCover?",
        "choices": [
        "5",
        "8",
        "11",
        "15",
        "20"
        ],
        "answer": "11"
        },
        {
        "question": "Apa tahun dasar yang digunakan dalam dataset Global Forest Change?",
        "choices": [
        "1990",
        "1995",
        "2000",
        "2005",
        "2010"
        ],
        "answer": "2000"
        },
        {
        "question": "Apa yang diukur oleh dataset Gridded Population of the World?",
        "choices": [
        "Kepadatan penduduk",
        "Pertumbuhan penduduk",
        "Migrasi penduduk",
        "Jumlah penduduk per sel grid",
        "Usia rata-rata penduduk"
        ],
        "answer": "Jumlah penduduk per sel grid"
        },
        {
        "question": "Apa singkatan dari DEM dalam konteks data elevasi?",
        "choices": [
        "Digital Elevation Method",
        "Digital Earth Model",
        "Digitized Elevation Map",
        "Digital Elevation Model",
        "Digital Earth Measurement"
        ],
        "answer": "Digital Elevation Model"
        },
        {
        "question": "Apa nama dataset DEM global yang digunakan dalam contoh di bab ini?",
        "choices": [
        "SRTM",
        "ASTER GDEM",
        "NASADEM",
        "TanDEM-X",
        "ALOS World 3D"
        ],
        "answer": "NASADEM"
        },
        {
        "question": "Apa fungsi dari Map.centerObject dalam Earth Engine?",
        "choices": [
        "Membuat objek baru di tengah peta",
        "Menghapus objek di tengah peta",
        "Memusatkan tampilan peta pada objek tertentu",
        "Mengukur jarak dari pusat ke objek",
        "Merotasi peta di sekitar objek pusat"
        ],
        "answer": "Memusatkan tampilan peta pada objek tertentu"
        },
        {
        "question": "Apa yang dilakukan oleh fungsi first() pada ImageCollection?",
        "choices": [
        "Menghapus gambar pertama",
        "Memindahkan gambar pertama ke akhir koleksi",
        "Mengembalikan gambar pertama dari koleksi",
        "Mengurutkan koleksi berdasarkan gambar pertama",
        "Menggabungkan semua gambar menjadi satu"
        ],
        "answer": "Mengembalikan gambar pertama dari koleksi"
        },
        {
        "question": "Apa yang dimaksud dengan 'palette' dalam parameter visualisasi Earth Engine?",
        "choices": [
        "Alat untuk melukis di atas gambar",
        "Daftar warna untuk menampilkan data",
        "Jenis sensor satelit",
        "Metode kompresi gambar",
        "Algoritma untuk meningkatkan kontras"
        ],
        "answer": "Daftar warna untuk menampilkan data"
        },
        {
        "question": "Apa unit pengukuran yang digunakan dalam dataset ERA5 untuk suhu udara?",
        "choices": [
        "Celsius",
        "Fahrenheit",
        "Kelvin",
        "Rankine",
        "Réaumur"
        ],
        "answer": "Kelvin"
        },
        {
        "question": "Berapa rentang tahun yang dicakup oleh dataset Global Forest Change yang dibahas dalam bab ini?",
        "choices": [
        "1990-2010",
        "1995-2015",
        "2000-2020",
        "2005-2025",
        "2010-2030"
        ],
        "answer": "2000-2020"
        },
        {
        "question": "Apa yang ditunjukkan oleh warna merah dalam visualisasi dataset Global Forest Change?",
        "choices": [
        "Area hutan yang tersisa",
        "Area yang terbakar",
        "Area dengan pertumbuhan hutan baru",
        "Area dengan kehilangan hutan yang lebih baru",
        "Area tanpa perubahan"
        ],
        "answer": "Area dengan kehilangan hutan yang lebih baru"
        }
];
})();