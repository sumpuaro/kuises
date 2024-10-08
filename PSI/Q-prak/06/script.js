(function(){
  const quizId = "Kuis 06"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-08T10:00:00');
    const endTime = new Date('2024-10-08T10:20:00');

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
        "question": "Apa jenis query yang digunakan untuk memilih data spesifik dari satu atau lebih tabel?",
        "choices": [
          "Update Query",
          "Delete Query",
          "Select Query",
          "Append Query",
          "Crosstab Query"
        ],
        "answer": "Select Query"
      },
      {
        "question": "Dalam Microsoft Access, apa yang dimaksud dengan Design View saat membuat query?",
        "choices": [
          "Tampilan untuk mendesain tabel",
          "Tampilan grafis untuk membuat dan mengedit query",
          "Tampilan untuk menulis kode SQL secara langsung",
          "Tampilan untuk mendesain form",
          "Tampilan untuk mendesain report"
        ],
        "answer": "Tampilan grafis untuk membuat dan mengedit query"
      },
      {
        "question": "Jenis join apakah yang mengembalikan semua baris dari tabel kiri dan baris yang cocok dari tabel kanan?",
        "choices": [
          "INNER JOIN",
          "RIGHT JOIN",
          "LEFT JOIN",
          "FULL JOIN",
          "CROSS JOIN"
        ],
        "answer": "LEFT JOIN"
      },
      {
        "question": "Fungsi agregat apa yang digunakan untuk menghitung jumlah baris dalam sekelompok data?",
        "choices": [
          "SUM",
          "AVG",
          "COUNT",
          "MAX",
          "MIN"
        ],
        "answer": "COUNT"
      },
      {
        "question": "Apa kegunaan utama dari Query Wizard dalam Microsoft Access?",
        "choices": [
          "Membuat tabel baru",
          "Mengedit data dalam tabel",
          "Memudahkan pembuatan query kompleks",
          "Mendesain form otomatis",
          "Membuat laporan"
        ],
        "answer": "Memudahkan pembuatan query kompleks"
      },
      {
        "question": "Jenis join apakah yang hanya mengembalikan baris yang memiliki kecocokan di kedua tabel?",
        "choices": [
          "INNER JOIN",
          "RIGHT JOIN",
          "LEFT JOIN",
          "FULL JOIN",
          "OUTER JOIN"
        ],
        "answer": "INNER JOIN"
      },
      {
        "question": "Dalam SQL, apa fungsi dari klausa WHERE?",
        "choices": [
          "Mengurutkan hasil query",
          "Mengelompokkan hasil query",
          "Memfilter baris berdasarkan kondisi tertentu",
          "Menggabungkan tabel",
          "Membatasi jumlah baris yang dikembalikan"
        ],
        "answer": "Memfilter baris berdasarkan kondisi tertentu"
      },
      {
        "question": "Apa perbedaan utama antara SQL View dan Design View dalam pembuatan query?",
        "choices": [
          "SQL View lebih cepat dalam eksekusi",
          "Design View hanya untuk query sederhana",
          "SQL View menggunakan sintaks SQL langsung",
          "Design View tidak dapat digunakan untuk joins",
          "SQL View tidak mendukung fungsi agregat"
        ],
        "answer": "SQL View menggunakan sintaks SQL langsung"
      },
      {
        "question": "Fungsi agregat apa yang digunakan untuk menghitung nilai rata-rata dalam sekelompok data?",
        "choices": [
          "SUM",
          "AVG",
          "COUNT",
          "MAX",
          "MIN"
        ],
        "answer": "AVG"
      },
      {
        "question": "Apa yang terjadi jika menggunakan RIGHT JOIN ketika tabel kanan tidak memiliki data yang cocok dengan tabel kiri?",
        "choices": [
          "Query akan error",
          "Semua baris dari tabel kanan akan ditampilkan dengan nilai NULL untuk kolom dari tabel kiri",
          "Tidak ada baris yang akan ditampilkan",
          "Hanya baris yang cocok akan ditampilkan",
          "Semua baris dari kedua tabel akan ditampilkan"
        ],
        "answer": "Semua baris dari tabel kanan akan ditampilkan dengan nilai NULL untuk kolom dari tabel kiri"
      },
      {
        "question": "Dalam konteks query, apa yang dimaksud dengan 'kriteria'?",
        "choices": [
          "Nama kolom yang dipilih",
          "Jenis join yang digunakan",
          "Kondisi yang harus dipenuhi oleh data yang diambil",
          "Urutan pengurutan hasil",
          "Jumlah maksimum baris yang dikembalikan"
        ],
        "answer": "Kondisi yang harus dipenuhi oleh data yang diambil"
      },
      {
        "question": "Apa fungsi dari operator LIKE dalam query SQL?",
        "choices": [
          "Membandingkan dua nilai numerik",
          "Menggabungkan dua string",
          "Mencari pola dalam string",
          "Mengurutkan hasil query",
          "Mengelompokkan hasil query"
        ],
        "answer": "Mencari pola dalam string"
      },
      {
        "question": "Bagaimana cara membatasi jumlah baris yang dikembalikan oleh query dalam SQL?",
        "choices": [
          "Menggunakan klausa WHERE",
          "Menggunakan klausa LIMIT",
          "Menggunakan klausa ORDER BY",
          "Menggunakan klausa GROUP BY",
          "Menggunakan klausa HAVING"
        ],
        "answer": "Menggunakan klausa LIMIT"
      },
      {
        "question": "Apa fungsi dari klausa GROUP BY dalam query SQL?",
        "choices": [
          "Mengurutkan hasil query",
          "Memfilter hasil query",
          "Mengelompokkan baris berdasarkan nilai kolom tertentu",
          "Menggabungkan tabel",
          "Membatasi jumlah baris yang dikembalikan"
        ],
        "answer": "Mengelompokkan baris berdasarkan nilai kolom tertentu"
      },
      {
        "question": "Dalam Microsoft Access, apa keuntungan menggunakan parameter dalam query?",
        "choices": [
          "Meningkatkan kecepatan eksekusi query",
          "Memungkinkan input dinamis saat menjalankan query",
          "Otomatis membuat laporan",
          "Menghilangkan kebutuhan untuk join",
          "Mengenkripsi data hasil query"
        ],
        "answer": "Memungkinkan input dinamis saat menjalankan query"
      },
      {
        "question": "Apa yang dimaksud dengan subquery dalam SQL?",
        "choices": [
          "Query yang dijalankan setelah query utama",
          "Query yang hanya mengambil subset kolom",
          "Query yang disisipkan dalam query lain",
          "Query yang menggabungkan lebih dari dua tabel",
          "Query yang hanya menggunakan fungsi agregat"
        ],
        "answer": "Query yang disisipkan dalam query lain"
      },
      {
        "question": "Bagaimana cara menghapus duplikasi baris dalam hasil query SQL?",
        "choices": [
          "Menggunakan klausa UNIQUE",
          "Menggunakan klausa DISTINCT",
          "Menggunakan klausa NODUPE",
          "Menggunakan klausa SINGLE",
          "Menggunakan klausa REMOVE DUPLICATE"
        ],
        "answer": "Menggunakan klausa DISTINCT"
      },
      {
        "question": "Apa fungsi dari operator BETWEEN dalam query SQL?",
        "choices": [
          "Mencocokkan nilai dengan pola tertentu",
          "Membandingkan string",
          "Memeriksa apakah nilai berada dalam rentang tertentu",
          "Menggabungkan hasil dari dua query",
          "Menghitung jumlah baris"
        ],
        "answer": "Memeriksa apakah nilai berada dalam rentang tertentu"
      },
      {
        "question": "Dalam konteks Microsoft Access, apa yang dimaksud dengan 'recordset'?",
        "choices": [
          "Kumpulan tabel dalam database",
          "Hasil dari eksekusi query",
          "Kumpulan form dalam database",
          "Jenis khusus dari tabel",
          "Laporan yang dihasilkan dari query"
        ],
        "answer": "Hasil dari eksekusi query"
      },
      {
        "question": "Apa yang terjadi jika menggunakan fungsi agregat tanpa klausa GROUP BY dalam query?",
        "choices": [
          "Query akan error",
          "Fungsi agregat akan diterapkan ke seluruh hasil query",
          "Hanya baris pertama yang akan diproses",
          "Fungsi agregat akan diabaikan",
          "Query akan mengembalikan hasil kosong"
        ],
        "answer": "Fungsi agregat akan diterapkan ke seluruh hasil query"
      }
    ];
})();