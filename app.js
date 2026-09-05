// ======================================
// REWARDKU - SISTEM POIN
// ======================================

const DEFAULT_POINTS = 1250;

// Ambil poin yang tersimpan
let points = Number(localStorage.getItem("rewardku_points"));

if (isNaN(points)) {
  points = DEFAULT_POINTS;
  localStorage.setItem("rewardku_points", points);
}

// Tampilkan poin
function updatePoints() {
  const pointsElement = document.getElementById("points");

  if (pointsElement) {
    pointsElement.textContent =
      points.toLocaleString("id-ID");
  }
}

// Jalankan saat halaman dibuka
updatePoints();


// ======================================
// TANGGAL HARI INI
// ======================================

function getToday() {
  const date = new Date();

  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0");
}


// ======================================
// CEK MISI SUDAH DIKLAIM
// ======================================

function isMissionClaimed(mission) {

  const claimed =
    JSON.parse(
      localStorage.getItem("rewardku_missions") || "{}"
    );

  return claimed[mission] === getToday();
}


// ======================================
// SIMPAN MISI
// ======================================

function saveMission(mission) {

  const claimed =
    JSON.parse(
      localStorage.getItem("rewardku_missions") || "{}"
    );

  claimed[mission] = getToday();

  localStorage.setItem(
    "rewardku_missions",
    JSON.stringify(claimed)
  );
}


// ======================================
// KLAIM MISI
// ======================================

function claimMission(mission, reward) {

  if (isMissionClaimed(mission)) {

    alert(
      "⚠️ Misi ini sudah kamu klaim hari ini."
    );

    return;
  }

  points += reward;

  localStorage.setItem(
    "rewardku_points",
    points
  );

  saveMission(mission);

  updatePoints();

  alert(
    "🎉 Selamat!\n\n" +
    "+" + reward + " ⭐ berhasil ditambahkan!"
  );
}


// ======================================
// TOMBOL UMUM
// ======================================

function showMessage(message) {

  alert(
    "🚀 " + message +
    "\n\nFitur ini sedang kita siapkan."
  );
}


// ======================================
// BAGIKAN APLIKASI
// ======================================

function shareApp() {

  const shareData = {
    title: "RewardKu",
    text: "Yuk coba RewardKu dan kumpulkan poin!",
    url: window.location.href
  };

  if (navigator.share) {

    navigator.share(shareData)
      .catch(() => {});

  } else {

    alert(
      "📤 Salin link RewardKu dan bagikan ke temanmu!"
    );

  }
}
