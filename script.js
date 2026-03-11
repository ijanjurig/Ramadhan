// ========================
// 1. INISIALISASI ELEMEN
// ========================
const tbody = document.getElementById("jadwalBody");
const countdownEl = document.getElementById("countdown");
const tanggalEl = document.getElementById("tanggalSekarang");
const ramadhanEl = document.getElementById("ramadhanHari");

// ========================
// 2. RENDER TABEL JADWAL (Membaca dari file JS-mu)
// ========================
if (typeof jadwal !== 'undefined') {
    jadwal.forEach(data => {
        let row = `
        <tr id="hari-${data.hari}">
            <td>${data.hari}</td>
            <td>${data.imsak}</td>
            <td>${data.subuh}</td>
            <td>${data.dzuhur}</td>
            <td>${data.ashar}</td>
            <td style="color: #d4af37; font-weight: bold; font-size: 15px;">${data.maghrib}</td>
            <td>${data.isya}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
} else {
    console.error("Data jadwal tidak ditemukan! Pastikan file jadwal JS dimuat lebih dulu di HTML.");
}

// ========================
// 3. TANGGAL HARI INI
// ========================
let now = new Date();
tanggalEl.innerHTML = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
});

// ========================
// 4. HITUNG HARI RAMADHAN (Awal puasa 19 Feb 2026)
// ========================
const awalRamadhan = new Date("2026-02-19");
awalRamadhan.setHours(0,0,0,0);
let selisihHari = Math.floor((new Date().setHours(0,0,0,0) - awalRamadhan) / (1000 * 60 * 60 * 24)) + 1;

if (selisihHari > 0 && selisihHari <= 30) {
    ramadhanEl.innerHTML = "Hari ke-" + selisihHari + " Ramadhan 1447 H";
} else {
    ramadhanEl.innerHTML = "Di luar periode Ramadhan";
}

// ==========================================
// 5. FUNGSI NOTIFIKASI ALARM DI LAYAR HP
// ==========================================
if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("Notifikasi diizinkan!");
        }
    });
}

function munculkanNotifAlarm(namaSholat) {
    if ("Notification" in window && Notification.permission === "granted") {
        const notifikasi = new Notification("Waktu " + namaSholat + " Tiba! 🕌", {
            body: "Ketuk untuk mematikan suara adzan.",
            icon: "https://cdn-icons-png.flaticon.com/512/1173/1173714.png", // Ikon masjid
            vibrate: [200, 100, 200, 100, 200, 100, 200], 
            requireInteraction: true 
        });

        notifikasi.onclick = function() {
            matikanAdzan(); 
            window.focus(); 
            notifikasi.close(); 
        };
    }
}

// ========================
// 6. COUNTDOWN & ALARM OTOMATIS
// ========================
let isAdzanPlayed = false;

function updateCountdown() {
    if (typeof jadwal === 'undefined') return;

    if (selisihHari > 0 && selisihHari <= 30) {
        if (!jadwal[selisihHari - 1]) return; 
        
        const todayData = jadwal[selisihHari - 1];
        const currentTime = new Date();

        const jadwalSholat = [
            { nama: "Imsak", waktu: todayData.imsak },
            { nama: "Subuh", waktu: todayData.subuh },
            { nama: "Dzuhur", waktu: todayData.dzuhur },
            { nama: "Ashar", waktu: todayData.ashar },
            { nama: "Maghrib", waktu: todayData.maghrib },
            { nama: "Isya", waktu: todayData.isya }
        ];

        let waktuSelanjutnya = null;
        let namaSelanjutnya = "";

        for (let i = 0; i < jadwalSholat.length; i++) {
            let [jam, menit] = jadwalSholat[i].waktu.split(":");
            let targetWaktu = new Date();
            targetWaktu.setHours(jam, menit, 0, 0);

            if (currentTime < targetWaktu) {
                waktuSelanjutnya = targetWaktu;
                namaSelanjutnya = jadwalSholat[i].nama;
                break;
            }
        }

        if (!waktuSelanjutnya) {
            if (selisihHari < 30 && jadwal[selisihHari]) {
                const besokData = jadwal[selisihHari];
                let [jam, menit] = besokData.imsak.split(":");
                waktuSelanjutnya = new Date();
                waktuSelanjutnya.setDate(waktuSelanjutnya.getDate() + 1);
                waktuSelanjutnya.setHours(jam, menit, 0, 0);
                namaSelanjutnya = "Imsak";
            } else {
                countdownEl.innerHTML = "Ramadhan Selesai";
                return;
            }
        }

        const selisihMs = waktuSelanjutnya - currentTime;
        const jam = Math.floor(selisihMs / 3600000);
        const menit = Math.floor((selisihMs % 3600000) / 60000);
        const detik = Math.floor((selisihMs % 60000) / 1000);

        countdownEl.innerHTML = `${String(jam).padStart(2,'0')}:${String(menit).padStart(2,'0')}:${String(detik).padStart(2,'0')}`;

        let judulEl = countdownEl.previousElementSibling;
        if (judulEl) {
            judulEl.innerText = namaSelanjutnya === "Maghrib" ? "⏳ Menuju Buka Puasa (Maghrib)" : `⏳ Menuju Waktu ${namaSelanjutnya}`;
        }

        // Fitur Bunyikan Alarm & Notifikasi HP
        const audioAdzan = document.getElementById("audioAdzan");
        const btnStopAdzan = document.getElementById("btnStopAdzan");

        if (jam === 0 && menit === 0 && detik === 0) {
            if (!isAdzanPlayed) {
                if (audioAdzan) {
                    audioAdzan.currentTime = 0;
                    audioAdzan.loop = true; 
                    audioAdzan.play().then(() => {
                        if (btnStopAdzan) btnStopAdzan.style.display = "block";
                    }).catch(e => console.log("Audio diblokir browser"));
                }
                
                munculkanNotifAlarm(namaSelanjutnya);
                isAdzanPlayed = true;
            }
        } else {
            isAdzanPlayed = false; 
        }

        // Progress Bar
        const targetMaghrib = new Date();
        const [hMaghrib, mMaghrib] = todayData.maghrib.split(":");
        targetMaghrib.setHours(hMaghrib, mMaghrib, 0, 0);

        const targetSubuh = new Date();
        const [hSubuh, mSubuh] = todayData.subuh.split(":");
        targetSubuh.setHours(hSubuh, mSubuh, 0, 0);

        const puasaProgress = document.getElementById("puasaProgress");
        const progressText = document.getElementById("progressText");

        if (puasaProgress && progressText) {
            if (currentTime >= targetSubuh && currentTime <= targetMaghrib) {
                let persen = ((currentTime - targetSubuh) / (targetMaghrib - targetSubuh)) * 100;
                puasaProgress.style.width = persen + "%";
                progressText.innerText = "Progres Puasa: " + Math.floor(persen) + "%";
            } else if (currentTime > targetMaghrib) {
                puasaProgress.style.width = "100%";
                progressText.innerText = "Alhamdulillah, sudah berbuka!";
            } else {
                puasaProgress.style.width = "0%";
                progressText.innerText = "Belum masuk waktu puasa hari ini";
            }
        }

    } else {
        countdownEl.innerHTML = "--:--:--";
    }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ========================
// 7. FUNGSI MATIKAN ADZAN & NAVIGASI
// ========================
function matikanAdzan() {
    const audioAdzan = document.getElementById("audioAdzan");
    const btnStopAdzan = document.getElementById("btnStopAdzan");
    if (audioAdzan) { audioAdzan.pause(); audioAdzan.currentTime = 0; }
    if (btnStopAdzan) { btnStopAdzan.style.display = "none"; }
}

function hariIni() {
    if (selisihHari > 0 && selisihHari <= 30) {
        const row = document.getElementById("hari-" + selisihHari);
        if (row) { row.scrollIntoView({ behavior: "smooth", block: "center" }); row.classList.add("highlight"); }
    }
}

function scrollAwal() { window.scrollTo({ top: 0, behavior: "smooth" }); }
function scrollAkhir() { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }
function toggleHighlight() {
    if (selisihHari > 0 && selisihHari <= 30) {
        const row = document.getElementById("hari-" + selisihHari);
        if (row) row.classList.toggle("highlight");
    }
}

// ========================
// 8. AUDIO DOA BUKA PUASA
// ========================
function playDoa() {
    const audioDoa = document.getElementById("audioDoa");
    if (audioDoa) { audioDoa.currentTime = 0; audioDoa.play(); }
}
function pauseDoa() {
    const audioDoa = document.getElementById("audioDoa");
    if (audioDoa) { audioDoa.pause(); }
}
importScripts("https://progressier.app/RMuvBXS4yQ0hC8vZUl2f/sw.js" );
// ========================
// 9. SERVICE WORKER (PWA)
// ========================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log("SW gagal:", err));
}
