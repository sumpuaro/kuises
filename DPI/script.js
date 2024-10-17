(function(){
  const quizId = "UTS DPI"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-17T12:00:00');
    const endTime = new Date('2024-10-17T12:50:00');

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
              score += 2;
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
          "question": "What environmental factor most influences the distribution of pelagic fish?",
          "choices": [
              "Salinity",
              "Depth",
              "Plankton availability",
              "Sediment composition",
              "Oceanic front"
          ],
          "answer": "Plankton availability"
      },
      {
          "question": "Faktor apa yang paling mempengaruhi penentuan daerah penangkapan ikan demersal?",
          "choices": [
              "Suhu air",
              "Kecepatan arus",
              "Kedalaman laut",
              "Sumber makanan",
              "Kadar oksigen"
          ],
          "answer": "Kedalaman laut"
      },
      {
          "question": "Which tool provides the most accurate position for determining fishing grounds?",
          "choices": [
              "Side scan sonar (SSS)",
              "Multibeam echosounder (MBES)",
              "Single beam echosounder (SBES)",
              "Acoustic Doppler current profiler",
              "GPS only"
          ],
          "answer": "Multibeam echosounder (MBES)"
      },
      {
          "question": "Ikan pelagis kecil seperti ikan teri (Stolephorus sp.) umumnya ditemukan di perairan dengan parameter lingkungan berikut, kecuali:",
          "choices": [
              "Suhu 27 oC - 29 oC",
              "Salinitas 29-33 ppt",
              "Kecepatan arus lebih dari 0,03 m/detik",
              "Kekeruhan kurang dari 10 NTU",
              "Kandungan klorofil-a 0,74 mg/L - 2,67 mg/L"
          ],
          "answer": "Kekeruhan kurang dari 10 NTU"
      },
      {
          "question": "How does upwelling benefit pelagic fisheries?",
          "choices": [
              "It increases water temperature.",
              "It enhances nutrient availability in surface waters.",
              "It decreases ocean salinity.",
              "It creates barriers for fish migration.",
              "It reduces turbidity."
          ],
          "answer": "It enhances nutrient availability in surface waters."
      },
      {
          "question": "Manakah dari berikut yang merupakan metode identifikasi daerah penangkapan ikan berdasarkan teknologi akustik?",
          "choices": [
              "GIS",
              "Remote sensing",
              "Side scan sonar",
              "Penentuan manual",
              "GPS"
          ],
          "answer": "Side scan sonar"
      },
      {
          "question": "The primary habitat of demersal fish is:",
          "choices": [
              "Near the surface of the water",
              "In the open ocean",
              "Along the shorelines",
              "Near the ocean bottom",
              "In freshwater lakes"
          ],
          "answer": "Near the ocean bottom"
      },
      {
          "question": "Faktor berikut mempengaruhi distribusi ikan demersal, kecuali:",
          "choices": [
              "Kedalaman",
              "Upwelling",
              "Komposisi sedimen",
              "Salinitas",
              "Suhu"
          ],
          "answer": "Upwelling"
      },
      {
          "question": "Which of the following species is most likely to be found in demersal fishing grounds?",
          "choices": [
              "Tuna",
              "Sardines",
              "Anchovies",
              "Red snapper",
              "Mackerel"
          ],
          "answer": "Red snapper"
      },
      {
          "question": "Teknologi berikut ini menggunakan koordinat geografis untuk menentukan lokasi daerah penangkapan ikan:",
          "choices": [
              "GPS",
              "Echosounder",
              "Side scan sonar",
              "Current profiler",
              "Bathymetry"
          ],
          "answer": "GPS"
      },
      {
          "question": "What are the primary limitations of using side scan sonar (SSS) for demersal fishing ground identification?",
          "choices": [
              "Low-resolution images",
              "Difficulty in covering large areas",
              "Inaccuracy in position due to towfish movement",
              "Weak signal strength",
              "Inconsistent water temperature readings"
          ],
          "answer": "Inaccuracy in position due to towfish movement"
      },
      {
          "question": "Ikan pelagis besar seperti tuna sering ditemukan di:",
          "choices": [
              "Perairan pantai",
              "Perairan dalam yang jauh dari pantai",
              "Muara sungai",
              "Danau air tawar",
              "Terumbu karang"
          ],
          "answer": "Perairan dalam yang jauh dari pantai"
      },
      {
          "question": "What is the main ecological characteristic of demersal fish?",
          "choices": [
              "Fast swimming in open waters",
              "High adaptability to varying temperatures",
              "Slow growth and late maturity",
              "Wide migration patterns",
              "Formation of large schools"
          ],
          "answer": "Slow growth and late maturity"
      },
      {
          "question": "Faktor apa yang paling penting untuk menentukan daerah penangkapan ikan pelagis?",
          "choices": [
              "Suhu air",
              "Jenis sedimen",
              "Kedalaman air",
              "Pola migrasi ikan",
              "Oksigen terlarut"
          ],
          "answer": "Suhu air"
      },
      {
          "question": "Which technology would provide the best spatial information for mapping demersal fish habitats?",
          "choices": [
              "GPS",
              "Multibeam echosounder",
              "Side scan sonar",
              "Satellite imagery",
              "Remote sensing"
          ],
          "answer": "Multibeam echosounder"
      },
      {
          "question": "Salah satu keuntungan utama dari fenomena upwelling bagi daerah penangkapan ikan pelagis adalah:",
          "choices": [
              "Kenaikan suhu air",
              "Penambahan kadar nutrien di permukaan laut",
              "Penurunan salinitas air",
              "Penurunan arus laut",
              "Pengurangan kandungan oksigen"
          ],
          "answer": "Penambahan kadar nutrien di permukaan laut"
      },
      {
          "question": "How does turbidity affect pelagic fish populations?",
          "choices": [
              "It increases the fish population by reducing light penetration.",
              "It decreases fish populations due to lower visibility for feeding.",
              "It has no impact on pelagic fish.",
              "It helps in the reproduction of pelagic fish.",
              "It aids in the migration of pelagic fish."
          ],
          "answer": "It decreases fish populations due to lower visibility for feeding."
      },
      {
          "question": "Faktor yang mempengaruhi kelimpahan plankton di daerah penangkapan ikan pelagis adalah:",
          "choices": [
              "Sedimen dasar laut",
              "Kadar klorofil-a",
              "Kedalaman laut",
              "Salinitas tinggi",
              "Tekanan udara"
          ],
          "answer": "Kadar klorofil-a"
      },
      {
          "question": "What kind of fish would you most likely catch using a multibeam echosounder?",
          "choices": [
              "Pelagic fish",
              "Freshwater fish",
              "Demersal fish",
              "Reef fish",
              "Estuarine fish"
          ],
          "answer": "Demersal fish"
      },
      {
          "question": "Ikan demersal biasanya hidup di habitat yang memiliki karakteristik:",
          "choices": [
              "Gerakan air yang cepat",
              "Komposisi sedimen yang kaya nutrien",
              "Suhu air yang tinggi",
              "Lapisan es",
              "Cahaya yang terang"
          ],
          "answer": "Komposisi sedimen yang kaya nutrien"
      },
      {
          "question": "Which of the following is most likely to limit the effectiveness of remote sensing in identifying pelagic fishing grounds?",
          "choices": [
              "Cloud cover",
              "High salinity",
              "Deep water",
              "Fast currents",
              "Strong winds"
          ],
          "answer": "Cloud cover"
      },
      {
          "question": "Teknologi penginderaan jauh dapat digunakan untuk memetakan daerah penangkapan ikan dengan memantau parameter lingkungan seperti:",
          "choices": [
              "Komposisi sedimen",
              "Klorofil-a",
              "Kedalaman laut",
              "Suhu dasar laut",
              "Tekanan udara"
          ],
          "answer": "Klorofil-a"
      },
      {
          "question": "What is the advantage of using GPS for pelagic fishery mapping?",
          "choices": [
              "It provides detailed ocean floor topography.",
              "It offers precise location tracking in open waters.",
              "It analyzes fish behavior based on ocean currents.",
              "It detects fish schools with high accuracy.",
              "It measures plankton concentrations."
          ],
          "answer": "It offers precise location tracking in open waters."
      },
      {
          "question": "Salah satu kelemahan penggunaan echosounder single beam (SBES) dibandingkan dengan multibeam adalah:",
          "choices": [
              "Hanya menerima satu sinyal akustik",
              "Tidak dapat digunakan di perairan dangkal",
              "Terlalu mahal untuk digunakan",
              "Menghasilkan citra resolusi rendah",
              "Membutuhkan pengoperasian yang rumit"
          ],
          "answer": "Hanya menerima satu sinyal akustik"
      },
      {
          "question": "The fishing ground of pelagic fish is primarily influenced by:",
          "choices": [
              "Bottom sediment",
              "Ocean currents",
              "Water clarity",
              "Surface water temperature",
              "Coastal vegetation"
          ],
          "answer": "Surface water temperature"
      },
      {
          "question": "What is the main factor that affects fish population distribution in a fishing ground according to oceanographic conditions?",
          "choices": [
              "Sea depth",
              "Salinity",
              "Meteorological conditions",
              "Fish migration patterns"
          ],
          "answer": "Salinity"
      },
      {
          "question": "Jelaskan bagaimana arus laut dapat mempengaruhi kelimpahan ikan di suatu daerah penangkapan ikan?",
          "choices": [
              "Membawa plankton yang menjadi sumber makanan bagi ikan",
              "Menyebabkan turunnya suhu perairan",
              "Mengubah salinitas perairan secara drastis",
              "Memengaruhi proses fotosintesis plankton"
          ],
          "answer": "Membawa plankton yang menjadi sumber makanan bagi ikan"
      },
      {
          "question": "Why is the selection of fishing gear important for sustainable fishing practices?",
          "choices": [
              "It increases the volume of fish catch",
              "It ensures only target species are caught",
              "It reduces fishing costs",
              "It allows fishing in deeper waters"
          ],
          "answer": "It ensures only target species are caught"
      },
      {
          "question": "Apa yang dimaksud dengan Daerah Penangkapan Ikan Tradisional (DPIT)?",
          "choices": [
              "Wilayah laut yang kaya akan terumbu karang",
              "Wilayah perairan yang telah lama digunakan oleh nelayan tradisional",
              "Wilayah penangkapan yang dalam dan jauh dari daratan",
              "Wilayah laut yang berada di bawah yurisdiksi internasional"
          ],
          "answer": "Wilayah perairan yang telah lama digunakan oleh nelayan tradisional"
      },
      {
          "question": "How do meteorological factors like wind and rainfall affect fishing operations?",
          "choices": [
              "They increase fish migration",
              "They change fish breeding patterns",
              "They influence water salinity and safety of fishing operations",
              "They create new fishing zones"
          ],
          "answer": "They influence water salinity and safety of fishing operations"
      },
      {
          "question": "Mengapa pemanfaatan teknologi GPS penting dalam pemetaan daerah penangkapan ikan?",
          "choices": [
              "Untuk mengukur kedalaman perairan",
              "Untuk melacak pergerakan ikan di lautan",
              "Untuk menentukan posisi kapal dan jalur penangkapan",
              "Untuk menghitung jumlah ikan di suatu wilayah"
          ],
          "answer": "Untuk menentukan posisi kapal dan jalur penangkapan"
      },
      {
          "question": "Which oceanographic parameter is crucial for determining the primary productivity in a fishing ground?",
          "choices": [
              "Sea surface temperature",
              "Ocean current velocity",
              "Nutrient availability",
              "Salinity levels"
          ],
          "answer": "Nutrient availability"
      },
      {
          "question": "Bagaimana karakteristik perairan dangkal memengaruhi produktivitas perikanan?",
          "choices": [
              "Memungkinkan penetrasi cahaya matahari sehingga mendukung fotosintesis fitoplankton",
              "Mengurangi suhu perairan dan meningkatkan jumlah plankton",
              "Menghambat pertumbuhan terumbu karang",
              "Meningkatkan kedalaman air di sekitar pantai"
          ],
          "answer": "Memungkinkan penetrasi cahaya matahari sehingga mendukung fotosintesis fitoplankton"
      },
      {
          "question": "What is the role of ocean currents in the distribution of fish populations?",
          "choices": [
              "They change fish spawning patterns",
              "They carry nutrients and plankton essential for fish feeding",
              "They create warmer water zones",
              "They block fish migration"
          ],
          "answer": "They carry nutrients and plankton essential for fish feeding"
      },
      {
          "question": "Apa peran survei laut dalam penentuan daerah penangkapan ikan?",
          "choices": [
              "Untuk memantau aktivitas nelayan di laut",
              "Untuk mengumpulkan data fisik dan biologi perairan",
              "Untuk mendeteksi keberadaan ikan menggunakan sonar",
              "Untuk memetakan kawasan lindung perikanan"
          ],
          "answer": "Untuk mengumpulkan data fisik dan biologi perairan"
      },
      {
          "question": "Apa alasan utama ikan melakukan migrasi secara vertikal?",
          "choices": [
              "Menghindari predator",
              "Menyesuaikan dengan perubahan suhu air",
              "Mencari makanan dan cahaya",
              "Beradaptasi dengan arus laut"
          ],
          "answer": "Mencari makanan dan cahaya"
      },
      {
          "question": "What is the main difference between anadromous and catadromous fish migration?",
          "choices": [
              "Anadromous fish migrate to saltwater for spawning, while catadromous fish migrate to freshwater.",
              "Anadromous fish migrate to freshwater for spawning, while catadromous fish migrate to saltwater.",
              "Anadromous fish migrate horizontally, while catadromous fish migrate vertically.",
              "Anadromous fish migrate for food, while catadromous fish migrate for spawning."
          ],
          "answer": "Anadromous fish migrate to freshwater for spawning, while catadromous fish migrate to saltwater."
      },
      {
          "question": "Mengapa ikan salmon bermigrasi dari laut ke sungai untuk memijah?",
          "choices": [
              "Karena sungai memiliki suhu yang lebih tinggi",
              "Karena sungai menyediakan tempat yang aman bagi anak ikan",
              "Karena sungai memiliki salinitas yang lebih rendah",
              "Karena sungai memiliki lebih banyak plankton"
          ],
          "answer": "Karena sungai menyediakan tempat yang aman bagi anak ikan"
      },
      {
          "question": "How do ocean currents influence fish migration?",
          "choices": [
              "They increase the speed of fish movement during migration.",
              "They provide direction for fish to find food and suitable spawning grounds.",
              "They create barriers that prevent fish from reaching their spawning areas.",
              "They alter fish metabolism and reproductive cycles."
          ],
          "answer": "They provide direction for fish to find food and suitable spawning grounds."
      },
      {
          "question": "Jelaskan bagaimana intensitas cahaya dapat memengaruhi pola migrasi ikan?",
          "choices": [
              "Intensitas cahaya yang tinggi menyebabkan ikan bermigrasi ke perairan dangkal",
              "Ikan cenderung menyebar pada malam hari dan membentuk kelompok kecil pada siang hari",
              "Intensitas cahaya hanya memengaruhi ikan pelagis, bukan demersal",
              "Intensitas cahaya tidak berpengaruh signifikan pada migrasi ikan"
          ],
          "answer": "Ikan cenderung menyebar pada malam hari dan membentuk kelompok kecil pada siang hari"
      },
      {
          "question": "What role does temperature play in fish migration?",
          "choices": [
              "It only affects fish metabolism and not their migration patterns.",
              "High temperatures stimulate migration, while low temperatures slow it down.",
              "Fish prefer to migrate in warm waters to conserve energy.",
              "Fish tend to migrate to areas where the temperature is optimal for their species."
          ],
          "answer": "Fish tend to migrate to areas where the temperature is optimal for their species."
      },
      {
          "question": "Mengapa salinitas air laut menjadi faktor penting dalam migrasi ikan?",
          "choices": [
              "Ikan memerlukan salinitas rendah untuk proses pemijahan",
              "Ikan mencari perairan dengan salinitas yang sesuai dengan tekanan osmotik tubuhnya",
              "Salinitas tinggi meningkatkan pertumbuhan plankton",
              "Salinitas rendah memicu migrasi ikan ke perairan dalam"
          ],
          "answer": "Ikan mencari perairan dengan salinitas yang sesuai dengan tekanan osmotik tubuhnya"
      },
      {
          "question": "What adaptive behavior allows fish to return to their spawning grounds after long migrations?",
          "choices": [
              "Guided by older fish in the school",
              "Following the temperature gradient",
              "Using their sense of smell to identify specific water characteristics",
              "Relying on ocean currents to direct them"
          ],
          "answer": "Using their sense of smell to identify specific water characteristics"
      },
      {
          "question": "Apa yang terjadi pada ikan jika faktor lingkungan, seperti pencemaran air limbah, menghalangi jalur migrasi mereka?",
          "choices": [
              "Ikan akan mencari jalur migrasi baru yang lebih panjang",
              "Ikan akan memijah di tempat yang lebih dekat",
              "Ikan akan menghentikan proses migrasinya dan tinggal di wilayah asal",
              "Ikan akan gagal mencapai tempat pemijahan yang aman"
          ],
          "answer": "Ikan akan gagal mencapai tempat pemijahan yang aman"
      },
      {
          "question": "How do light and seasonal changes influence fish vertical migration?",
          "choices": [
              "Fish move towards the surface during the day and dive deeper at night.",
              "Fish remain in the deep layers of the ocean during the summer and rise during the winter.",
              "Fish tend to migrate vertically in response to light intensity and temperature fluctuations.",
              "Vertical migration is unaffected by seasonal changes."
          ],
          "answer": "Fish tend to migrate vertically in response to light intensity and temperature fluctuations."
      },
      {
          "question": "Bagaimana arus laut membantu ikan juvenil dalam migrasi?",
          "choices": [
              "Arus membantu mereka melarikan diri dari predator",
              "Arus membawa mereka dari daerah pemijahan ke daerah asuhan",
              "Arus meningkatkan metabolisme mereka untuk pertumbuhan cepat",
              "Arus membawa ikan ke kedalaman yang lebih aman"
          ],
          "answer": "Arus membawa mereka dari daerah pemijahan ke daerah asuhan"
      },
      {
          "question": "What happens if a fish species fails to reach its spawning grounds during migration?",
          "choices": [
              "They will find an alternative location for spawning.",
              "The species may experience a population decline.",
              "They will delay spawning until the next migration season.",
              "They will adapt and spawn in their current location."
          ],
          "answer": "The species may experience a population decline."
      },
      {
          "question": "Apa faktor internal yang memicu migrasi ikan ke daerah pemijahan?",
          "choices": [
              "Kondisi cuaca yang berubah",
              "Peningkatan kadar oksigen dalam air",
              "Kematangan gonad ikan",
              "Ketersediaan makanan di daerah pemijahan"
          ],
          "answer": "Kematangan gonad ikan"
      },
      {
          "question": "How does human activity, such as dam construction, impact fish migration?",
          "choices": [
              "It encourages fish to find alternative routes.",
              "It provides new habitats for fish to spawn.",
              "It creates physical barriers that prevent fish from reaching their spawning grounds.",
              "It improves water quality, aiding fish migration."
          ],
          "answer": "It creates physical barriers that prevent fish from reaching their spawning grounds."
      },
      {
          "question": "Mengapa migrasi ikan penting untuk kelangsungan hidup spesies ikan?",
          "choices": [
              "Migrasi memungkinkan ikan menemukan makanan yang cukup di setiap musim",
              "Migrasi hanya dilakukan untuk mencari suhu air yang stabil",
              "Migrasi membantu ikan menghindari predator di perairan tertentu",
              "Migrasi diperlukan untuk menemukan daerah pemijahan yang aman dan cocok"
          ],
          "answer": "Migrasi diperlukan untuk menemukan daerah pemijahan yang aman dan cocok"
      }
  ];
})();