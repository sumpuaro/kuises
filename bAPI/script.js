(function(){
  const quizId = "TPI_RL"; // Ubah ini untuk setiap kuis yang berbeda
  let currentQuestion = 0;
  let score = 0;
  let timer;
  let questions = [];
  let userData = {};
  let isQuizActive = false;

  // Validasi waktu akses
  function validateAccess() {
    const now = new Date();
    const startTime = new Date('2024-10-14T17:00:00');
    const endTime = new Date('2024-10-14T17:30:00');

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
              score += 4;
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
    "question": "Bagaimana Anda menilai efektivitas penggunaan jaring biodegradabel dalam mengurangi dampak ghost fishing dibandingkan dengan alat tangkap berbahan plastik?",
    "choices": [
      "Jaring biodegradabel terlalu cepat rusak sehingga kurang efektif",
      "Jaring ini sama merusaknya terhadap biota laut seperti plastik",
      "Jaring ini dapat secara signifikan mengurangi ghost fishing bila digunakan dengan benar",
      "Jaring ini meningkatkan polusi laut dalam jangka panjang",
      "Jaring ini tidak memiliki dampak yang terbukti dalam mengurangi ghost fishing"
    ],
    "answer": "Jaring ini dapat secara signifikan mengurangi ghost fishing bila digunakan dengan benar"
  },
  {
    "question": "Pendekatan mana yang paling efektif untuk mencegah ghost fishing di daerah yang sering mengalami cuaca buruk?",
    "choices": [
      "Menerapkan lisensi penangkapan ikan yang lebih ketat",
      "Menggunakan teknologi GPS dan pemetaan dasar laut untuk melacak alat tangkap",
      "Melarang semua aktivitas penangkapan ikan di daerah tersebut",
      "Mempromosikan metode penangkapan ikan tradisional",
      "Memberikan pendidikan kepada nelayan tentang dampak ghost fishing"
    ],
    "answer": "Menggunakan teknologi GPS dan pemetaan dasar laut untuk melacak alat tangkap"
  },
  {
    "question": "Bayangkan Anda diberi tugas untuk merancang rencana pengelolaan perikanan di wilayah yang terdampak oleh metode penangkapan ikan destruktif. Apa langkah pertama yang akan Anda ambil?",
    "choices": [
      "Menerapkan hukuman pada semua aktivitas penangkapan ikan",
      "Mengembangkan sistem pemantauan berbasis komunitas",
      "Memperkenalkan teknik penangkapan ikan yang lebih modern",
      "Mengizinkan kapal asing untuk beroperasi",
      "Mencabut lisensi penangkapan ikan dari nelayan lokal"
    ],
    "answer": "Mengembangkan sistem pemantauan berbasis komunitas"
  },
  {
    "question": "Analisis dampak ekologis jangka panjang dari penangkapan ikan dengan dinamit terhadap ekosistem terumbu karang. Apa yang kemungkinan besar akan terjadi jika metode ini terus dilakukan tanpa kendali?",
    "choices": [
      "Terumbu karang akan pulih dalam beberapa bulan",
      "Ekosistem terumbu karang akan runtuh, menyebabkan hilangnya keanekaragaman hayati",
      "Populasi ikan akan meningkat karena berkurangnya persaingan",
      "Habitat akan menjadi lebih tahan terhadap perubahan iklim",
      "Terumbu karang akan beradaptasi terhadap tekanan dan berkembang"
    ],
    "answer": "Ekosistem terumbu karang akan runtuh, menyebabkan hilangnya keanekaragaman hayati"
  },
  {
    "question": "Bagaimana penerapan alat Bycatch Reduction Devices (BRDs) dapat memengaruhi keberlanjutan perikanan di Zona Ekonomi Eksklusif (ZEE) Indonesia?",
    "choices": [
      "BRDs akan cenderung mengurangi produktivitas perikanan secara keseluruhan",
      "BRDs akan mencegah hilangnya spesies yang terancam punah",
      "BRDs tidak akan memiliki dampak signifikan terhadap keberlanjutan",
      "BRDs akan meningkatkan tangkapan sampingan spesies yang tidak diinginkan",
      "BRDs akan menyebabkan kepunahan spesies ikan komersial"
    ],
    "answer": "BRDs akan mencegah hilangnya spesies yang terancam punah"
  },
  {
    "question": "Dengan mempertimbangkan aktivitas penangkapan ikan ilegal di Zona Ekonomi Eksklusif (ZEE) Indonesia, bagaimana hal ini bisa merusak upaya negara dalam mencapai pengelolaan perikanan yang berkelanjutan?",
    "choices": [
      "Dengan meningkatkan mata pencaharian lokal melalui penjualan ikan yang lebih tinggi",
      "Dengan menciptakan pasar kompetitif untuk produk perikanan",
      "Dengan menghabiskan stok ikan lebih cepat daripada yang bisa dipulihkan",
      "Dengan mendorong investasi dalam teknologi penangkapan ikan",
      "Dengan meningkatkan kerja sama dengan negara tetangga"
    ],
    "answer": "Dengan menghabiskan stok ikan lebih cepat daripada yang bisa dipulihkan"
  },
  {
    "question": "Jika praktik penangkapan ikan destruktif seperti jaring trawl dasar terus dilakukan secara luas, apa kemungkinan konsekuensi jangka panjang bagi perikanan global?",
    "choices": [
      "Perikanan akan menjadi lebih produktif karena ekosistem menyesuaikan diri",
      "Habitat laut akan dipulihkan melalui upaya internasional",
      "Keanekaragaman spesies laut akan menurun drastis",
      "Lebih banyak kawasan laut yang dilindungi akan memungkinkan pemulihan ekosistem",
      "Populasi ikan akan berpindah ke perairan yang lebih dalam yang tidak terpengaruh oleh jaring trawl"
    ],
    "answer": "Keanekaragaman spesies laut akan menurun drastis"
  },
  {
    "question": "Strategi mana yang paling efektif untuk mengurangi frekuensi insiden ghost fishing pada operasi penangkapan ikan di laut dalam?",
    "choices": [
      "Melarang sepenuhnya penangkapan ikan di laut dalam",
      "Mewajibkan penggunaan alat tangkap dengan sistem pelacakan",
      "Mengurangi jumlah armada penangkapan ikan",
      "Meningkatkan hukuman untuk penangkapan ikan ilegal",
      "Melatih nelayan untuk mengambil kembali alat tangkap yang hilang secara manual"
    ],
    "answer": "Mewajibkan penggunaan alat tangkap dengan sistem pelacakan"
  },
  {
    "question": "Evaluasi risiko lingkungan dari perubahan bahan jaring tangkap dari bahan alami ke monofilamen plastik dalam konteks ghost fishing.",
    "choices": [
      "Akan mengurangi usia pakai alat tangkap di lautan",
      "Akan mengurangi kemungkinan hilangnya jaring",
      "Akan memperpanjang durasi insiden ghost fishing",
      "Tidak akan berdampak pada frekuensi ghost fishing",
      "Akan membantu mencegah ghost fishing dalam jangka panjang"
    ],
    "answer": "Akan memperpanjang durasi insiden ghost fishing"
  },
  {
    "question": "Apa faktor penting yang perlu dipertimbangkan saat merancang kebijakan untuk mengurangi dampak ghost fishing di negara berkembang?",
    "choices": [
      "Ketersediaan pendanaan pemerintah untuk teknologi",
      "Kesediaan nelayan lokal untuk mengubah praktik mereka",
      "Tingkat pencemaran laut oleh faktor-faktor lain",
      "Biaya peralatan penangkapan ikan tradisional",
      "Kecepatan pemulihan organisme laut"
    ],
    "answer": "Kesediaan nelayan lokal untuk mengubah praktik mereka"
  },
  {
    "question": "What might be the long-term ecological effects if policies to mitigate destructive fishing in coral reef areas are not enforced?",
    "choices": [
      "Coral reefs will recover naturally over time",
      "Biodiversity will be maintained due to ecosystem resilience",
      "Marine species depending on coral reefs will face extinction",
      "Fishing will become more sustainable due to reduced competition",
      "Coastal communities will benefit economically from tourism"
    ],
    "answer": "Marine species depending on coral reefs will face extinction"
  },
  {
    "question": "How might ghost fishing gear impact endangered species differently compared to more common fish species?",
    "choices": [
      "Endangered species are less likely to encounter lost gear",
      "Common species are more affected due to their larger populations",
      "Endangered species could be more vulnerable to entanglement",
      "Ghost fishing gear only affects species found near the surface",
      "It primarily affects species living in coral reef ecosystems"
    ],
    "answer": "Endangered species could be more vulnerable to entanglement"
  },
  {
    "question": "What are the most significant challenges in implementing Bycatch Reduction Devices (BRDs) in small-scale fisheries across Indonesia?",
    "choices": [
      "Lack of access to modern technology",
      "High costs associated with BRD installation",
      "Fishermen’s resistance to changing traditional practices",
      "Negative impact on overall fish catch",
      "Increased need for government surveillance"
    ],
    "answer": "Fishermen’s resistance to changing traditional practices"
  },
  {
    "question": "Which of the following best represents the environmental risks associated with deep-sea bottom trawling?",
    "choices": [
      "Restoring deep-sea ecosystems by exposing new habitats",
      "Improving biodiversity through the removal of invasive species",
      "Homogenizing sediments and destroying seafloor structures",
      "Enhancing carbon sequestration by releasing sediment",
      "Encouraging the growth of deep-sea coral reefs"
    ],
    "answer": "Homogenizing sediments and destroying seafloor structures"
  },
  {
    "question": "How could overfishing in Indonesia’s ZEE lead to transboundary conflicts with neighboring countries?",
    "choices": [
      "It could create disputes over shared fishery resources",
      "It would increase cooperation between countries",
      "It would encourage joint fishing agreements",
      "It would reduce the need for foreign fishing licenses",
      "It would boost regional economic partnerships"
    ],
    "answer": "It could create disputes over shared fishery resources"
  },
  {
    "question": "Bagaimana Anda menilai efektivitas kampanye kesadaran publik dalam mencegah praktik penangkapan ikan yang merusak, khususnya penangkapan ikan dengan bahan peledak? Apa keterbatasannya?",
    "choices": [
      "Kampanye ini memberikan hasil langsung dalam mengurangi penangkapan ikan dengan bahan peledak",
      "Kampanye ini hanya efektif jika diikuti dengan regulasi yang ketat",
      "Kampanye ini tidak mengatasi akar penyebab dari praktik penangkapan ikan yang merusak",
      "Kampanye ini menghilangkan kebutuhan akan upaya pemantauan dan pengendalian",
      "Kampanye ini mendorong nelayan untuk mengadopsi metode yang lebih berkelanjutan"
    ],
    "answer": "Kampanye ini tidak mengatasi akar penyebab dari praktik penangkapan ikan yang merusak"
  },
  {
    "question": "Bagaimana perubahan iklim dapat memperburuk dampak ghost fishing di wilayah tropis?",
    "choices": [
      "Dengan menurunkan suhu laut, sehingga membuat penangkapan ikan kurang produktif",
      "Dengan meningkatkan frekuensi badai yang menyebabkan hilangnya alat tangkap",
      "Dengan mendorong nelayan untuk menggunakan alat tangkap yang lebih berkelanjutan",
      "Dengan memperbaiki populasi ikan akibat perubahan habitat",
      "Dengan mengurangi permintaan untuk penangkapan ikan di daerah tropis"
    ],
    "answer": "Dengan meningkatkan frekuensi badai yang menyebabkan hilangnya alat tangkap"
  },
  {
    "question": "Peran apa yang dapat dimainkan oleh regulasi internasional dalam mengurangi praktik penangkapan ikan yang merusak di Zona Ekonomi Eksklusif (ZEE) Indonesia?",
    "choices": [
      "Regulasi dapat membantu menegakkan hukum lokal dengan lebih efektif",
      "Regulasi hanya dapat memberikan sanksi kepada kapal asing",
      "Regulasi dapat menciptakan standar yang lebih ketat untuk perikanan berkelanjutan",
      "Regulasi akan sepenuhnya menghilangkan penangkapan ikan ilegal",
      "Regulasi tidak akan berdampak pada praktik perikanan domestik"
    ],
    "answer": "Regulasi dapat membantu menegakkan hukum lokal dengan lebih efektif"
  },
  {
    "question": "Pertimbangkan dampak sosial yang mungkin terjadi akibat pelarangan praktik penangkapan ikan yang merusak di komunitas pesisir kecil. Apa konsekuensi yang tidak diinginkan?",
    "choices": [
      "Peningkatan penangkapan ikan ilegal karena kurangnya alternatif",
      "Peningkatan stok ikan lokal secara langsung",
      "Meningkatnya pendapatan dari pariwisata",
      "Peningkatan investasi asing dalam perikanan",
      "Meningkatnya koperasi penangkapan ikan yang berkelanjutan"
    ],
    "answer": "Peningkatan penangkapan ikan ilegal karena kurangnya alternatif"
  },
  {
    "question": "Mengapa pengenalan teknologi baru, seperti pelacakan alat tangkap menggunakan GPS, mungkin tidak menjadi solusi yang layak bagi nelayan skala kecil di negara berkembang?",
    "choices": [
      "Teknologi tersebut terlalu rumit untuk digunakan secara lokal",
      "Teknologi ini memerlukan biaya perawatan yang tinggi dan keahlian khusus",
      "Nelayan tidak akan melihat manfaat langsung dari teknologi ini",
      "Teknologi ini meningkatkan kemungkinan hilangnya alat tangkap",
      "Teknologi ini tidak berkontribusi pada peningkatan hasil tangkapan ikan"
    ],
    "answer": "Teknologi ini memerlukan biaya perawatan yang tinggi dan keahlian khusus"
  },
  {
    "question": "Menghadapi tantangan penegakan hukum anti-penangkapan ikan merusak di daerah terpencil Indonesia, strategi alternatif apa yang dapat diterapkan untuk mengurangi kejadian praktik penangkapan ikan merusak?",
    "choices": [
      "Meningkatkan jumlah kapal patroli di daerah tersebut",
      "Menawarkan insentif keuangan untuk praktik penangkapan ikan berkelanjutan",
      "Menaikkan denda untuk penangkapan ikan ilegal agar menjadi pencegahan",
      "Mendirikan lebih banyak kawasan laut yang dilindungi tanpa pengawasan",
      "Mengandalkan negara tetangga untuk membantu dalam penegakan hukum"
    ],
    "answer": "Menawarkan insentif keuangan untuk praktik penangkapan ikan berkelanjutan"
  },
  {
    "question": "Bagaimana penerapan praktik terbaik internasional dalam pengelolaan perikanan dapat memengaruhi keberlanjutan jangka panjang Zona Ekonomi Eksklusif (ZEE) Indonesia?",
    "choices": [
      "Ini akan menyebabkan penurunan ekspor ikan negara",
      "Ini akan memperkuat kemitraan global dan investasi",
      "Ini akan menciptakan gangguan jangka pendek dalam rantai pasokan ikan",
      "Ini akan menyebabkan penolakan nelayan lokal terhadap perubahan",
      "Ini akan memastikan keseimbangan antara kepentingan ekologi dan ekonomi"
    ],
    "answer": "Ini akan memastikan keseimbangan antara kepentingan ekologi dan ekonomi"
  },
  {
    "question": "Di daerah yang terkena dampak ghost fishing, bagaimana data dari pelacakan satelit dan teknologi drone dapat digunakan untuk meningkatkan upaya pemulihan alat tangkap yang hilang?",
    "choices": [
      "Dengan meningkatkan kecepatan nelayan dalam menyebarkan alat tangkap baru",
      "Dengan menyediakan data real-time tentang populasi ikan",
      "Dengan memungkinkan otoritas untuk melacak dan menemukan alat tangkap yang hilang dengan lebih efisien",
      "Dengan membatasi jumlah kapal penangkap ikan di daerah tersebut",
      "Dengan lebih mudah mengidentifikasi operasi penangkapan ikan ilegal"
    ],
    "answer": "Dengan memungkinkan otoritas untuk melacak dan menemukan alat tangkap yang hilang dengan lebih efisien"
  },
  {
    "question": "Analisis risiko dan manfaat dari larangan total terhadap penangkapan ikan dengan jaring trawl di Zona Ekonomi Eksklusif (ZEE) Indonesia. Apa yang mungkin menjadi pengorbanan yang paling signifikan?",
    "choices": [
      "Peningkatan keanekaragaman hayati versus pengurangan hasil tangkapan ikan jangka pendek",
      "Pemulihan terumbu karang versus peningkatan penangkapan ikan ilegal",
      "Peningkatan populasi ikan versus hilangnya mata pencaharian nelayan",
      "Perlindungan habitat laut versus peningkatan persaingan dari negara asing",
      "Lingkungan laut yang lebih bersih versus penurunan harga pasar ikan"
    ],
    "answer": "Peningkatan populasi ikan versus hilangnya mata pencaharian nelayan"
  },
  {
    "question": "How could the integration of local knowledge with scientific research enhance efforts to prevent destructive fishing practices in Indonesia?",
    "choices": [
      "By encouraging traditional methods that are less harmful",
      "By allowing local communities to manage fisheries independently",
      "By combining modern technology with local sustainable practices",
      "By reducing the need for government intervention",
      "By preventing scientific advances from influencing fishing regulations"
    ],
    "answer": "By combining modern technology with local sustainable practices"
  }
];
})();