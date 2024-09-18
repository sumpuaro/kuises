(function(){
  const quizId = "Kuis 04"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-09-18T13:00:00');
    const endTime = new Date('2024-09-18T13:30:00');

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
          quizTitle: `${quizId} Praktikum PJPT`,
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
            "question": "Apa yang dimaksud dengan resolusi spasial dalam penginderaan jauh?",
            "choices": [
              "Mengacu pada jumlah sensor satelit yang tersedia",
              "Mengukur berapa kali satelit mengunjungi suatu area",
              "Menunjukkan ukuran area yang tercakup oleh satu piksel",
              "Menentukan jumlah citra yang dikumpulkan setiap hari",
              "Menghitung jumlah band spektral pada citra"
            ],
            "answer": "Menunjukkan ukuran area yang tercakup oleh satu piksel"
          },
          {
            "question": "Apa fungsi dari Map.centerObject dalam Google Earth Engine?",
            "choices": [
              "Menghapus objek dari peta",
              "Memusatkan tampilan peta pada objek tertentu",
              "Memutar peta pada objek yang dipilih",
              "Mengganti citra yang digunakan",
              "Menghitung jarak antara objek"
            ],
            "answer": "Memusatkan tampilan peta pada objek tertentu"
          },
          {
            "question": "Dataset mana yang memiliki resolusi spasial 500 meter untuk band inframerah, merah, dan hijau?",
            "choices": [
              "Sentinel-2 MSI",
              "Landsat 7 TM",
              "MODIS",
              "NAIP",
              "EO-1 Hyperion"
            ],
            "answer": "MODIS"
          },
          {
            "question": "Apa yang dimaksud dengan resolusi temporal?",
            "choices": [
              "Mengukur area yang tercakup oleh satu piksel",
              "Mengacu pada jumlah band spektral pada citra",
              "Mengukur frekuensi satelit mengambil gambar pada area yang sama",
              "Mengukur kualitas citra pada piksel individu",
              "Menunjukkan rasio waktu pemrosesan citra"
            ],
            "answer": "Mengukur frekuensi satelit mengambil gambar pada area yang sama"
          },
          {
            "question": "Apa yang dimaksud dengan band spektral?",
            "choices": [
              "Jalur satelit saat melintasi permukaan bumi",
              "Rentang panjang gelombang elektromagnetik yang ditangkap sensor",
              "Resolusi temporal dataset",
              "Ukuran piksel pada citra satelit",
              "Jumlah gambar yang dihasilkan setiap hari"
            ],
            "answer": "Rentang panjang gelombang elektromagnetik yang ditangkap sensor"
          },
          {
            "question": "Apa resolusi spasial dari citra Sentinel-2 MSI pada band inframerah?",
            "choices": [
              "1 meter",
              "10 meter",
              "30 meter",
              "500 meter",
              "900 meter"
            ],
            "answer": "10 meter"
          },
          {
            "question": "Sistem satelit mana yang digunakan oleh NAIP untuk pengumpulan data?",
            "choices": [
              "Sentinel-1",
              "Terra dan Aqua",
              "Landsat 8",
              "Penginderaan udara",
              "MODIS"
            ],
            "answer": "Penginderaan udara"
          },
          {
            "question": "Bagaimana cara melihat metadata dari citra Sentinel-2 di Earth Engine?",
            "choices": [
              "Dengan menggunakan perintah print()",
              "Dengan memeriksa proyeksi dataset",
              "Dengan membuka konsol metadata di situs Sentinel",
              "Dengan menjalankan fungsi nominalScale",
              "Dengan memfilter band spektral"
            ],
            "answer": "Dengan menggunakan perintah print()"
          },
          {
            "question": "Apa fungsi dari band QA60 pada citra Sentinel-2?",
            "choices": [
              "Menunjukkan cakupan vegetasi",
              "Mengukur kualitas spektral piksel",
              "Mendeteksi keberadaan awan",
              "Menampilkan citra inframerah",
              "Mengukur resolusi temporal"
            ],
            "answer": "Mendeteksi keberadaan awan"
          },
          {
            "question": "Dataset Landsat 5 memiliki resolusi spasial berapa untuk citra warna-inframerah?",
            "choices": [
              "1 meter",
              "10 meter",
              "30 meter",
              "500 meter",
              "900 meter"
            ],
            "answer": "30 meter"
          },
          {
            "question": "Apa yang ditunjukkan oleh panjang gelombang band spektral pada sensor?",
            "choices": [
              "Ukuran piksel pada citra",
              "Jumlah band yang tersedia",
              "Jenis objek yang bisa diidentifikasi",
              "Rentang panjang gelombang yang diukur oleh sensor",
              "Frekuensi pengambilan gambar"
            ],
            "answer": "Rentang panjang gelombang yang diukur oleh sensor"
          },
          {
            "question": "Apa perbedaan utama antara sensor multispektral dan hiperspektral?",
            "choices": [
              "Sensor multispektral memiliki lebih banyak band",
              "Sensor hiperspektral memiliki lebih sedikit band",
              "Sensor hiperspektral memiliki lebih banyak band spektral",
              "Sensor multispektral hanya menangkap inframerah",
              "Sensor hiperspektral hanya menangkap cahaya tampak"
            ],
            "answer": "Sensor hiperspektral memiliki lebih banyak band spektral"
          },
          {
            "question": "Bagaimana cara memeriksa jumlah gambar yang tersedia dalam suatu dataset di Earth Engine?",
            "choices": [
              "Dengan menggunakan fungsi filterDate()",
              "Dengan menggunakan fungsi filterBounds()",
              "Dengan menggunakan fungsi size()",
              "Dengan menggunakan perintah Map.addLayer()",
              "Dengan menggunakan fungsi select()"
            ],
            "answer": "Dengan menggunakan fungsi size()"
          },
          {
            "question": "Apa yang dimaksud dengan resolusi spektral?",
            "choices": [
              "Frekuensi pengambilan gambar oleh satelit",
              "Rentang panjang gelombang yang diukur oleh sensor",
              "Luas area yang tercakup oleh satu piksel",
              "Jumlah band yang dimiliki oleh dataset",
              "Resolusi temporal gambar satelit"
            ],
            "answer": "Rentang panjang gelombang yang diukur oleh sensor"
          },
          {
            "question": "Apa perbedaan utama antara MODIS dan Landsat dalam hal resolusi spasial?",
            "choices": [
              "MODIS memiliki resolusi spasial yang lebih tinggi",
              "Landsat memiliki resolusi spasial yang lebih rendah",
              "MODIS memiliki resolusi spasial yang lebih kasar",
              "Landsat hanya mengambil gambar inframerah",
              "MODIS hanya digunakan untuk studi atmosfer"
            ],
            "answer": "MODIS memiliki resolusi spasial yang lebih kasar"
          },
          {
            "question": "Apa fungsi dari perintah nominalScale() dalam Earth Engine?",
            "choices": [
              "Menampilkan informasi metadata citra",
              "Mengukur jarak antara dua piksel",
              "Menampilkan resolusi spasial dataset",
              "Menampilkan kualitas piksel individu",
              "Menghitung waktu pengolahan citra"
            ],
            "answer": "Menampilkan resolusi spasial dataset"
          },
          {
            "question": "Satelit apa yang menyediakan data dari sensor Thematic Mapper (TM)?",
            "choices": [
              "MODIS",
              "Sentinel-2",
              "Landsat 5",
              "NAIP",
              "Terra"
            ],
            "answer": "Landsat 5"
          },
          {
            "question": "Berapa resolusi spasial dari data MODIS untuk citra inframerah?",
            "choices": [
              "1 meter",
              "10 meter",
              "30 meter",
              "500 meter",
              "1000 meter"
            ],
            "answer": "500 meter"
          },
          {
            "question": "Apa fungsi utama dari false-color image dalam Earth Engine?",
            "choices": [
              "Untuk meningkatkan akurasi klasifikasi",
              "Untuk menampilkan data tanpa memerlukan resolusi tinggi",
              "Untuk mengkombinasikan band inframerah dan spektral",
              "Untuk menampilkan citra dengan lebih banyak warna",
              "Untuk menghemat waktu pemrosesan citra"
            ],
            "answer": "Untuk mengkombinasikan band inframerah dan spektral"
          },
          {
            "question": "Apa keuntungan utama menggunakan dataset dengan resolusi spasial kasar?",
            "choices": [
              "Memungkinkan detail yang lebih halus",
              "Memerlukan waktu pemrosesan yang lebih sedikit",
              "Lebih akurat dalam memprediksi parameter lingkungan",
              "Menghasilkan citra dengan kualitas lebih tinggi",
              "Menangkap citra dengan lebih banyak band spektral"
            ],
            "answer": "Memerlukan waktu pemrosesan yang lebih sedikit"
          }
    ];
})();