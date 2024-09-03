(function(){
    let currentQuestion = 0;
    let score = 0;
    let timer;
    let questions = [];
    let userData = {};
    let isQuizActive = false;

    // Validasi waktu akses
    function validateAccess() {
        const now = new Date();
        const startTime = new Date('2023-09-03T10:00:00');
        const endTime = new Date('2025-09-03T10:30:00');

        if (now < startTime || now > endTime) {
            alert('Akses kuis hanya tersedia pada 3 September 2024 pukul 10:00 - 10:30.');
            return false;
        }
        return true;
    }

    // Cek akses ganda
    function checkDuplicateAccess(fullname, nim, angkatan) {
        const accessKey = `${fullname}_${nim}_${angkatan}`;
        if (localStorage.getItem(accessKey)) {
            alert('Anda sudah mengakses kuis ini sebelumnya.');
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

    // Event listeners
    document.addEventListener('DOMContentLoaded', function() {
        document.getElementById('start-btn').addEventListener('click', startQuiz);
        document.getElementById('submit-btn').addEventListener('click', submitAnswer);
        document.getElementById('exit-fullscreen').addEventListener('click', function() {
            isQuizActive = false;
            exitFullscreen();
        });
    });

    // Prevent shortcuts and right-click
    window.blockShortcuts = function(e) {
        // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
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


// Prevent back function
history.pushState(null, null, location.href);
window.onpopstate = function () {
    history.go(1);
};

// Tambahkan fungsi sendResultToGoogleSheet di sini
function sendResultToGoogleSheet(fullName, nim, score) {
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbyAhd57b2t_OUTL104DxVE6e4vqNZV3EMyDOzElZEnLRXVqXAAAyA1bDJ_3Cds3_i8V/exec';
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0]; // Format: HH:MM:SS

  const data = {
    fullName: fullName,
    nim: nim,
    score: score,
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
  });
}

    // Quiz questions
    questions = [
      {
        "question": "Apa tujuan utama dari materi praktikum 'Import Data' dalam Microsoft Access?",
        "choices": [
          "Membuat tabel baru",
          "Mengintegrasikan data dari sumber eksternal",
          "Menghapus data yang sudah ada",
          "Membuat query",
          "Merancang form"
        ],
        "answer": "Mengintegrasikan data dari sumber eksternal"
      },
      {
        "question": "Dalam proses impor data dari Microsoft Excel ke Access, apa yang dimaksud dengan 'range sel'?",
        "choices": [
          "Jumlah total sel dalam spreadsheet",
          "Ukuran font dalam sel",
          "Rentang sel yang akan diimpor",
          "Warna latar belakang sel",
          "Jumlah sheet dalam file Excel"
        ],
        "answer": "Rentang sel yang akan diimpor"
      },
      {
        "question": "Apa kepanjangan dari CSV dalam konteks impor file berbasis teks?",
        "choices": [
          "Computer Stored Values",
          "Comma-Separated Values",
          "Custom Structured Variables",
          "Column Sorted View",
          "Central Storage Vault"
        ],
        "answer": "Comma-Separated Values"
      },
      {
        "question": "Apa fungsi dari 'wizard import teks' dalam Microsoft Access?",
        "choices": [
          "Untuk membuat tabel baru",
          "Untuk menganalisis dan mengimpor data dari file teks",
          "Untuk menerjemahkan teks",
          "Untuk membuat laporan",
          "Untuk membuat makro"
        ],
        "answer": "Untuk menganalisis dan mengimpor data dari file teks"
      },
      {
        "question": "Dalam konteks impor file teks, apa yang dimaksud dengan 'delimiter'?",
        "choices": [
          "Jumlah baris dalam file",
          "Karakter yang memisahkan kolom data",
          "Jenis font yang digunakan",
          "Ukuran file",
          "Ekstensi file"
        ],
        "answer": "Karakter yang memisahkan kolom data"
      },
      {
        "question": "Apa yang harus dilakukan jika terjadi ketidakcocokan tipe data saat mengimpor dari Excel ke Access?",
        "choices": [
          "Mengabaikan data tersebut",
          "Menghapus seluruh data",
          "Menyesuaikan tipe data di Access atau sumber data",
          "Membuat tabel baru",
          "Mengekspor kembali ke Excel"
        ],
        "answer": "Menyesuaikan tipe data di Access atau sumber data"
      },
      {
        "question": "Apa tujuan dari merancang tampilan lembar data yang efektif?",
        "choices": [
          "Untuk membuat database lebih besar",
          "Untuk mempercepat komputer",
          "Untuk memudahkan pembacaan dan interpretasi data",
          "Untuk mengenkripsi data",
          "Untuk mengurangi ukuran file"
        ],
        "answer": "Untuk memudahkan pembacaan dan interpretasi data"
      },
      {
        "question": "Bagaimana cara menyesuaikan lebar kolom dalam tampilan lembar data Access?",
        "choices": [
          "Menggunakan keyboard shortcut Ctrl+L",
          "Menarik tepi kolom dengan mouse",
          "Menghapus dan membuat ulang kolom",
          "Mengimpor ulang data",
          "Menggunakan menu View"
        ],
        "answer": "Menarik tepi kolom dengan mouse"
      },
      {
        "question": "Apa yang dimaksud dengan 'sorting' dalam konteks tampilan lembar data?",
        "choices": [
          "Menghapus data",
          "Mengurutkan data berdasarkan kriteria tertentu",
          "Membuat tabel baru",
          "Mengenkripsi data",
          "Mengubah tipe data"
        ],
        "answer": "Mengurutkan data berdasarkan kriteria tertentu"
      },
      {
        "question": "Apa manfaat dari memfilter data dalam tampilan lembar data?",
        "choices": [
          "Untuk menghapus data yang tidak diinginkan",
          "Untuk mengubah tipe data",
          "Untuk menampilkan hanya data yang relevan sesuai kriteria",
          "Untuk membuat tabel baru",
          "Untuk mengenkripsi data"
        ],
        "answer": "Untuk menampilkan hanya data yang relevan sesuai kriteria"
      },
      {
        "question": "Bagaimana cara menambahkan catatan baru dalam tampilan lembar data Access?",
        "choices": [
          "Dengan mengklik tombol 'New Record'",
          "Dengan menghapus catatan lama",
          "Dengan mengimpor data baru",
          "Dengan membuat tabel baru",
          "Dengan menggunakan query"
        ],
        "answer": "Dengan mengklik tombol 'New Record'"
      },
      {
        "question": "Apa yang dimaksud dengan 'baris judul' dalam konteks impor data dari Excel?",
        "choices": [
          "Baris pertama yang berisi nama kolom",
          "Baris terakhir dalam spreadsheet",
          "Jumlah total baris dalam file",
          "Baris yang berisi formula",
          "Baris yang memiliki format berbeda"
        ],
        "answer": "Baris pertama yang berisi nama kolom"
      },
      {
        "question": "Tipe file teks apa yang umumnya digunakan selain CSV untuk impor data ke Access?",
        "choices": [
          "DOC",
          "PDF",
          "TXT dengan delimiter tab",
          "JPG",
          "MP3"
        ],
        "answer": "TXT dengan delimiter tab"
      },
      {
        "question": "Apa fungsi dari 'penanganan tanda kutip teks' dalam proses impor file teks?",
        "choices": [
          "Untuk menghias teks",
          "Untuk mengenkripsi data",
          "Untuk memisahkan field yang mengandung delimiter",
          "Untuk mengubah font",
          "Untuk menghapus teks"
        ],
        "answer": "Untuk memisahkan field yang mengandung delimiter"
      },
      {
        "question": "Dalam tampilan lembar data, bagaimana cara tercepat untuk mengurutkan data berdasarkan satu kolom?",
        "choices": [
          "Menggunakan query",
          "Membuat tabel baru",
          "Mengklik header kolom",
          "Menghapus dan memasukkan ulang data",
          "Mengimpor ulang data"
        ],
        "answer": "Mengklik header kolom"
      },
      {
        "question": "Apa yang dimaksud dengan 'pemetaan tipe data' dalam proses impor dari Excel?",
        "choices": [
          "Menggambar peta data",
          "Mencocokkan tipe data Excel dengan tipe data Access",
          "Mengubah semua data menjadi teks",
          "Menghapus data yang tidak sesuai",
          "Membuat tabel baru untuk setiap tipe data"
        ],
        "answer": "Mencocokkan tipe data Excel dengan tipe data Access"
      },
      {
        "question": "Bagaimana cara terbaik untuk menangani nilai yang hilang saat mengimpor data?",
        "choices": [
          "Mengabaikan seluruh baris dengan nilai yang hilang",
          "Mengisi nilai yang hilang dengan angka acak",
          "Menentukan nilai default atau menggunakan null",
          "Menghapus kolom dengan nilai yang hilang",
          "Membatalkan seluruh proses impor"
        ],
        "answer": "Menentukan nilai default atau menggunakan null"
      },
      {
        "question": "Apa fungsi dari filter 'Advanced Filter/Sort' dalam Access?",
        "choices": [
          "Untuk menghapus data",
          "Untuk membuat query kompleks tanpa SQL",
          "Untuk mengubah tipe data",
          "Untuk mengenkripsi data",
          "Untuk membuat tabel baru"
        ],
        "answer": "Untuk membuat query kompleks tanpa SQL"
      },
      {
        "question": "Tipe data apa yang paling tepat untuk menyimpan angka desimal dalam Microsoft Access?",
        "choices": ["Integer", "Text", "Currency", "Long Integer", "Double"],
        "answer": "Double"
      },
      {
        "question": "Bagaimana cara terbaik untuk mempersiapkan file CSV sebelum diimpor ke Access?",
        "choices": [
          "Mengenkripsi file",
          "Mengubah ekstensi file",
          "Memastikan konsistensi format dan membersihkan data",
          "Menghapus semua spasi dalam file",
          "Menggabungkan semua kolom menjadi satu"
        ],
        "answer": "Memastikan konsistensi format dan membersihkan data"
      }
    ];
})();