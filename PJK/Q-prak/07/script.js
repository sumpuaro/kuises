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
    const startTime = new Date('2024-10-09T13:05:00');
    const endTime = new Date('2024-10-09T13:20:00');

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
        "question": "Apa tujuan utama dari penilaian akurasi (accuracy assessment) dalam klasifikasi citra penginderaan jauh?",
        "choices": [
          "Meningkatkan kecepatan pemrosesan citra",
          "Mengukur sejauh mana klasifikasi sesuai dengan data ground-truth",
          "Mengurangi ukuran file citra",
          "Meningkatkan resolusi spasial citra",
          "Mengubah format citra"
        ],
        "answer": "Mengukur sejauh mana klasifikasi sesuai dengan data ground-truth"
      },
      {
        "question": "Apa nama matriks yang digunakan untuk merangkum metrik akurasi utama dalam penilaian akurasi?",
        "choices": [
          "Matriks korelasi",
          "Matriks kovarians",
          "Matriks konfusi",
          "Matriks transformasi",
          "Matriks identitas"
        ],
        "answer": "Matriks konfusi"
      },
      {
        "question": "Dalam matriks konfusi biner, apa yang dimaksud dengan 'True Positive' (TP)?",
        "choices": [
          "Piksel yang salah diklasifikasikan sebagai kelas positif",
          "Piksel yang benar diklasifikasikan sebagai kelas positif",
          "Piksel yang salah diklasifikasikan sebagai kelas negatif",
          "Piksel yang benar diklasifikasikan sebagai kelas negatif",
          "Total piksel dalam citra"
        ],
        "answer": "Piksel yang benar diklasifikasikan sebagai kelas positif"
      },
      {
        "question": "Bagaimana cara menghitung overall accuracy dari matriks konfusi?",
        "choices": [
          "Jumlah piksel yang benar diklasifikasikan dibagi total piksel",
          "Jumlah piksel yang salah diklasifikasikan dibagi total piksel",
          "Rata-rata akurasi semua kelas",
          "Nilai tertinggi dari akurasi semua kelas",
          "Selisih antara akurasi tertinggi dan terendah"
        ],
        "answer": "Jumlah piksel yang benar diklasifikasikan dibagi total piksel"
      },
      {
        "question": "Apa yang dimaksud dengan 'producer's accuracy' dalam konteks penilaian akurasi?",
        "choices": [
          "Akurasi dari sudut pandang pengguna peta",
          "Akurasi dari sudut pandang pembuat peta",
          "Akurasi keseluruhan klasifikasi",
          "Akurasi rata-rata semua kelas",
          "Akurasi piksel yang tidak terklasifikasi"
        ],
        "answer": "Akurasi dari sudut pandang pembuat peta"
      },
      {
        "question": "Bagaimana cara menghitung 'user's accuracy' untuk suatu kelas?",
        "choices": [
          "Jumlah piksel yang benar dalam kelas tersebut dibagi total piksel aktual dalam kelas tersebut",
          "Jumlah piksel yang benar dalam kelas tersebut dibagi total piksel yang diklasifikasikan sebagai kelas tersebut",
          "Total piksel dalam citra dibagi jumlah kelas",
          "Jumlah piksel yang salah klasifikasi dibagi total piksel",
          "Jumlah total piksel dikurangi piksel yang benar klasifikasi"
        ],
        "answer": "Jumlah piksel yang benar dalam kelas tersebut dibagi total piksel yang diklasifikasikan sebagai kelas tersebut"
      },
      {
        "question": "Apa yang dimaksud dengan 'omission error' dalam penilaian akurasi?",
        "choices": [
          "Piksel yang salah dimasukkan ke dalam suatu kelas",
          "Piksel yang seharusnya masuk dalam suatu kelas tetapi tidak terklasifikasi",
          "Piksel yang tidak terklasifikasi sama sekali",
          "Piksel yang benar diklasifikasikan",
          "Total error dalam klasifikasi"
        ],
        "answer": "Piksel yang seharusnya masuk dalam suatu kelas tetapi tidak terklasifikasi"
      },
      {
        "question": "Apa hubungan antara 'producer's accuracy' dan 'omission error'?",
        "choices": [
          "Keduanya adalah istilah yang sama",
          "Producer's accuracy = 100% - Omission error",
          "Producer's accuracy = Omission error",
          "Tidak ada hubungan antara keduanya",
          "Producer's accuracy = 100% + Omission error"
        ],
        "answer": "Producer's accuracy = 100% - Omission error"
      },
      {
        "question": "Apa fungsi dari koefisien Kappa dalam penilaian akurasi?",
        "choices": [
          "Mengukur tingkat kesalahan klasifikasi",
          "Mengevaluasi seberapa baik klasifikasi dibandingkan dengan klasifikasi acak",
          "Menghitung jumlah total kelas dalam klasifikasi",
          "Mengukur akurasi geometrik citra",
          "Menentukan jumlah sampel yang diperlukan untuk klasifikasi"
        ],
        "answer": "Mengevaluasi seberapa baik klasifikasi dibandingkan dengan klasifikasi acak"
      },
      {
        "question": "Rentang nilai berapakah yang mungkin untuk koefisien Kappa?",
        "choices": [
          "0 sampai 1",
          "-1 sampai 1",
          "0 sampai 100",
          "-100 sampai 100",
          "Tidak ada batasan nilai"
        ],
        "answer": "-1 sampai 1"
      },
      {
        "question": "Apa yang dimaksud dengan 'hyperparameter tuning' dalam konteks klasifikasi Random Forest?",
        "choices": [
          "Meningkatkan kecepatan komputasi",
          "Mengoptimalkan parameter model untuk meningkatkan performa",
          "Menambah jumlah band spektral yang digunakan",
          "Mengurangi ukuran citra",
          "Mengubah sistem proyeksi citra"
        ],
        "answer": "Mengoptimalkan parameter model untuk meningkatkan performa"
      },
      {
        "question": "Dalam Random Forest, parameter apa yang umumnya di-tune untuk meningkatkan akurasi?",
        "choices": [
          "Jumlah piksel dalam citra",
          "Jumlah band spektral",
          "Jumlah pohon (trees) dalam forest",
          "Resolusi spasial citra",
          "Jumlah kelas dalam klasifikasi"
        ],
        "answer": "Jumlah pohon (trees) dalam forest"
      },
      {
        "question": "Apa yang dimaksud dengan 'spatial autocorrelation' dalam konteks sampling untuk klasifikasi?",
        "choices": [
          "Korelasi antara band spektral yang berbeda",
          "Korelasi antara nilai piksel yang berdekatan secara spasial",
          "Korelasi antara akurasi dan jumlah sampel",
          "Korelasi antara ukuran citra dan akurasi klasifikasi",
          "Korelasi antara producer's accuracy dan user's accuracy"
        ],
        "answer": "Korelasi antara nilai piksel yang berdekatan secara spasial"
      },
      {
        "question": "Mengapa penting untuk mempertimbangkan spatial autocorrelation dalam pemilihan sampel?",
        "choices": [
          "Untuk meningkatkan kecepatan klasifikasi",
          "Untuk mengurangi ukuran file",
          "Untuk menghindari bias dalam penilaian akurasi",
          "Untuk meningkatkan resolusi spasial",
          "Untuk menambah jumlah kelas dalam klasifikasi"
        ],
        "answer": "Untuk menghindari bias dalam penilaian akurasi"
      },
      {
        "question": "Apa metode yang digunakan dalam Earth Engine untuk menghindari sampel yang berkorelasi spasial?",
        "choices": [
          "Spatial join",
          "Spectral unmixing",
          "Principal Component Analysis",
          "Iterative Self-Organizing Data Analysis Technique",
          "Maximum Likelihood Classification"
        ],
        "answer": "Spatial join"
      },
      {
        "question": "Dalam konteks machine learning untuk klasifikasi citra, apa yang dimaksud dengan 'training set'?",
        "choices": [
          "Seluruh citra yang akan diklasifikasi",
          "Sampel data dengan label kelas yang diketahui untuk melatih model",
          "Sampel data untuk menguji akurasi model",
          "Kumpulan semua band spektral dalam citra",
          "Set aturan untuk menentukan kelas"
        ],
        "answer": "Sampel data dengan label kelas yang diketahui untuk melatih model"
      },
      {
        "question": "Apa fungsi dari 'testing set' dalam proses klasifikasi dan penilaian akurasi?",
        "choices": [
          "Untuk melatih model klasifikasi",
          "Untuk menguji performa model pada data yang belum pernah dilihat",
          "Untuk menentukan jumlah kelas dalam klasifikasi",
          "Untuk mengubah resolusi spasial citra",
          "Untuk menghitung indeks vegetasi"
        ],
        "answer": "Untuk menguji performa model pada data yang belum pernah dilihat"
      },
      {
        "question": "Apa yang dimaksud dengan 'overfitting' dalam konteks klasifikasi citra?",
        "choices": [
          "Model terlalu sederhana untuk menangkap kompleksitas data",
          "Model terlalu kompleks dan terlalu sesuai dengan noise dalam data training",
          "Klasifikasi menghasilkan terlalu banyak kelas",
          "Penggunaan terlalu banyak band spektral",
          "Proses klasifikasi yang terlalu lama"
        ],
        "answer": "Model terlalu kompleks dan terlalu sesuai dengan noise dalam data training"
      },
      {
        "question": "Apa keuntungan menggunakan Random Forest dibandingkan dengan decision tree tunggal untuk klasifikasi?",
        "choices": [
          "Random Forest selalu lebih cepat",
          "Random Forest menggunakan lebih sedikit memori",
          "Random Forest lebih tahan terhadap overfitting",
          "Random Forest tidak memerlukan data training",
          "Random Forest hanya bisa digunakan untuk klasifikasi biner"
        ],
        "answer": "Random Forest lebih tahan terhadap overfitting"
      },
      {
        "question": "Dalam Earth Engine, apa metode yang digunakan untuk membuat matriks konfusi?",
        "choices": [
          "errorMatrix()",
          "confusionMatrix()",
          "accuracyAssessment()",
          "classificationQuality()",
          "matrixGenerator()"
        ],
        "answer": "errorMatrix()"
      }
    ];
})();