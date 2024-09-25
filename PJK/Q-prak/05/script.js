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
    const startTime = new Date('2024-09-25T08:10:00');
    const endTime = new Date('2024-09-25T08:30:00');

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
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbyPhMU3DXeOPrApuM7oK2E2EowbnJiRyZeW3IC2HEiyvSAo1vhx6Co29hFj6CIPii54AA/exec';
      const now = new Date();
      const date = now.toLocaleDateString('id-ID');
      const time = now.toLocaleTimeString('id-ID');

      const data = {
          fullName: fullName,
          nim: nim,
          score: score,
          quizTitle: `${quizId} Praktikum PJK`,
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
        "question": "Apa yang dimaksud dengan spektral indeks dalam konteks penginderaan jauh?",
        "choices": [
          "Jumlah band dalam citra satelit", 
          "Nilai yang mengekspresikan bagaimana objek memantulkan cahaya di berbagai spektrum",
          "Resolusi spasial citra",
          "Waktu pengambilan citra",
          "Jumlah satelit yang digunakan"
        ],
        "answer": "Nilai yang mengekspresikan bagaimana objek memantulkan cahaya di berbagai spektrum"
      },
      {
        "question": "Rumus untuk menghitung NDVI (Normalized Difference Vegetation Index) adalah:",
        "choices": [
          "(NIR + Red) / (NIR - Red)",
          "(NIR - Red) / (NIR + Red)",
          "Red / NIR",
          "NIR / Red",
          "(Red - NIR) / (Red + NIR)"
        ],
        "answer": "(NIR - Red) / (NIR + Red)"
      },
      {
        "question": "Rentang nilai NDVI adalah:",
        "choices": [
          "0 sampai 1",
          "-1 sampai 0",
          "-1 sampai 1",
          "0 sampai 100",
          "-100 sampai 100"
        ],
        "answer": "-1 sampai 1"
      },
      {
        "question": "Metode apa yang digunakan di Earth Engine untuk melakukan operasi normalisasi perbedaan dalam satu langkah?",
        "choices": [
          "normalizedDifference()",
          "normDiff()",
          "ndCalc()",
          "diffNorm()",
          "calcNormalizedDiff()"
        ],
        "answer": "normalizedDifference()"
      },
      {
        "question": "NDWI (Normalized Difference Water Index) menggunakan band:",
        "choices": [
          "NIR dan Red",
          "NIR dan SWIR",
          "Red dan Blue",
          "Green dan Red",
          "Blue dan NIR"
        ],
        "answer": "NIR dan SWIR"
      },
      {
        "question": "Apa fungsi dari metode 'gt()' dalam Earth Engine?",
        "choices": [
          "Menambahkan dua band",
          "Membagi dua band",
          "Mengurangi dua band",
          "Melakukan tes apakah nilai lebih besar dari threshold",
          "Mengalikan dua band"
        ],
        "answer": "Melakukan tes apakah nilai lebih besar dari threshold"
      },
      {
        "question": "Metode apa yang digunakan untuk menerapkan kondisional logika pada citra di Earth Engine?",
        "choices": [
          "if()",
          "where()",
          "condition()",
          "when()",
          "ifThen()"
        ],
        "answer": "where()"
      },
      {
        "question": "Apa fungsi dari metode 'mask()' di Earth Engine?",
        "choices": [
          "Membuat citra baru",
          "Menggabungkan dua citra",
          "Memisahkan band citra",
          "Menghapus area tertentu dari citra",
          "Mengubah proyeksi citra"
        ],
        "answer": "Menghapus area tertentu dari citra"
      },
      {
        "question": "Metode apa yang digunakan untuk mengubah nilai spesifik dalam citra di Earth Engine?",
        "choices": [
          "change()",
          "modify()",
          "remap()",
          "alter()",
          "transform()"
        ],
        "answer": "remap()"
      },
      {
        "question": "Apa yang dimaksud dengan 'band arithmetic' di Earth Engine?",
        "choices": [
          "Menghitung jumlah band dalam citra",
          "Proses menambah, mengurangi, mengalikan, atau membagi dua atau lebih band",
          "Mengubah urutan band dalam citra",
          "Menghapus band dari citra",
          "Menambahkan band baru ke citra"
        ],
        "answer": "Proses menambah, mengurangi, mengalikan, atau membagi dua atau lebih band"
      },
      {
        "question": "Apa kegunaan dari Clay Minerals Ratio (CMR)?",
        "choices": [
          "Mendeteksi vegetasi",
          "Menyoroti tanah yang mengandung lempung dan alunit",
          "Mengukur kelembaban tanah",
          "Mendeteksi badan air",
          "Mengidentifikasi daerah perkotaan"
        ],
        "answer": "Menyoroti tanah yang mengandung lempung dan alunit"
      },
      {
        "question": "Rumus untuk Iron Oxide Ratio adalah:",
        "choices": [
          "Red / Blue",
          "NIR / Red",
          "SWIR / NIR",
          "Blue / Red",
          "Green / Red"
        ],
        "answer": "Red / Blue"
      },
      {
        "question": "Apa tujuan dari Normalized Difference Built-Up Index (NDBI)?",
        "choices": [
          "Mendeteksi vegetasi",
          "Mengidentifikasi badan air",
          "Membedakan daerah perkotaan dari tipe tutupan lahan lainnya",
          "Mengukur kelembaban tanah",
          "Mendeteksi kebakaran hutan"
        ],
        "answer": "Membedakan daerah perkotaan dari tipe tutupan lahan lainnya"
      },
      {
        "question": "Metode JavaScript apa yang digunakan untuk membalik urutan item dalam daftar?",
        "choices": [
          "flip()",
          "inverse()",
          "reverse()",
          "rotate()",
          "switchOrder()"
        ],
        "answer": "reverse()"
      },
      {
        "question": "Dalam konteks Earth Engine, apa yang dimaksud dengan 'thresholding'?",
        "choices": [
          "Menggabungkan beberapa citra",
          "Membagi variabilitas citra menjadi kategori menggunakan nilai ambang batas",
          "Mengubah resolusi citra",
          "Menghapus noise dari citra",
          "Mengubah proyeksi citra"
        ],
        "answer": "Membagi variabilitas citra menjadi kategori menggunakan nilai ambang batas"
      },
      {
        "question": "Apa yang terjadi pada piksel dengan nilai 0 setelah menggunakan metode updateMask()?",
        "choices": [
          "Nilainya berubah menjadi 1",
          "Nilainya tetap 0",
          "Piksel tersebut menjadi termasked (tidak muncul)",
          "Nilainya berubah menjadi null",
          "Piksel tersebut menjadi putih"
        ],
        "answer": "Piksel tersebut menjadi termasked (tidak muncul)"
      },
      {
        "question": "Apa kegunaan dari metode clip() dalam Earth Engine?",
        "choices": [
          "Memotong citra berdasarkan geometri tertentu",
          "Menggabungkan dua citra",
          "Mengubah resolusi citra",
          "Menghapus band tertentu dari citra",
          "Mengubah proyeksi citra"
        ],
        "answer": "Memotong citra berdasarkan geometri tertentu"
      },
      {
        "question": "Dalam Earth Engine, metode apa yang digunakan untuk memilih band tertentu dari citra?",
        "choices": [
          "chooseBand()",
          "getBand()",
          "selectBand()",
          "select()",
          "pickBand()"
        ],
        "answer": "select()"
      },
      {
        "question": "Apa yang dimaksud dengan 'palette' dalam konteks visualisasi citra di Earth Engine?",
        "choices": [
          "Jumlah band dalam citra",
          "Resolusi spasial citra",
          "Skema warna yang digunakan untuk menampilkan citra",
          "Proyeksi citra",
          "Metadata citra"
        ],
        "answer": "Skema warna yang digunakan untuk menampilkan citra"
      },
      {
        "question": "Metode apa yang digunakan untuk menghitung rata-rata nilai piksel dalam region tertentu di Earth Engine?",
        "choices": [
          "mean()",
          "average()",
          "reduceRegion()",
          "calculateMean()",
          "regionAverage()"
        ],
        "answer": "reduceRegion()"
      }
    ];
})();