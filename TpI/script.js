(function(){
  const quizId = "BAPI"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-14T12:00:00');
    const endTime = new Date('2024-10-08T12:30:00');

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
              score += 3.5;
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
    "question": "Manakah di antara berikut ini yang merupakan kelebihan serat sintetis dibandingkan serat alami dalam pembuatan alat penangkapan ikan?",
    "choices": [
      "Mudah membusuk",
      "Tahan lama terhadap air laut",
      "Tidak tahan gesekan",
      "Menyerap air dengan baik",
      "Mudah terurai oleh sinar UV"
    ],
    "answer": "Tahan lama terhadap air laut"
  },
  {
    "question": "Which of the following materials is most suitable for making trawling nets that require high tensile strength?",
    "choices": [
      "Wool",
      "Cotton",
      "Polyamide (Nylon)",
      "Hemp",
      "Silk"
    ],
    "answer": "Polyamide (Nylon)"
  },
  {
    "question": "Apa keuntungan utama menggunakan serat sintetis seperti Polyethylene dalam pembuatan jaring insang?",
    "choices": [
      "Harga murah",
      "Kemampuan menyerap air yang tinggi",
      "Kekuatan tarik yang rendah",
      "Elastisitas yang buruk",
      "Ketahanan terhadap sinar UV"
    ],
    "answer": "Ketahanan terhadap sinar UV"
  },
  {
    "question": "Why is it important to select a material with high elongation for fishing nets?",
    "choices": [
      "It prevents the net from sinking too fast",
      "It increases the net’s ability to withstand tension",
      "It reduces the net’s durability in saltwater",
      "It helps the net absorb more water",
      "It makes the net lighter"
    ],
    "answer": "It increases the net’s ability to withstand tension"
  },
  {
    "question": "Manakah di antara bahan berikut ini yang paling tidak cocok untuk pukat cincin?",
    "choices": [
      "Polyethylene",
      "Polypropylene",
      "Polyester",
      "Abaca fiber",
      "Polyamide (Nylon)"
    ],
    "answer": "Abaca fiber"
  },
  {
    "question": "Which of the following characteristics is NOT desirable in fishing gear made from synthetic fibers?",
    "choices": [
      "Resistance to water absorption",
      "High durability",
      "Low specific gravity",
      "Easily degradable by microorganisms",
      "Proper flexibility"
    ],
    "answer": "Easily degradable by microorganisms"
  },
  {
    "question": "Mengapa serat alami seperti kapas tidak dianjurkan dalam pembuatan jaring pukat?",
    "choices": [
      "Kekuatan tarik yang tinggi",
      "Mudah menyerap air dan cepat membusuk",
      "Tidak tersedia di pasaran",
      "Berat jenis yang rendah",
      "Elastisitas tinggi"
    ],
    "answer": "Mudah menyerap air dan cepat membusuk"
  },
  {
    "question": "Which of the following is the main advantage of using monofilament nylon for gillnets?",
    "choices": [
      "Low water retention",
      "High elasticity",
      "Absorbs water",
      "Low tensile strength",
      "High specific gravity"
    ],
    "answer": "Low water retention"
  },
  {
    "question": "Faktor apa yang paling mempengaruhi kecepatan tenggelam jaring pada pukat cincin?",
    "choices": [
      "Elastisitas bahan",
      "Berat jenis bahan",
      "Kekuatan bahan",
      "Warna serat",
      "Ukuran simpul"
    ],
    "answer": "Berat jenis bahan"
  },
  {
    "question": "Which of the following natural fibers is most suitable for making ropes used in traditional fishing gear?",
    "choices": [
      "Wool",
      "Cotton",
      "Hemp",
      "Polyester",
      "Polyethylene"
    ],
    "answer": "Hemp"
  },
  {
    "question": "Apa kelebihan utama serat sintetis dibandingkan serat alami dalam penggunaannya pada alat tangkap ikan?",
    "choices": [
      "Menyerap air lebih banyak",
      "Lebih mudah diproduksi",
      "Lebih tahan lama terhadap pembusukan",
      "Harga lebih murah",
      "Tidak memerlukan perlakuan khusus"
    ],
    "answer": "Lebih tahan lama terhadap pembusukan"
  },
  {
    "question": "Why are synthetic fibers preferred for making pelagic trawl nets?",
    "choices": [
      "They float easily",
      "They have higher tensile strength and flexibility",
      "They degrade quickly in seawater",
      "They are inexpensive and easy to dispose of",
      "They absorb more water"
    ],
    "answer": "They have higher tensile strength and flexibility"
  },
  {
    "question": "Serat buatan apa yang memiliki daya apung tinggi dan cocok untuk digunakan sebagai bahan pelampung?",
    "choices": [
      "Polyester",
      "Polyethylene",
      "Polypropylene",
      "Cotton",
      "Abaca"
    ],
    "answer": "Polypropylene"
  },
  {
    "question": "Which of the following is a key characteristic of synthetic fibers used in fishing gear that reduces the risk of gear failure in harsh marine environments?",
    "choices": [
      "High water absorption",
      "Low resistance to UV light",
      "High tensile strength",
      "High biodegradability",
      "Low flexibility"
    ],
    "answer": "High tensile strength"
  },
  {
    "question": "Apa pertimbangan utama dalam memilih bahan untuk jaring insang hanyut tenggiri?",
    "choices": [
      "Kekuatan bahan",
      "Harga bahan",
      "Ketersediaan bahan",
      "Warna bahan",
      "Elastisitas bahan"
    ],
    "answer": "Kekuatan bahan"
  },
  {
    "question": "Which of the following is an advantage of using synthetic fibers like Polypropylene in making fishing gear?",
    "choices": [
      "High water retention",
      "Easy to degrade in seawater",
      "Lightweight and strong",
      "High UV absorption",
      "Expensive to produce"
    ],
    "answer": "Lightweight and strong"
  },
  {
    "question": "Mengapa bahan Polyamide (Nylon) banyak digunakan dalam pembuatan jaring insang?",
    "choices": [
      "Mudah didaur ulang",
      "Tahan terhadap sinar UV",
      "Memiliki kekuatan tarik yang tinggi",
      "Memiliki harga yang lebih murah",
      "Tahan terhadap gesekan"
    ],
    "answer": "Memiliki kekuatan tarik yang tinggi"
  },
  {
    "question": "Which of the following synthetic fibers would be least affected by ultraviolet radiation in outdoor conditions?",
    "choices": [
      "Polyester",
      "Cotton",
      "Wool",
      "Hemp",
      "Asbestos"
    ],
    "answer": "Polyester"
  },
  {
    "question": "Apa karakteristik utama yang diinginkan pada pemberat alat tangkap ikan?",
    "choices": [
      "Tahan terhadap pembusukan",
      "Daya tenggelam yang besar",
      "Berat jenis yang rendah",
      "Elastisitas tinggi",
      "Menyerap air"
    ],
    "answer": "Daya tenggelam yang besar"
  },
  {
    "question": "Which of the following fibers is most likely to retain its flexibility and strength in both saltwater and freshwater environments?",
    "choices": [
      "Wool",
      "Cotton",
      "Polyester",
      "Abaca",
      "Polypropylene"
    ],
    "answer": "Polypropylene"
  },
  {
    "question": "Manakah di antara berikut ini yang merupakan contoh alat tangkap tradisional yang sering menggunakan serat alami seperti rami sebagai bahannya?",
    "choices": [
      "Pukat cincin",
      "Jaring insang",
      "Jala lempar",
      "Pancing tonda",
      "Alat tangkap listrik"
    ],
    "answer": "Jala lempar"
  },
  {
    "question": "Which natural fiber is commonly used in the construction of traditional fishing lines and nets in small-scale fisheries?",
    "choices": [
      "Polyester",
      "Cotton",
      "Hemp",
      "Polyamide",
      "Polypropylene"
    ],
    "answer": "Hemp"
  },
  {
    "question": "Alat tangkap ikan manakah yang pada umumnya menggunakan bahan dari serat alami seperti kapas untuk tali-temali dalam penggunaannya?",
    "choices": [
      "Trammel net",
      "Longline",
      "Pukat udang",
      "Jaring apung",
      "Bubu"
    ],
    "answer": "Longline"
  },
  {
    "question": "Which fishing gear has historically been made from natural fibers like cotton, and is still used in some traditional fishing communities today?",
    "choices": [
      "Purse seine",
      "Drift net",
      "Cast net",
      "Fish trap",
      "Trawling net"
    ],
    "answer": "Cast net"
  },
{
    "question": "Manakah bahan serat alami berikut ini yang paling cocok digunakan untuk membuat tali pada alat tangkap ikan tradisional seperti bubu dan jala?",
    "choices": [
      "Kapas",
      "Sutera",
      "Rami",
      "Asbes",
      "Ijuk"
    ],
    "answer": "Rami"
  },
  {
    "question": "Which natural fiber is suitable for constructing rope used in traditional fish traps (bubu) due to its strength and durability?",
    "choices": [
      "Wool",
      "Silk",
      "Hemp",
      "Jute",
      "Polyester"
    ],
    "answer": "Hemp"
  },
  {
    "question": "Mengapa serat alami seperti ijuk tidak lagi banyak digunakan dalam pembuatan alat tangkap ikan modern?",
    "choices": [
      "Harga yang murah",
      "Mudah terurai dan tidak tahan lama",
      "Sangat ringan dan kuat",
      "Tidak tahan terhadap gesekan",
      "Tahan terhadap sinar UV"
    ],
    "answer": "Mudah terurai dan tidak tahan lama"
  },
  {
    "question": "Why has natural fiber like jute been largely replaced by synthetic fibers in modern fishing gear?",
    "choices": [
      "It is too expensive",
      "It is biodegradable and weakens in water",
      "It is too light for deep-sea fishing",
      "It absorbs too much water",
      "It has a low tensile strength"
    ],
    "answer": "It is biodegradable and weakens in water"
  },
  {
    "question": "Serat alami seperti sutera memiliki kekuatan yang baik, namun mengapa bahan ini tidak umum digunakan dalam alat tangkap ikan skala besar?",
    "choices": [
      "Harganya sangat murah",
      "Terlalu kuat untuk alat tangkap kecil",
      "Tidak tahan air laut dan cepat lapuk",
      "Berat jenis yang terlalu rendah",
      "Terlalu elastis"
    ],
    "answer": "Tidak tahan air laut dan cepat lapuk"
  },
  {
    "question": "Which of the following is a reason why silk, despite its strength, is not commonly used in large-scale fishing operations?",
    "choices": [
      "It is too cheap to produce",
      "It is too strong for small gears",
      "It degrades quickly in seawater",
      "It has a low specific gravity",
      "It is too flexible for large nets"
    ],
    "answer": "It degrades quickly in seawater"
  }
];
})();