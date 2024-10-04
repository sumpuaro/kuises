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
    const startTime = new Date('2024-10-04T15:05:00');
    const endTime = new Date('2024-10-04T15:30:00');

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
      const webAppUrl = 'https://script.google.com/macros/s/AKfycbxWtm1SKkZ9oDhvvJ9qsuDU2MslV6OGwnFYT-SoB-jVx8TUMtcFL7uORzluODKKkcL0/exec';
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
        "question": "Analisis peran penting \"people\" dalam sistem informasi dan bagaimana mereka mempengaruhi keberhasilan implementasi teknologi dalam organisasi.",
        "choices": [
          "Hanya sebagai pengguna teknologi",
          "Pengembang sistem tanpa tanggung jawab lebih lanjut", 
          "Elemen yang tidak berperan penting",
          "Elemen kunci yang mengelola, mendukung, dan menggunakan sistem secara efektif",
          "Pengawas hardware"
        ],
        "answer": "Elemen kunci yang mengelola, mendukung, dan menggunakan sistem secara efektif"
      },
      {
        "question": "Jika suatu organisasi mengalami kegagalan dalam menggunakan sistem informasi, komponen manakah yang paling mungkin menjadi penyebab kegagalan tersebut?",
        "choices": [
          "Teknologi yang usang",
          "Manajemen yang tidak tepat",
          "Pengguna yang tidak terlatih",
          "Penggunaan perangkat keras yang salah",
          "Kurangnya sumber daya"
        ],
        "answer": "Pengguna yang tidak terlatih"
      },
      {
        "question": "Evaluasi keuntungan dan kerugian dari penggunaan sistem informasi manual dibandingkan dengan sistem informasi berbasis komputer di organisasi kecil.",
        "choices": [
          "Manual lebih murah dan lebih mudah digunakan",
          "Sistem berbasis komputer lebih rumit tanpa kelebihan",
          "Sistem manual lebih cepat dan fleksibel",
          "Sistem berbasis komputer lebih efisien dalam jangka panjang",
          "Sistem manual tidak memerlukan keterampilan khusus"
        ],
        "answer": "Sistem berbasis komputer lebih efisien dalam jangka panjang"
      },
      {
        "question": "Sebuah perusahaan memutuskan untuk mengabaikan komponen 'process' dalam penerapan sistem informasi. Analisis apa dampak jangka panjang yang mungkin terjadi?",
        "choices": [
          "Tidak ada dampak yang signifikan",
          "Sistem akan tetap berjalan dengan lancar",
          "Pengambilan keputusan menjadi lebih lambat dan tidak terstruktur",
          "Pengguna akan kesulitan menggunakan sistem",
          "Teknologi bisa mengatasi kekurangan proses"
        ],
        "answer": "Pengambilan keputusan menjadi lebih lambat dan tidak terstruktur"
      },
      {
        "question": "Apakah pendekatan yang paling tepat untuk meningkatkan kualitas informasi dalam sistem informasi yang besar?",
        "choices": [
          "Mengurangi jumlah data",
          "Mengintegrasikan sumber data yang berbeda tanpa validasi",
          "Mengandalkan teknologi terbaru",
          "Menjamin aksesibilitas, akurasi, dan relevansi data",
          "Mengabaikan masalah biaya dalam pengolahan data"
        ],
        "answer": "Menjamin aksesibilitas, akurasi, dan relevansi data"
      },
      {
        "question": "Jika perusahaan X ingin mempertahankan keunggulan bersaing melalui strategi inovasi teknologi, faktor apa yang harus paling diprioritaskan?",
        "choices": [
          "Memiliki biaya produksi rendah",
          "Memiliki produk yang mudah ditiru",
          "Mengembangkan produk yang sulit ditiru dan bernilai bagi pasar",
          "Menghindari kerjasama dengan perusahaan lain",
          "Mengandalkan perangkat keras using"
        ],
        "answer": "Mengembangkan produk yang sulit ditiru dan bernilai bagi pasar"
      },
      {
        "question": "Mengapa perusahaan yang hanya berfokus pada 'operational effectiveness' rentan terhadap persaingan?",
        "choices": [
          "Karena strategi ini memastikan diferensiasi",
          "Karena efisiensi operasional tidak menjamin keunikan strategi",
          "Karena fokus pada teknologi akan menciptakan keunggulan abadi",
          "Karena operasional yang efisien selalu meningkatkan keuntungan",
          "Karena biaya akan selalu lebih rendah daripada pesaing"
        ],
        "answer": "Karena efisiensi operasional tidak menjamin keunikan strategi"
      },
      {
        "question": "Jika sebuah perusahaan beroperasi dalam industri dengan banyak hambatan masuk, bagaimana sistem informasi dapat digunakan untuk memperkuat posisi mereka?",
        "choices": [
          "Mengurangi biaya operasional dengan otomatisasi",
          "Mengabaikan inovasi produk",
          "Meningkatkan hambatan dengan teknologi yang mahal",
          "Menggunakan sistem informasi untuk meningkatkan loyalitas pelanggan melalui layanan yang dipersonalisasi",
          "Mengandalkan pemasok tunggal"
        ],
        "answer": "Menggunakan sistem informasi untuk meningkatkan loyalitas pelanggan melalui layanan yang dipersonalisasi"
      },
      {
        "question": "Dalam situasi pasar dengan persaingan ketat, bagaimana teknologi informasi dapat membantu perusahaan untuk tetap kompetitif?",
        "choices": [
          "Mengurangi jumlah karyawan",
          "Mempercepat pengambilan keputusan melalui data real-time",
          "Meningkatkan anggaran pemasaran",
          "Menambahkan produk baru tanpa analisis pasar",
          "Meningkatkan harga produk tanpa justifikasi"
        ],
        "answer": "Mempercepat pengambilan keputusan melalui data real-time"
      },
      {
        "question": "Apa yang akan terjadi jika sebuah perusahaan tidak memperhatikan ancaman dari substitusi produk atau layanan dalam industrinya?",
        "choices": [
          "Perusahaan akan terus berkembang tanpa gangguan",
          "Perusahaan berisiko kehilangan pangsa pasar ke produk substitusi yang lebih baik",
          "Perusahaan akan menciptakan monopoli di industrinya",
          "Produk substitusi tidak mempengaruhi keberhasilan perusahaan",
          "Perusahaan dapat menaikkan harga tanpa konsekuensi"
        ],
        "answer": "Perusahaan berisiko kehilangan pangsa pasar ke produk substitusi yang lebih baik"
      },
      {
        "question": "Analisis bagaimana perkembangan teknologi perangkat keras seperti solid-state drive (SSD) dibandingkan dengan hard drive konvensional dapat mempengaruhi kecepatan dan efisiensi bisnis.",
        "choices": [
          "SSD lebih lambat tetapi lebih murah",
          "SSD lebih cepat, tetapi lebih mahal dan lebih tidak efisien",
          "SSD memberikan kecepatan dan keandalan yang lebih tinggi dalam pengolahan data",
          "Hard drive konvensional lebih cepat dalam memproses data",
          "Tidak ada perbedaan signifikan antara keduanya"
        ],
        "answer": "SSD memberikan kecepatan dan keandalan yang lebih tinggi dalam pengolahan data"
      },
      {
        "question": "Jika perusahaan Anda memutuskan untuk mengganti RAM dengan kapasitas lebih besar, bagaimana perubahan ini akan mempengaruhi operasi harian komputer?",
        "choices": [
          "Meningkatkan kecepatan sistem dan memungkinkan lebih banyak aplikasi berjalan secara bersamaan",
          "Mengurangi kecepatan sistem",
          "Tidak ada perubahan yang signifikan",
          "Membatasi jumlah aplikasi yang bisa dijalankan",
          "Mempercepat hard disk"
        ],
        "answer": "Meningkatkan kecepatan sistem dan memungkinkan lebih banyak aplikasi berjalan secara bersamaan"
      },
      {
        "question": "Bagaimana pengaruh dari Moore's Law terhadap perusahaan teknologi saat ini dalam hal inovasi perangkat keras?",
        "choices": [
          "Tidak relevan lagi karena perkembangan teknologi sudah melambat",
          "Terus mendorong perusahaan untuk memperbarui dan meningkatkan produk perangkat keras",
          "Mengharuskan perusahaan untuk meningkatkan kapasitas penyimpanan",
          "Membatasi kemampuan perusahaan untuk berinovasi",
          "Hanya berlaku untuk perusahaan kecil"
        ],
        "answer": "Terus mendorong perusahaan untuk memperbarui dan meningkatkan produk perangkat keras"
      },
      {
        "question": "Analisis dampak dari meningkatnya e-waste (limbah elektronik) terhadap organisasi besar yang menggunakan perangkat keras dalam jumlah besar.",
        "choices": [
          "Tidak berdampak pada organisasi besar",
          "Meningkatkan biaya pengelolaan dan risiko lingkungan",
          "Mengurangi keuntungan organisasi",
          "Menghilangkan kebutuhan akan perangkat keras baru",
          "Tidak relevan untuk industri teknologi"
        ],
        "answer": "Meningkatkan biaya pengelolaan dan risiko lingkungan"
      },
      {
        "question": "Jika suatu perusahaan ingin meningkatkan keamanan fisik data mereka, teknologi apa yang harus mereka prioritaskan?",
        "choices": [
          "Hard drive konvensional",
          "SSD tanpa enkripsi",
          "Penyimpanan cloud tanpa backup",
          "Hardware dengan enkripsi dan autentikasi dua faktor",
          "RAM dengan kapasitas lebih besar"
        ],
        "answer": "Hardware dengan enkripsi dan autentikasi dua faktor"
      },
      {
        "question": "Bagaimana penerapan Software as a Service (SaaS) dapat mengubah model bisnis perusahaan dalam hal efisiensi dan biaya operasional?",
        "choices": [
          "Meningkatkan biaya pemeliharaan perangkat keras",
          "Mengurangi efisiensi dengan biaya yang lebih tinggi",
          "Meningkatkan fleksibilitas dan mengurangi biaya perangkat keras",
          "Membatasi akses ke data",
          "Tidak berdampak signifikan pada model bisnis"
        ],
        "answer": "Meningkatkan fleksibilitas dan mengurangi biaya perangkat keras"
      },
      {
        "question": "Jika sebuah perusahaan menggunakan perangkat lunak open-source, apa keuntungan utama yang dapat mereka capai dalam hal inovasi?",
        "choices": [
          "Pengurangan total biaya kepemilikan",
          "Kontrol penuh terhadap pengembangan dan modifikasi perangkat lunak",
          "Dukungan eksklusif dari vendor perangkat lunak",
          "Ketergantungan penuh pada pemasok eksternal",
          "Pembatasan akses untuk pengguna akhir"
        ],
        "answer": "Kontrol penuh terhadap pengembangan dan modifikasi perangkat lunak"
      },
      {
        "question": "Mengapa beberapa perusahaan lebih memilih perangkat lunak proprietary (berlisensi) dibandingkan open-source dalam lingkungan kerja kritis?",
        "choices": [
          "Perangkat lunak proprietary lebih murah",
          "Perangkat lunak proprietary memberikan dukungan resmi dan keamanan yang lebih baik",
          "Open-source lebih aman",
          "Perangkat lunak proprietary lebih sulit untuk digunakan",
          "Open-source memiliki lebih banyak fitur"
        ],
        "answer": "Perangkat lunak proprietary memberikan dukungan resmi dan keamanan yang lebih baik"
      },
      {
        "question": "Bagaimana model cloud computing mengubah pendekatan organisasi terhadap pengelolaan perangkat lunak?",
        "choices": [
          "Mengharuskan pembelian server fisik yang lebih banyak",
          "Mengurangi kebutuhan infrastruktur internal dan meningkatkan skalabilitas",
          "Menghilangkan kebutuhan untuk memelihara data",
          "Membatasi kolaborasi antar divisi",
          "Menghilangkan ketergantungan pada vendor pihak ketiga"
        ],
        "answer": "Mengurangi kebutuhan infrastruktur internal dan meningkatkan skalabilitas"
      },
      {
        "question": "Apa keuntungan dari penggunaan middleware dalam sistem besar yang memiliki banyak aplikasi?",
        "choices": [
          "Mengurangi biaya hardware",
          "Menyederhanakan komunikasi antara aplikasi yang berbeda",
          "Menghapus kebutuhan untuk sistem operasi",
          "Meningkatkan kecepatan akses ke jaringan",
          "Menghapus data yang tidak digunakan"
        ],
        "answer": "Menyederhanakan komunikasi antara aplikasi yang berbeda"
      },
      {
        "question": "Mengapa penting menggunakan relasi dalam database relasional?",
        "choices": [
          "Mengurangi biaya hardware",
          "Meningkatkan kecepatan akses ke jaringan",
          "Memungkinkan hubungan antar tabel untuk meminimalisir redundansi data",
          "Menghapus kebutuhan akan storage yang besar",
          "Menghapus data yang tidak digunakan"
        ],
        "answer": "Memungkinkan hubungan antar tabel untuk meminimalisir redundansi data"
      },
      {
        "question": "Apa risiko utama jika sebuah organisasi tidak melakukan normalisasi data di database mereka?",
        "choices": [
          "Mengurangi kecepatan akses",
          "Menyebabkan redundansi dan inkonsistensi data",
          "Meningkatkan kecepatan proses database",
          "Membatasi akses ke database",
          "Meningkatkan skalabilitas database"
        ],
        "answer": "Menyebabkan redundansi dan inkonsistensi data"
      },
    {
        "question": "Bagaimana penggunaan SQL dalam database management system membantu dalam pengambilan keputusan bisnis?",
        "choices": [
          "SQL membuat visualisasi data menjadi lebih mudah",
          "SQL memungkinkan pengelolaan database tanpa autentikasi",
          "SQL memfasilitasi query data untuk mendapatkan informasi yang relevan secara cepat",
          "SQL meningkatkan redundansi data",
          "SQL menambah kompleksitas pengelolaan database"
        ],
        "answer": "SQL memfasilitasi query data untuk mendapatkan informasi yang relevan secara cepat"
      },
      {
        "question": "Bagaimana indeks pada database relasional dapat meningkatkan performa pencarian data?",
        "choices": [
          "Indeks menambah ukuran tabel",
          "Indeks memungkinkan pencarian lebih cepat dengan mengurangi jumlah data yang harus dipindai",
          "Indeks menyulitkan pengelolaan database",
          "Indeks menghapus data yang tidak diperlukan",
          "Indeks hanya digunakan dalam database kecil"
        ],
        "answer": "Indeks memungkinkan pencarian lebih cepat dengan mengurangi jumlah data yang harus dipindai"
      },
      {
        "question": "Apa keuntungan dari menggunakan primary key dan foreign key dalam database relasional?",
        "choices": [
          "Mengurangi ukuran database",
          "Mempercepat proses query data",
          "Memastikan keunikan data dan memungkinkan hubungan antar tabel",
          "Menghapus kebutuhan akan query SQL",
          "Mengurangi jumlah tabel dalam database"
        ],
        "answer": "Memastikan keunikan data dan memungkinkan hubungan antar tabel"
      }
    ];
})();