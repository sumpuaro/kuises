(function () {
    const quizId = "Kuis 0.8"; // Ubah ini untuk setiap kuis yang berbeda
    let currentQuestion = 0;
    let score = 0;
    let timer;
    let questions = [];
    let userData = {};
    let isQuizActive = false;

    // Validasi waktu akses
    function validateAccess() {
        const now = new Date();
        const startTime = new Date('2024-11-12T10:00:00');
        const endTime = new Date('2024-11-12T10:20:00');

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
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
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
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
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
    document.addEventListener('DOMContentLoaded', function () {
        const quizInfoElement = document.getElementById('quiz-info');
        if (quizInfoElement) {
            quizInfoElement.textContent = `${quizId}. Selamat Bekerja Semoga Sukses.`;
        }

        const clearAccessBtn = document.getElementById('clear-access-btn');
        clearAccessBtn.addEventListener('click', clearAllAccess);
        clearAccessBtn.classList.remove('hidden');

        document.getElementById('start-btn').addEventListener('click', startQuiz);
        document.getElementById('submit-btn').addEventListener('click', submitAnswer);
        document.getElementById('exit-fullscreen').addEventListener('click', function () {
            isQuizActive = false;
            exitFullscreen();
        });
    });

    // Prevent shortcuts and right-click
    window.blockShortcuts = function (e) {
        if (e.keyCode == 123 || (e.ctrlKey && e.shiftKey && (e.keyCode == 'I'.charCodeAt(0) || e.keyCode == 'J'.charCodeAt(0))) || (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0))) {
            e.preventDefault();
            return false;
        }
    };

    document.oncontextmenu = function (e) {
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
            "question": "Apa tujuan utama penggunaan validasi data dalam Microsoft Access?",
            "choices": [
                "Mempercepat proses pengolahan data",
                "Membuat tampilan database lebih menarik",
                "Memastikan data yang dimasukkan sesuai dengan aturan dan akurat",
                "Mengurangi ukuran file database",
                "Mengoptimasi kinerja query"
            ],
            "answer": "Memastikan data yang dimasukkan sesuai dengan aturan dan akurat"
        },
        {
            "question": "Dalam Microsoft Access, ekspresi (expression) digunakan untuk...",
            "choices": [
                "Membuat struktur tabel baru",
                "Melakukan operasi matematika dan manipulasi teks pada data",
                "Menghapus record yang tidak diperlukan",
                "Mengatur tampilan form",
                "Membuat backup database"
            ],
            "answer": "Melakukan operasi matematika dan manipulasi teks pada data"
        },
        {
            "question": "Komponen apa yang wajib ada dalam pembuatan laporan dasar Microsoft Access?",
            "choices": [
                "Gambar latar belakang dan logo",
                "Video tutorial penggunaan",
                "Header, footer, dan konten data",
                "Animasi dan efek visual",
                "Musik latar dan suara"
            ],
            "answer": "Header, footer, dan konten data"
        },
        {
            "question": "Bagaimana cara yang tepat untuk menangani data yang tidak valid dalam Microsoft Access?",
            "choices": [
                "Membiarkan data tetap tersimpan",
                "Menghapus seluruh record",
                "Menampilkan pesan kesalahan dan mencegah penyimpanan",
                "Mengabaikan validasi data",
                "Menonaktifkan form input"
            ],
            "answer": "Menampilkan pesan kesalahan dan mencegah penyimpanan"
        },
        {
            "question": "Apa karakteristik utama dari laporan kompleks dalam Microsoft Access?",
            "choices": [
                "Hanya menampilkan satu jenis data",
                "Menggunakan multiple sumber data dan perhitungan lanjut",
                "Tidak memerlukan header",
                "Tidak bisa dicetak",
                "Hanya bisa dibuka oleh admin"
            ],
            "answer": "Menggunakan multiple sumber data dan perhitungan lanjut"
        },
        {
            "question": "Bagaimana jenis data Yes/No direpresentasikan dalam form Microsoft Access?",
            "choices": [
                "Sebagai angka 1 dan 0",
                "Sebagai teks 'Ya' dan 'Tidak'",
                "Sebagai checkbox atau kotak centang",
                "Sebagai tombol radio",
                "Sebagai dropdown menu"
            ],
            "answer": "Sebagai checkbox atau kotak centang"
        },
        {
            "question": "Apa fungsi utama fitur lampiran (attachment) dalam Microsoft Access?",
            "choices": [
                "Menyimpan file eksternal dalam database",
                "Membuat backup otomatis",
                "Mengkompresi database",
                "Membuat shortcut file",
                "Menghubungkan antar tabel"
            ],
            "answer": "Menyimpan file eksternal dalam database"
        },
        {
            "question": "Apa tujuan utama penggunaan form navigasi dalam Microsoft Access?",
            "choices": [
                "Mencari data dalam tabel",
                "Membuat laporan otomatis",
                "Memudahkan perpindahan antar form dalam database",
                "Menghapus record",
                "Mengubah struktur tabel"
            ],
            "answer": "Memudahkan perpindahan antar form dalam database"
        },
        {
            "question": "Dalam pengaturan form Microsoft Access, apa fungsi dari tab order?",
            "choices": [
                "Mengurutkan data dalam tabel",
                "Mengatur urutan form yang dibuka",
                "Mengatur urutan perpindahan kursor saat menekan tombol Tab",
                "Mengurutkan field dalam tabel",
                "Mengatur urutan laporan"
            ],
            "answer": "Mengatur urutan perpindahan kursor saat menekan tombol Tab"
        },
        {
            "question": "Apa yang dimaksud dengan sub-laporan (subreport) dalam Microsoft Access?",
            "choices": [
                "Laporan cadangan",
                "Laporan yang ditempatkan di dalam laporan utama",
                "Laporan yang belum selesai",
                "Laporan yang sudah dihapus",
                "Laporan versi lama"
            ],
            "answer": "Laporan yang ditempatkan di dalam laporan utama"
        },
        {
            "question": "Bagaimana cara meningkatkan tampilan form di Microsoft Access?",
            "choices": [
                "Menghapus semua kontrol",
                "Menggunakan tema, warna, dan elemen desain yang sesuai",
                "Menonaktifkan semua validasi",
                "Menghilangkan semua label",
                "Menghapus semua tombol"
            ],
            "answer": "Menggunakan tema, warna, dan elemen desain yang sesuai"
        },
        {
            "question": "Apa manfaat utama validasi data dalam Microsoft Access?",
            "choices": [
                "Mempercepat input data",
                "Menghemat ruang penyimpanan",
                "Menjamin integritas dan akurasi data",
                "Mempercantik tampilan form",
                "Mengurangi jumlah tabel"
            ],
            "answer": "Menjamin integritas dan akurasi data"
        },
        {
            "question": "Jenis file apa yang dapat disimpan sebagai lampiran dalam Microsoft Access?",
            "choices": [
                "Hanya file teks",
                "Hanya file gambar",
                "Berbagai jenis file seperti dokumen, gambar, dan file lainnya",
                "Hanya file database",
                "Hanya file Excel"
            ],
            "answer": "Berbagai jenis file seperti dokumen, gambar, dan file lainnya"
        },
        {
            "question": "Apa kemampuan yang dimiliki ekspresi dalam Microsoft Access?",
            "choices": [
                "Hanya melakukan penjumlahan",
                "Hanya memanipulasi teks",
                "Melakukan perhitungan matematik dan manipulasi data dengan logika",
                "Hanya membuat grafik",
                "Hanya mengurutkan data"
            ],
            "answer": "Melakukan perhitungan matematik dan manipulasi data dengan logika"
        },
        {
            "question": "Bagaimana langkah dasar membuat laporan dalam Microsoft Access?",
            "choices": [
                "Langsung mencetak database",
                "Memilih data yang relevan dan menyusunnya secara terstruktur",
                "Mengimpor laporan dari Excel",
                "Menggabungkan semua tabel",
                "Mengkonversi form menjadi laporan"
            ],
            "answer": "Memilih data yang relevan dan menyusunnya secara terstruktur"
        },
        {
            "question": "Apa yang dimaksud dengan form event dalam Microsoft Access?",
            "choices": [
                "Jadwal penggunaan form",
                "Kejadian yang memicu aksi tertentu dalam form",
                "Daftar form yang tersedia",
                "Cara membuka form",
                "Waktu pembuatan form"
            ],
            "answer": "Kejadian yang memicu aksi tertentu dalam form"
        },
        {
            "question": "Di mana ekspresi dapat diterapkan dalam Microsoft Access?",
            "choices": [
                "Hanya di dalam tabel",
                "Hanya di dalam query",
                "Dalam field tabel, query, form, dan laporan",
                "Hanya di dalam form",
                "Hanya di dalam laporan"
            ],
            "answer": "Dalam field tabel, query, form, dan laporan"
        },
        {
            "question": "Apa fungsi utama format teks dalam laporan Microsoft Access?",
            "choices": [
                "Menghemat tinta printer",
                "Meningkatkan keterbacaan dan presentasi data",
                "Mengurangi ukuran file",
                "Mempercepat proses cetak",
                "Mengenkripsi data"
            ],
            "answer": "Meningkatkan keterbacaan dan presentasi data"
        },
        {
            "question": "Apa yang dimaksud dengan properti form dalam Microsoft Access?",
            "choices": [
                "Harga pembuatan form",
                "Pengaturan yang mengontrol perilaku dan tampilan form",
                "Ukuran file form",
                "Alamat penyimpanan form",
                "Pembuat form"
            ],
            "answer": "Pengaturan yang mengontrol perilaku dan tampilan form"
        },
        {
            "question": "Bagaimana cara meningkatkan efisiensi navigasi dalam database Microsoft Access?",
            "choices": [
                "Mengurangi jumlah form",
                "Mengimplementasikan sistem form navigasi yang terstruktur",
                "Menghapus semua form",
                "Menonaktifkan beberapa form",
                "Menyembunyikan form"
            ],
            "answer": "Mengimplementasikan sistem form navigasi yang terstruktur"
        },
        {
            "question": "Apa manfaat pengelompokan data dalam laporan Microsoft Access?",
            "choices": [
                "Mengurangi jumlah halaman",
                "Mengorganisasi informasi secara logis dan terstruktur",
                "Mempercepat proses cetak",
                "Menghemat tinta printer",
                "Mengurangi ukuran file"
            ],
            "answer": "Mengorganisasi informasi secara logis dan terstruktur"
        },
        {
            "question": "Elemen visual apa yang dapat ditambahkan ke laporan untuk visualisasi data?",
            "choices": [
                "Video tutorial",
                "Musik latar",
                "Grafik, bagan, dan elemen visual lainnya",
                "Animasi 3D",
                "Game interaktif"
            ],
            "answer": "Grafik, bagan, dan elemen visual lainnya"
        },
        {
            "question": "Bagaimana cara membuat form yang user-friendly dalam Microsoft Access?",
            "choices": [
                "Menghilangkan semua label",
                "Menggunakan desain yang intuitif dan tata letak yang logis",
                "Menonaktifkan validasi",
                "Menghapus semua tombol",
                "Menyembunyikan field"
            ],
            "answer": "Menggunakan desain yang intuitif dan tata letak yang logis"
        },
        {
            "question": "Apa tujuan utama kontrol data input dalam form Microsoft Access?",
            "choices": [
                "Mempercepat input data",
                "Memastikan data yang dimasukkan sesuai format dan valid",
                "Mengurangi ukuran database",
                "Mengenkripsi data",
                "Membatasi akses pengguna"
            ],
            "answer": "Memastikan data yang dimasukkan sesuai format dan valid"
        },
        {
            "question": "Bagaimana cara mengatur alur kerja yang efektif dalam form navigasi?",
            "choices": [
                "Menghapus semua form",
                "Mengatur urutan dan hierarki navigasi secara logis",
                "Menonaktifkan navigasi",
                "Menyembunyikan tombol navigasi",
                "Menghilangkan menu"
            ],
            "answer": "Mengatur urutan dan hierarki navigasi secara logis"
        }
    ];
})();