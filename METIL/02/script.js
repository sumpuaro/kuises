(function(){
  const quizId = "MeTil"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-16T15:30:00');
    const endTime = new Date('2024-10-16T16:00:00');

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
              score += 4.35;
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

  function endQuiz() {
      isQuizActive = false;
      document.getElementById('quiz-container').classList.add('hidden');
      document.getElementById('result-container').classList.remove('hidden');
      document.getElementById('score').textContent = score;

      let resultMessage = '';
      if (score >= 85) {
          resultMessage = 'Selamat! UTS Ini Nilai Anda "A".';
      } else {
          resultMessage = 'Sayang nilai anda belum mencapai nilai "A".';
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
          quizTitle: `${quizId} UTS`,
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
    "question": "Angin musim (monsoon) terjadi akibat:",
    "choices": [
      "Perbedaan tekanan udara antara dua kota",
      "Perbedaan pemanasan antara daratan dan lautan dalam skala besar",
      "Rotasi bumi",
      "Perbedaan ketinggian permukaan bumi"
    ],
    "answer": "Perbedaan pemanasan antara daratan dan lautan dalam skala besar"
  },
  {
    "question": "Alat yang digunakan untuk mengukur kecepatan angin adalah:",
    "choices": [
      "Barometer",
      "Anemometer",
      "Wind vane",
      "Higrometer"
    ],
    "answer": "Anemometer"
  },
  {
    "question": "Alat yang digunakan untuk menunjukkan arah angin adalah:",
    "choices": [
      "Barometer",
      "Anemometer",
      "Wind vane",
      "Higrometer"
    ],
    "answer": "Wind vane"
  },
  {
    "question": "Angin Fohn adalah:",
    "choices": [
      "Angin yang bertiup dari laut ke darat",
      "Angin yang terjadi setelah hujan orografis",
      "Angin yang bertiup dari gunung ke lembah",
      "Angin yang membawa debu"
    ],
    "answer": "Angin yang terjadi setelah hujan orografis"
  },
  {
    "question": "Peran angin bagi tumbuhan tidak termasuk:",
    "choices": [
      "Memindahkan panas dan uap air",
      "Meningkatkan fotosintesis secara langsung",
      "Meningkatkan transpirasi",
      "Menyebabkan kerusakan mekanik pada angin kencang"
    ],
    "answer": "Meningkatkan fotosintesis secara langsung"
  },
  {
    "question": "Windbreaker (pematah angin) berfungsi untuk:",
    "choices": [
      "Meningkatkan kecepatan angin",
      "Mengurangi kecepatan angin",
      "Meningkatkan suhu udara",
      "Mengurangi kelembaban udara"
    ],
    "answer": "Mengurangi kecepatan angin"
  },
  {
    "question": "Pengaruh pematah angin terhadap kelembaban udara adalah:",
    "choices": [
      "Menurunkan kelembaban udara di daerah terlindung",
      "Meningkatkan kelembaban udara di daerah terlindung",
      "Tidak mempengaruhi kelembaban udara",
      "Menghilangkan kelembaban udara sepenuhnya"
    ],
    "answer": "Meningkatkan kelembaban udara di daerah terlindung"
  },
  {
    "question": "Karakteristik struktural vegetasi yang dapat mempengaruhi kecepatan angin tidak termasuk:",
    "choices": [
      "Bentuk tajuk",
      "Penanaman",
      "Ukuran tanaman",
      "Warna daun"
    ],
    "answer": "Warna daun"
  },
  {
    "question": "Faktor yang menyebabkan perubahan tekanan udara secara termal adalah:",
    "choices": [
      "Gaya Coriolis",
      "Gaya gesek",
      "Pemanasan udara",
      "Rotasi bumi"
    ],
    "answer": "Pemanasan udara"
  },
  {
    "question": "Dalam sistem angin dunia, angin yang bertahan hanya beberapa menit termasuk dalam skala:",
    "choices": [
      "Makro",
      "Meso",
      "Mikro",
      "Nano"
    ],
    "answer": "Mikro"
  },
  {
    "question": "Menurut teori Hadley, udara di daerah ekuator cenderung:",
    "choices": [
      "Turun",
      "Naik",
      "Bergerak horizontal",
      "Tidak bergerak"
    ],
    "answer": "Naik"
  },
  {
    "question": "Angin yang bertiup dari lembah ke gunung pada siang hari disebut:",
    "choices": [
      "Angin lembah",
      "Angin gunung",
      "Angin darat",
      "Angin laut"
    ],
    "answer": "Angin lembah"
  },
  {
    "question": "Pengaruh pematah angin terhadap suhu udara adalah:",
    "choices": [
      "Meningkatkan suhu udara di daerah terlindung",
      "Menurunkan suhu udara di daerah terlindung",
      "Tidak mempengaruhi suhu udara",
      "Menyebabkan fluktuasi suhu yang ekstrem"
    ],
    "answer": "Menurunkan suhu udara di daerah terlindung"
  },
  {
    "question": "Perbedaan antara kecepatan angin di darat dan di laut disebabkan oleh:",
    "choices": [
      "Perbedaan suhu",
      "Perbedaan tekanan",
      "Perbedaan kekasaran permukaan",
      "Perbedaan kelembaban"
    ],
    "answer": "Perbedaan kekasaran permukaan"
  },
  {
    "question": "Apa yang dimaksud dengan kondensasi dalam pembentukan awan?",
    "choices": [
      "Perubahan uap air menjadi es",
      "Perubahan uap air menjadi air",
      "Perubahan air menjadi uap air",
      "Perubahan es menjadi air"
    ],
    "answer": "Perubahan uap air menjadi air"
  },
  {
    "question": "Apa nama awan yang berbentuk seperti kapas dan memiliki dasar yang rata?",
    "choices": [
      "Stratus",
      "Cirrus",
      "Cumulus",
      "Nimbus"
    ],
    "answer": "Cumulus"
  },
  {
    "question": "Jenis awan apa yang biasanya menghasilkan hujan deras dan badai petir?",
    "choices": [
      "Stratus",
      "Cirrus",
      "Cumulus",
      "Cumulonimbus"
    ],
    "answer": "Cumulonimbus"
  },
  {
    "question": "Apa yang dimaksud dengan titik embun?",
    "choices": [
      "Suhu di mana es mencair",
      "Suhu di mana air mendidih",
      "Suhu di mana udara menjadi jenuh dengan uap air",
      "Suhu di mana awan terbentuk"
    ],
    "answer": "Suhu di mana udara menjadi jenuh dengan uap air"
  },
  {
    "question": "Awan yang berbentuk lapisan tipis dan transparan di langit disebut:",
    "choices": [
      "Stratus",
      "Cirrus",
      "Cumulus",
      "Nimbus"
    ],
    "answer": "Cirrus"
  },
  {
    "question": "Proses apa yang terjadi ketika air berubah langsung menjadi uap air tanpa melalui fase cair?",
    "choices": [
      "Kondensasi",
      "Evaporasi",
      "Presipitasi",
      "Sublimasi"
    ],
    "answer": "Sublimasi"
  },
  {
    "question": "Awan yang terbentuk di ketinggian rendah dan sering menghasilkan gerimis adalah:",
    "choices": [
      "Cirrus",
      "Stratus",
      "Altostratus",
      "Cirrostratus"
    ],
    "answer": "Stratus"
  },
  {
    "question": "Apa yang dimaksud dengan kelembaban relatif?",
    "choices": [
      "Jumlah uap air di udara",
      "Perbandingan antara uap air aktual dan uap air maksimum yang dapat ditampung udara",
      "Jumlah air yang jatuh sebagai hujan",
      "Suhu udara"
    ],
    "answer": "Perbandingan antara uap air aktual dan uap air maksimum yang dapat ditampung udara"
  },
  {
    "question": "Jenis awan apa yang sering disebut sebagai \"awan badai\"?",
    "choices": [
      "Stratus",
      "Cirrus",
      "Cumulus",
      "Cumulonimbus"
    ],
    "answer": "Cumulonimbus"
  }
];
})();