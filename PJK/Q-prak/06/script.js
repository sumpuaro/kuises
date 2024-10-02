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
    const startTime = new Date('2024-10-02T13:05:00');
    const endTime = new Date('2024-10-02T13:20:00');

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
        "question": "Apa tujuan utama dari klasifikasi citra dalam penginderaan jauh?",
        "choices": [
          "Meningkatkan resolusi citra", 
          "Mengkategorikan piksel-piksel citra ke dalam kelas tutupan lahan atau penggunaan lahan",
          "Menghilangkan noise pada citra",
          "Memperbaiki warna citra",
          "Menggabungkan beberapa citra menjadi satu"
        ],
        "answer": "Mengkategorikan piksel-piksel citra ke dalam kelas tutupan lahan atau penggunaan lahan"
      },
      {
        "question": "Apa perbedaan utama antara tutupan lahan (land cover) dan penggunaan lahan (land use)?",
        "choices": [
          "Tutupan lahan berhubungan dengan vegetasi, penggunaan lahan dengan bangunan",
          "Tutupan lahan berkaitan dengan karakteristik fisik permukaan, penggunaan lahan dengan bagaimana manusia menggunakan lahan tersebut",
          "Tutupan lahan hanya bisa diidentifikasi dengan citra satelit, penggunaan lahan dengan survei lapangan",
          "Tutupan lahan bersifat dinamis, penggunaan lahan bersifat statis",
          "Tidak ada perbedaan, keduanya adalah istilah yang sama"
        ],
        "answer": "Tutupan lahan berkaitan dengan karakteristik fisik permukaan, penggunaan lahan dengan bagaimana manusia menggunakan lahan tersebut"
      },
      {
        "question": "Dalam klasifikasi terbimbing (supervised classification), apa yang dimaksud dengan data training?",
        "choices": [
          "Data citra yang akan diklasifikasikan",
          "Data hasil klasifikasi",
          "Data dengan label kelas yang diketahui untuk melatih classifier",
          "Data untuk menguji akurasi klasifikasi",
          "Data metadata citra"
        ],
        "answer": "Data dengan label kelas yang diketahui untuk melatih classifier"
      },
      {
        "question": "Metode apa yang digunakan di Google Earth Engine untuk mengekstrak informasi band dari titik-titik training?",
        "choices": [
          "extractBands()",
          "getBandInfo()",
          "sampleRegions()",
          "extractFeatures()",
          "getPixelValue()"
        ],
        "answer": "sampleRegions()"
      },
      {
        "question": "Apa kepanjangan dari CART dalam konteks klasifikasi citra?",
        "choices": [
          "Computer Assisted Remote Targeting",
          "Classification And Regression Tree",
          "Classifier Automation and Reliability Test",
          "Coordinated Airborne Remote Tracking",
          "Contextual Analysis of Raster Terrain"
        ],
        "answer": "Classification And Regression Tree"
      },
      {
        "question": "Apa keunggulan utama dari algoritma Random Forest dibandingkan dengan decision tree tunggal?",
        "choices": [
          "Selalu menghasilkan akurasi 100%",
          "Membangun banyak decision tree dan menggunakan voting mayoritas",
          "Hanya memerlukan sedikit data training",
          "Dapat melakukan klasifikasi tanpa data training",
          "Bekerja lebih cepat daripada algoritma lainnya"
        ],
        "answer": "Membangun banyak decision tree dan menggunakan voting mayoritas"
      },
      {
        "question": "Dalam klasifikasi tak terbimbing (unsupervised classification), apa yang dilakukan algoritma terhadap data?",
        "choices": [
          "Menggunakan label kelas yang sudah ditentukan",
          "Mengelompokkan data berdasarkan kesamaan spektral tanpa label awal",
          "Selalu menghasilkan 2 kelas",
          "Menggunakan semua piksel sebagai data training",
          "Hanya bisa digunakan untuk citra multispektral"
        ],
        "answer": "Mengelompokkan data berdasarkan kesamaan spektral tanpa label awal"
      },
      {
        "question": "Apa yang dimaksud dengan 'k' dalam algoritma k-means clustering?",
        "choices": [
          "Jumlah band yang digunakan",
          "Jumlah iterasi maksimum",
          "Jumlah cluster yang ingin dibentuk",
          "Jumlah piksel dalam citra",
          "Konstanta kalibrasi algoritma"
        ],
        "answer": "Jumlah cluster yang ingin dibentuk"
      },
      {
        "question": "Apa fungsi dari metode randomVisualizer() dalam konteks klasifikasi di Earth Engine?",
        "choices": [
          "Mengacak urutan band citra",
          "Memberikan warna acak pada hasil klasifikasi",
          "Memilih titik training secara acak",
          "Mengacak urutan piksel dalam citra",
          "Membuat klasifikasi yang berbeda setiap kali dijalankan"
        ],
        "answer": "Memberikan warna acak pada hasil klasifikasi"
      },
      {
        "question": "Mengapa penting untuk mengumpulkan titik training di seluruh area citra, tidak hanya fokus pada satu lokasi?",
        "choices": [
          "Untuk menghemat waktu",
          "Untuk mengurangi ukuran file",
          "Untuk mendapatkan representasi spektral yang lebih baik dari setiap kelas",
          "Karena Earth Engine membatasi jumlah titik per area",
          "Untuk menghindari overfitting"
        ],
        "answer": "Untuk mendapatkan representasi spektral yang lebih baik dari setiap kelas"
      },
      {
        "question": "Apa yang dimaksud dengan 'hyperparameter' dalam konteks model klasifikasi?",
        "choices": [
          "Parameter yang nilainya selalu di atas normal",
          "Parameter yang diatur oleh pengguna sebelum proses training",
          "Parameter yang hanya relevan untuk citra hyperspektral",
          "Parameter yang nilainya selalu berubah selama klasifikasi",
          "Parameter yang menentukan resolusi spasial hasil klasifikasi"
        ],
        "answer": "Parameter yang diatur oleh pengguna sebelum proses training"
      },
      {
        "question": "Dalam Random Forest, apa yang terjadi jika kita meningkatkan jumlah pohon (trees)?",
        "choices": [
          "Akurasi selalu meningkat secara linear",
          "Waktu komputasi meningkat, tapi akurasi tidak selalu meningkat signifikan",
          "Akurasi menurun karena overfitting",
          "Jumlah kelas yang bisa diklasifikasikan meningkat",
          "Resolusi spasial hasil klasifikasi meningkat"
        ],
        "answer": "Waktu komputasi meningkat, tapi akurasi tidak selalu meningkat signifikan"
      },
      {
        "question": "Apa fungsi dari parameter 'seed' dalam algoritma Random Forest di Earth Engine?",
        "choices": [
          "Menentukan jumlah pohon yang akan dibuat",
          "Mengatur kedalaman maksimum setiap pohon",
          "Memastikan hasil yang dapat direplikasi setiap kali model dijalankan",
          "Menentukan jumlah minimum sampel di setiap node",
          "Mengatur bobot setiap kelas"
        ],
        "answer": "Memastikan hasil yang dapat direplikasi setiap kali model dijalankan"
      },
      {
        "question": "Apa yang dimaksud dengan 'centroid' dalam algoritma k-means clustering?",
        "choices": [
          "Titik tengah geografis dari citra",
          "Piksel dengan nilai spektral tertinggi",
          "Rata-rata nilai spektral dari suatu cluster",
          "Titik awal random untuk memulai clustering",
          "Batas antara dua cluster yang berdekatan"
        ],
        "answer": "Rata-rata nilai spektral dari suatu cluster"
      },
      {
        "question": "Mengapa menambahkan indeks spektral seperti NDVI sebagai band tambahan dapat meningkatkan akurasi klasifikasi?",
        "choices": [
          "Karena NDVI selalu memiliki nilai yang akurat",
          "Karena menambah indeks berarti menambah jumlah kelas",
          "Karena indeks dapat memberikan informasi unik tentang karakteristik tutupan lahan",
          "Karena indeks menghilangkan efek atmosfer",
          "Karena indeks meningkatkan resolusi spasial citra"
        ],
        "answer": "Karena indeks dapat memberikan informasi unik tentang karakteristik tutupan lahan"
      },
      {
        "question": "Dalam konteks klasifikasi citra, apa yang dimaksud dengan 'confusion matrix'?",
        "choices": [
          "Matriks yang menunjukkan tingkat kebingungan interpreter citra",
          "Tabel yang membandingkan hasil klasifikasi dengan data referensi",
          "Grafik yang menunjukkan tingkat kesulitan klasifikasi untuk setiap kelas",
          "Matriks yang digunakan untuk mengacak data training",
          "Tabel yang menunjukkan jumlah iterasi yang diperlukan untuk konvergensi"
        ],
        "answer": "Tabel yang membandingkan hasil klasifikasi dengan data referensi"
      },
      {
        "question": "Apa keuntungan menggunakan klasifikasi tak terbimbing dibandingkan klasifikasi terbimbing?",
        "choices": [
          "Selalu menghasilkan akurasi yang lebih tinggi",
          "Tidak memerlukan data training yang dilabeli manual",
          "Dapat membedakan lebih banyak kelas",
          "Proses komputasi lebih cepat",
          "Hasil klasifikasi lebih mudah diinterpretasi"
        ],
        "answer": "Tidak memerlukan data training yang dilabeli manual"
      },
      {
        "question": "Apa yang dimaksud dengan 'object-based image analysis' dalam konteks klasifikasi citra?",
        "choices": [
          "Analisis yang hanya fokus pada objek-objek tertentu dalam citra",
          "Klasifikasi yang menggunakan segmentasi citra sebelum proses klasifikasi",
          "Analisis yang hanya dapat dilakukan pada citra resolusi tinggi",
          "Klasifikasi yang menggunakan objek 3D",
          "Analisis yang menggunakan kamera objek sebagai sumber data"
        ],
        "answer": "Klasifikasi yang menggunakan segmentasi citra sebelum proses klasifikasi"
      },
      {
        "question": "Dalam Earth Engine, apa perbedaan antara ee.Classifier dan ee.Clusterer?",
        "choices": [
          "ee.Classifier untuk klasifikasi supervised, ee.Clusterer untuk unsupervised",
          "ee.Classifier untuk citra optik, ee.Clusterer untuk citra radar",
          "ee.Classifier untuk klasifikasi biner, ee.Clusterer untuk multi-kelas",
          "ee.Classifier untuk data raster, ee.Clusterer untuk data vektor",
          "Tidak ada perbedaan, keduanya dapat digunakan secara bergantian"
        ],
        "answer": "ee.Classifier untuk klasifikasi supervised, ee.Clusterer untuk unsupervised"
      },
      {
        "question": "Apa yang perlu diperhatikan saat menggunakan metode sample() untuk mengambil sampel piksel dalam klasifikasi tak terbimbing?",
        "choices": [
          "Sampel harus diambil dari satu area kecil saja",
          "Jumlah sampel harus selalu lebih besar dari jumlah band",
          "Parameter scale dan numPixels harus diatur dengan tepat",
          "Sampel harus selalu diambil secara manual",
          "Metode ini hanya bisa digunakan untuk citra Landsat"
        ],
        "answer": "Parameter scale dan numPixels harus diatur dengan tepat"
      }
    ];
})();