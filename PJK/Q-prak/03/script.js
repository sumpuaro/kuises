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
        const startTime = new Date('2024-09-11T13:00:00');
        const endTime = new Date('20245-09-11T13:30:00');

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
        "question": "Apa yang dimaksud dengan ImageCollection dalam Google Earth Engine?",
        "choices": ["Kumpulan gambar acak", "Struktur penyimpanan data yang mengorganisir banyak gambar", "Album foto digital", "Folder berisi file gambar", "Kumpulan metadata citra"],
        "answer": "Struktur penyimpanan data yang mengorganisir banyak gambar"
      },
      {
        "question": "Apa fungsi dari metode filterDate pada ImageCollection?",
        "choices": ["Menghapus gambar dari koleksi", "Memperbaiki kualitas gambar", "Menyaring gambar berdasarkan rentang tanggal tertentu", "Mengubah format tanggal gambar", "Mengurutkan gambar berdasarkan tanggal"],
        "answer": "Menyaring gambar berdasarkan rentang tanggal tertentu"
      },
      {
        "question": "Metode apa yang digunakan untuk memilih gambar pertama dari ImageCollection?",
        "choices": ["select()", "first()", "get()", "head()", "start()"],
        "answer": "first()"
      },
      {
        "question": "Apa yang dimaksud dengan 'surface reflectance' dalam konteks citra satelit?",
        "choices": ["Pantulan cahaya dari permukaan air", "Estimasi rasio radiasi ke atas dan ke bawah di permukaan Bumi", "Refleksi atmosfer", "Pantulan cahaya dari awan", "Kecerahan permukaan Bumi"],
        "answer": "Estimasi rasio radiasi ke atas dan ke bawah di permukaan Bumi"
      },
      {
        "question": "Apa keuntungan menggunakan citra komposit pra-olah dibandingkan citra tunggal?",
        "choices": ["Lebih murah", "Resolusi lebih tinggi", "Mengurangi pengaruh awan dan artefak atmosfer", "Ukuran file lebih kecil", "Warna lebih cerah"],
        "answer": "Mengurangi pengaruh awan dan artefak atmosfer"
      },
      {
        "question": "Dataset apa yang digunakan untuk memetakan area terbakar bulanan menggunakan data MODIS?",
        "choices": ["MODIS/006/MOD09GA", "MODIS/006/MCD43A4", "MODIS/006/MCD64A1", "MODIS/006/MOD11A1", "MODIS/006/MYD13Q1"],
        "answer": "MODIS/006/MCD64A1"
      },
      {
        "question": "Apa yang diukur oleh dataset metana dari Sentinel-5 yang tersedia di Earth Engine?",
        "choices": ["Konsentrasi metana di permukaan", "Volume mixing ratio metana di udara kering", "Emisi metana dari industri", "Penyerapan metana oleh tumbuhan", "Produksi metana dari ternak"],
        "answer": "Volume mixing ratio metana di udara kering"
      },
      {
        "question": "Dataset apa yang menyediakan data suhu udara bulanan dalam Earth Engine?",
        "choices": ["MODIS Land Surface Temperature", "ECMWF/ERA5/MONTHLY", "NOAA Global Surface Temperature", "NASA GISS Surface Temperature Analysis", "HadCRUT4"],
        "answer": "ECMWF/ERA5/MONTHLY"
      },
      {
        "question": "Berapa jumlah kelas tutupan lahan yang digunakan dalam dataset ESA WorldCover?",
        "choices": ["5", "8", "11", "15", "20"],
        "answer": "11"
      },
      {
        "question": "Apa yang menjadi tahun dasar (base year) untuk analisis perubahan hutan global dalam dataset Hansen et al.?",
        "choices": ["1990", "1995", "2000", "2005", "2010"],
        "answer": "2000"
      },
      {
        "question": "Dataset apa yang menyediakan estimasi jumlah populasi untuk setiap sel grid di seluruh permukaan Bumi?",
        "choices": ["WorldPop", "LandScan", "GHSL", "GPWv411", "Oak Ridge National Laboratory Global Population Dataset"],
        "answer": "GPWv411"
      },
      {
        "question": "Apa kepanjangan dari DEM dalam konteks data elevasi?",
        "choices": ["Digital Elevation Model", "Data Elevation Measurement", "Digital Earth Map", "Detailed Elevation Matrix", "Digital Elevation Measurement"],
        "answer": "Digital Elevation Model"
      },
      {
        "question": "Apa nama dataset DEM global yang tersedia di Earth Engine dan diproduksi oleh NASA?",
        "choices": ["SRTM", "ASTER GDEM", "NASADEM", "ALOS World 3D", "TanDEM-X"],
        "answer": "NASADEM"
      },
      {
        "question": "Apa fungsi dari metode filterBounds pada ImageCollection?",
        "choices": ["Menyaring gambar berdasarkan resolusi spasial", "Menyaring gambar berdasarkan lokasi geografis", "Menyaring gambar berdasarkan ukuran file", "Menyaring gambar berdasarkan kualitas", "Menyaring gambar berdasarkan sensor"],
        "answer": "Menyaring gambar berdasarkan lokasi geografis"
      },
      {
        "question": "Dalam visualisasi citra Landsat, apa yang biasanya direpresentasikan oleh kombinasi band 4-3-2?",
        "choices": ["Citra inframerah", "Citra ultraviolet", "Citra true color", "Citra false color", "Citra termal"],
        "answer": "Citra true color"
      },
      {
        "question": "Apa yang dimaksud dengan 'palette' dalam parameter visualisasi Earth Engine?",
        "choices": ["Ukuran gambar", "Skala warna untuk menampilkan data", "Format file gambar", "Resolusi spasial", "Tingkat transparansi"],
        "answer": "Skala warna untuk menampilkan data"
      },
      {
        "question": "Berapa lama periode pengambilan data yang digunakan untuk menghasilkan komposit harian MODIS MCD43A4?",
        "choices": ["7 hari", "16 hari", "30 hari", "60 hari", "90 hari"],
        "answer": "16 hari"
      },
      {
        "question": "Apa satuan suhu yang digunakan dalam dataset ERA5 Monthly?",
        "choices": ["Celsius", "Fahrenheit", "Kelvin", "Rankine", "Réaumur"],
        "answer": "Kelvin"
      },
      {
        "question": "Apa yang direpresentasikan oleh band 'lossyear' dalam dataset Global Forest Change?",
        "choices": ["Tahun penanaman hutan", "Tahun terjadinya kebakaran hutan", "Tahun hilangnya tutupan hutan", "Tahun pemulihan hutan", "Tahun pengukuran tutupan hutan"],
        "answer": "Tahun hilangnya tutupan hutan"
      },
      {
        "question": "Apa fungsi dari Map.centerObject() dalam script Earth Engine?",
        "choices": ["Memperbesar gambar", "Mengubah proyeksi peta", "Memusatkan tampilan peta pada objek tertentu", "Mengubah orientasi peta", "Menambahkan objek ke peta"],
        "answer": "Memusatkan tampilan peta pada objek tertentu"
      }
    ];
})();