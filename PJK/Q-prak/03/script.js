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
        const startTime = new Date('2024-09-04T13:00:00');
        const endTime = new Date('20245-09-04T13:30:00');

        if (now < startTime || now > endTime) {
            alert('Akses kuis hanya tersedia pada 4 September 2024 pukul 13:00 - 13:30.');
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
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbzw-jp-V7cV_zzJ5BOhtGCbTtgpQoteI0Vku6OP8717c1Zq0Vjyr3Mky6JWrnt5OxPy/exec';
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
    "question": "Apa yang dimaksud dengan 'raster data model' dalam konteks penginderaan jauh?",
    "choices": ["Model data vektor", "Model data tabular", "Model data dua dimensi dalam bentuk grid piksel", "Model data tiga dimensi", "Model data temporal"],
    "answer": "Model data dua dimensi dalam bentuk grid piksel"
  },
  {
    "question": "Apa yang dimaksud dengan 'DN' dalam konteks nilai piksel citra satelit?",
    "choices": ["Digital Network", "Data Number", "Digital Node", "Density Number", "Digital Number"],
    "answer": "Digital Number"
  },
  {
    "question": "Dalam komposit warna alami (natural color composite) Landsat, band mana yang digunakan untuk warna merah?",
    "choices": ["Band 1", "Band 2", "Band 3", "Band 4", "Band 5"],
    "answer": "Band 3"
  },
  {
    "question": "Apa yang dimaksud dengan 'false-color composite' dalam penginderaan jauh?",
    "choices": ["Komposit warna yang salah", "Komposit warna yang tidak alami", "Komposit warna yang hanya menggunakan warna primer", "Komposit warna yang menggunakan band inframerah", "Komposit warna yang tidak menggunakan band apapun"],
    "answer": "Komposit warna yang tidak alami"
  },
  {
    "question": "Dalam sistem warna aditif RGB, apa yang dihasilkan ketika warna merah dan hijau digabungkan?",
    "choices": ["Biru", "Kuning", "Cyan", "Magenta", "Putih"],
    "answer": "Kuning"
  },
  {
    "question": "Apa fungsi utama dari band inframerah dekat (near-infrared) dalam citra satelit?",
    "choices": ["Mendeteksi suhu permukaan", "Membedakan jenis hutan", "Mengukur kedalaman air", "Mendeteksi polusi udara", "Mengukur ketinggian terrain"],
    "answer": "Membedakan jenis hutan"
  },
  {
    "question": "Dalam Google Earth Engine, apa metode yang digunakan untuk menambahkan band baru ke citra yang sudah ada?",
    "choices": ["addLayer()", "select()", "rename()", "addBands()", "composite()"],
    "answer": "addBands()"
  },
  {
    "question": "Apa yang dimaksud dengan 'stable lights' dalam dataset cahaya malam DMSP-OLS?",
    "choices": ["Cahaya dari bintang", "Cahaya dari kota besar", "Cahaya yang konsisten sepanjang tahun", "Cahaya dari kebakaran hutan", "Cahaya dari petir"],
    "answer": "Cahaya yang konsisten sepanjang tahun"
  },
  {
    "question": "Dalam komposit perubahan cahaya malam, warna apa yang menunjukkan area yang terang di tahun 2013 tetapi gelap di tahun 2003 dan 1993?",
    "choices": ["Putih", "Merah", "Hijau", "Biru", "Kuning"],
    "answer": "Merah"
  },
  {
    "question": "Apa yang ditunjukkan oleh warna cyan dalam komposit RGB menggunakan sistem warna aditif?",
    "choices": ["Nilai tinggi di band merah dan hijau", "Nilai tinggi di band hijau dan biru", "Nilai tinggi di band merah dan biru", "Nilai tinggi di semua band", "Nilai rendah di semua band"],
    "answer": "Nilai tinggi di band hijau dan biru"
  },
  {
    "question": "Berapa jumlah band yang terdapat dalam citra Landsat 5 yang digunakan dalam contoh di dokumen?",
    "choices": ["3", "6", "7", "15", "19"],
    "answer": "19"
  },
  {
    "question": "Apa yang dimaksud dengan 'metadata' dalam konteks citra satelit?",
    "choices": ["Data tentang piksel", "Data tentang resolusi spasial", "Data deskriptif tentang citra", "Data tentang lokasi geografis", "Data tentang waktu akuisisi"],
    "answer": "Data deskriptif tentang citra"
  },
  {
    "question": "Apa metode yang digunakan untuk mencetak metadata citra ke Console panel di Google Earth Engine?",
    "choices": ["console.log()", "Map.addLayer()", "print()", "ee.Image()", "ee.print()"],
    "answer": "print()"
  },
  {
    "question": "Apa yang dimaksud dengan 'additive color system' dalam konteks visualisasi citra satelit?",
    "choices": ["Sistem warna yang mengurangi intensitas cahaya", "Sistem warna yang menambahkan pigmen", "Sistem warna yang menggabungkan warna primer cahaya", "Sistem warna yang menggunakan warna sekunder", "Sistem warna yang menggunakan skala keabuan"],
    "answer": "Sistem warna yang menggabungkan warna primer cahaya"
  },
  {
    "question": "Dalam komposit perubahan cahaya malam, apa yang ditunjukkan oleh warna kuning?",
    "choices": ["Area yang terang di 1993 dan 2003, tapi gelap di 2013", "Area yang terang di 2013 dan 2003, tapi gelap di 1993", "Area yang terang di 1993 dan 2013, tapi gelap di 2003", "Area yang gelap di semua tahun", "Area yang terang di semua tahun"],
    "answer": "Area yang terang di 2013 dan 2003, tapi gelap di 1993"
  },
  {
    "question": "Apa fungsi dari metode 'select()' dalam Google Earth Engine?",
    "choices": ["Memilih citra", "Memilih lokasi geografis", "Memilih band tertentu dari citra", "Memilih resolusi spasial", "Memilih waktu akuisisi"],
    "answer": "Memilih band tertentu dari citra"
  },
  {
    "question": "Apa yang ditunjukkan oleh warna putih dalam komposit RGB menggunakan sistem warna aditif?",
    "choices": ["Nilai rendah di semua band", "Nilai tinggi hanya di band merah", "Nilai tinggi hanya di band hijau", "Nilai tinggi hanya di band biru", "Nilai tinggi di semua band"],
    "answer": "Nilai tinggi di semua band"
  },
  {
    "question": "Apa yang dimaksud dengan 'true-color composite' dalam visualisasi citra satelit?",
    "choices": ["Komposit yang hanya menggunakan warna primer", "Komposit yang menggunakan band inframerah", "Komposit yang menyerupai apa yang dilihat mata manusia", "Komposit yang hanya menggunakan satu band", "Komposit yang menggunakan semua band citra"],
    "answer": "Komposit yang menyerupai apa yang dilihat mata manusia"
  },
  {
    "question": "Dalam Google Earth Engine, apa fungsi dari parameter 'min' dan 'max' saat menambahkan layer ke peta?",
    "choices": ["Menentukan ukuran piksel", "Menentukan resolusi spasial", "Menentukan rentang nilai untuk visualisasi", "Menentukan jumlah band", "Menentukan lokasi geografis"],
    "answer": "Menentukan rentang nilai untuk visualisasi"
  },
  {
    "question": "Apa yang ditunjukkan oleh gradien warna putih-kuning-merah di sekitar kota dalam komposit perubahan cahaya malam?",
    "choices": ["Penurunan populasi", "Peningkatan polusi udara", "Pola urban sprawl", "Perubahan suhu permukaan", "Perubahan vegetasi"],
    "answer": "Pola urban sprawl"
  }
];
})();