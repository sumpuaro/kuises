(function(){
  const quizId = "UTS PSi"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-25T13:30:00');
    const endTime = new Date('2024-10-25T14:00:00');

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
          if (confirm('Anda sudah mengakses UTS ini sebelumnya. Apakah Anda ingin mencoba lagi? Ini akan menghapus akses sebelumnya.')) {
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
              alert("Mohon tetap dalam mode fullscreen selama UTS berlangsung.");
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
      let timeLeft = 90;
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
      if (score >= 85) {
          resultMessage = 'Selamat! Nilai Sangat Memuaskan .';
      } else {
          resultMessage = 'Jangan Rebahan, Ayo Belajar Lebih Serius....!';
      }
      document.getElementById('result-message').textContent = resultMessage;

      sendResultToGoogleSheet(userData.fullname, userData.nim, score);

      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
  }

  function sendResultToGoogleSheet(fullName, nim, score) {
      const webAppUrl = 'https://script.google.com/macros/s/AKfycby4xjL41-5FmkWRwa_8F49VxPDMk7PqBnQuxhaAcbosUzm2-772RfNWdmjdhknrJnIe/exec';
      const now = new Date();
      const date = now.toLocaleDateString('id-ID');
      const time = now.toLocaleTimeString('id-ID');

      const data = {
          fullName: fullName,
          nim: nim,
          score: score,
          quizTitle: `${quizId}`,
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

  // Prevent inspect element using key shortcuts
  document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U') || e.keyCode == 123) {
          e.preventDefault();
          return false;
      }
  });

    // Quiz questions
    questions = [
        {
            "question": "What does the term 'recruitment' refer to in fish population dynamics?",
            "choices": [
                "Tingkat kematian alami ikan",
                "Penambahan ikan baru ke dalam stok yang dapat dieksploitasi",
                "Tingkat mortalitas akibat penangkapan ikan",
                "Laju pertumbuhan ikan"
            ],
            "answer": "Penambahan ikan baru ke dalam stok yang dapat dieksploitasi"
        },
        {
            "question": "Persamaan mana yang mewakili ukuran populasi pada langkah waktu berikutnya dalam penilaian stok?",
            "choices": [
                "Bt+1 = Bt + G − F",
                "Bt+1 = Bt + R + G − M − F",
                "Bt+1 = G + M − F",
                "Bt+1 = Bt + M − R + G"
            ],
            "answer": "Bt+1 = Bt + R + G − M − F"
        },
        {
            "question": "Apa yang dimaksud dengan 'F' dalam model dinamika populasi?",
            "choices": [
                "Pertumbuhan akibat penangkapan",
                "Mortalitas akibat penangkapan",
                "Rekrutmen ikan",
                "Stok ikan"
            ],
            "answer": "Mortalitas akibat penangkapan"
        },
        {
            "question": "Which of the following best describes density-dependent mortality?",
            "choices": [
                "Mortalitas yang disebabkan oleh kondisi lingkungan ekstrim",
                "Mortalitas yang berkaitan dengan ukuran populasi dan kompetisi",
                "Mortalitas yang tidak terkait dengan kepadatan populasi",
                "Mortalitas akibat usaha penangkapan ikan"
            ],
            "answer": "Mortalitas yang berkaitan dengan ukuran populasi dan kompetisi"
        },
        {
            "question": "Model rekrutmen mana yang mengasumsikan bahwa semua ikan dari kelas umur tertentu sama mudah tertangkap selama minimal dua tahun?",
            "choices": [
                "Rekrutmen kontinu",
                "Rekrutmen platoon",
                "Rekrutmen ujung pisau",
                "Model Beverton-Holt"
            ],
            "answer": "Rekrutmen ujung pisau"
        },
        {
            "question": "Apa itu Maximum Sustainable Yield (MSY)?",
            "choices": [
                "Jumlah ikan yang ditangkap yang menyebabkan populasi kolaps",
                "Hasil tangkapan terbesar yang dapat diambil secara terus-menerus tanpa mengurangi stok",
                "Hasil tangkapan minimum yang diperlukan untuk menjaga populasi ikan",
                "Titik di mana mortalitas akibat penangkapan melebihi rekrutmen"
            ],
            "answer": "Hasil tangkapan terbesar yang dapat diambil secara terus-menerus tanpa mengurangi stok"
        },
        {
            "question": "Faktor mana yang TIDAK diperhitungkan dalam perhitungan biomassa dalam dinamika populasi?",
            "choices": [
                "Pertumbuhan",
                "Rekrutmen",
                "Mortalitas",
                "Suhu air"
            ],
            "answer": "Suhu air"
        },
        {
            "question": "Apa yang dijelaskan oleh model Beverton-Holt terkait stok ikan?",
            "choices": [
                "Hubungan antara ukuran stok dan mortalitas akibat penangkapan",
                "Hubungan antara rekrutmen dan ukuran stok dewasa",
                "Dampak alat tangkap terhadap biomassa stok",
                "Hubungan antara pertumbuhan ikan dan rekrutmen"
            ],
            "answer": "Hubungan antara rekrutmen dan ukuran stok dewasa"
        },
        {
            "question": "Dalam konteks dinamika populasi ikan, apa yang dimaksud dengan 'mortalitas alami' (M)?",
            "choices": [
                "Kematian yang disebabkan oleh aktivitas manusia",
                "Kematian akibat pemangsaan, penyakit, atau usia tua",
                "Kematian akibat bencana lingkungan",
                "Kematian karena kegiatan penangkapan"
            ],
            "answer": "Kematian akibat pemangsaan, penyakit, atau usia tua"
        },
        {
            "question": "Ketika persamaan G + R < M + F benar, apa status stok ikan tersebut?",
            "choices": [
                "Populasi meningkat",
                "Populasi stabil",
                "Populasi menurun",
                "Populasi pada Maximum Sustainable Yield"
            ],
            "answer": "Populasi menurun"
        },
        {
            "question": "What is the main influence of environmental conditions on fish population dynamics?",
            "choices": [
                "Fish species diversity",
                "Fish migration patterns",
                "Environmental parameters like temperature, salinity, and pH",
                "The type of fishing gear used"
            ],
            "answer": "Environmental parameters like temperature, salinity, and pH"
        },
        {
            "question": "Bagaimana kemajuan teknologi mempengaruhi hubungan antara manusia dan ikan?",
            "choices": [
                "Mempercepat tingkat mortalitas alami",
                "Meningkatkan kontak antara manusia dan ikan melalui alat tangkap modern",
                "Mengurangi tingkat eksploitasi ikan",
                "Tidak mempengaruhi hubungan sama sekali"
            ],
            "answer": "Meningkatkan kontak antara manusia dan ikan melalui alat tangkap modern"
        },
        {
            "question": "Which of the following is NOT part of the abiotic environment in fish population dynamics?",
            "choices": [
                "Temperature",
                "Predation",
                "Salinity",
                "Ocean currents"
            ],
            "answer": "Predation"
        },
        {
            "question": "Lingkungan biotik mencakup faktor apa saja?",
            "choices": [
                "Kondisi cuaca dan suhu",
                "Hubungan fungsional antar makhluk hidup dalam komunitas",
                "Arus laut dan kedalaman air",
                "Tekstur dan struktur tanah"
            ],
            "answer": "Hubungan fungsional antar makhluk hidup dalam komunitas"
        },
        {
            "question": "What is an example of a density-dependent factor that affects fish populations?",
            "choices": [
                "Temperature fluctuations",
                "Fishing activities",
                "Competition for resources like food and space",
                "Ocean acidification"
            ],
            "answer": "Competition for resources like food and space"
        },
        {
            "question": "Bagaimana pola migrasi ikan dapat dipengaruhi oleh lingkungan fisik?",
            "choices": [
                "Ikan bermigrasi untuk menghindari predator alami",
                "Ikan bermigrasi berdasarkan suhu air dan salinitas",
                "Ikan hanya bermigrasi saat musim pemijahan",
                "Ikan bermigrasi untuk mengikuti kapal penangkap ikan"
            ],
            "answer": "Ikan bermigrasi berdasarkan suhu air dan salinitas"
        },
        {
            "question": "Which model describes fish stock as a 'black box,' focusing on inputs and outputs such as recruitment, growth, and mortality?",
            "choices": [
                "The Beverton-Holt model",
                "The Ricker model",
                "The black box model",
                "The Schaefer model"
            ],
            "answer": "The black box model"
        },
        {
            "question": "Apa yang menjadi fokus utama kajian ekologi dalam dinamika populasi?",
            "choices": [
                "Memahami hubungan antara populasi ikan dengan alat tangkap",
                "Mempelajari interaksi antara populasi ikan dengan ekosistemnya",
                "Mengukur jumlah spesies yang terancam punah",
                "Menentukan nilai ekonomi ikan bagi manusia"
            ],
            "answer": "Mempelajari interaksi antara populasi ikan dengan ekosistemnya"
        },
        {
            "question": "What is the primary goal of using population models in fish ecology?",
            "choices": [
                "To explain and predict population development",
                "To measure the environmental impact of fishing",
                "To track migration routes of fish",
                "To estimate the market value of fish stocks"
            ],
            "answer": "To explain and predict population development"
        },
        {
            "question": "Bagaimana kondisi lingkungan dapat mempengaruhi penyebaran spesies ikan seperti tuna?",
            "choices": [
                "Suhu air yang konstan tidak mempengaruhi penyebaran",
                "Spesies ikan seperti tuna mengelompok di daerah dengan kisaran suhu yang sempit",
                "Tuna menyebar secara merata di semua perairan laut",
                "Penyebaran tuna tidak terkait dengan suhu air"
            ],
            "answer": "Spesies ikan seperti tuna mengelompok di daerah dengan kisaran suhu yang sempit"
        }
    ];
})();