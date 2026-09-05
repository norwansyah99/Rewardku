// ======================================
// REWARDKU - SISTEM POIN & STATUS MISI
// ======================================

const DEFAULT_POINTS = 1250;

let points = Number(localStorage.getItem("rewardku_points"));

if (isNaN(points)) {
  points = DEFAULT_POINTS;
  localStorage.setItem("rewardku_points", points);
}


// ======================================
// TAMPILKAN POIN
// ======================================

function updatePoints() {
  const element = document.getElementById("points");

  if (element) {
    element.textContent = points.toLocaleString("id-ID");
  }
}


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
// DATA MISI
// ======================================

function getClaimedMissions() {
  return JSON.parse(
    localStorage.getItem("rewardku_missions") || "{}"
  );
}


// ======================================
// CEK MISI
// ======================================

function isMissionClaimed(mission) {

  const claimed = getClaimedMissions();

  return claimed[mission] === getToday();
}


// ======================================
// SIMPAN MISI
// ======================================

function saveMission(mission) {

  const claimed = getClaimedMissions();

  claimed[mission] = getToday();

  localStorage.setItem(
    "rewardku_missions",
    JSON.stringify(claimed)
  );
}


// ======================================
// CARI TOMBOL MISI
// ======================================

function getMissionButton(mission) {

  const cards = document.querySelectorAll(
    ".mission-card"
  );

  const missionOrder = [
    "iklan",
    "novel",
    "game",
    "shortvideo",
    "login"
  ];

  const index = missionOrder.indexOf(mission);

  if (index !== -1 && cards[index]) {
    return cards[index].querySelector("button");
  }

  return null;
}


// ======================================
// UPDATE STATUS TOMBOL
// ======================================

function updateMissionButtons() {

  const missions = [
    "iklan",
    "novel",
    "game",
    "shortvideo",
    "login"
  ];

  missions.forEach(function(mission) {

    const button = getMissionButton(mission);

    if (!button) return;

    if (isMissionClaimed(mission)) {

      button.textContent = "Sudah ✓";
      button.disabled = true;
      button.style.background = "#20a05a";
      button.style.boxShadow = "none";

    } else {

      button.textContent =
        mission === "login" ? "Klaim" : "Mulai";

      button.disabled = false;
      button.style.background = "";
      button.style.boxShadow = "";
    }
  });
}


// ======================================
// KLAIM MISI
// ======================================

function claimMission(mission, reward) {

  // Cegah klaim ulang
  if (isMissionClaimed(mission)) {

    alert(
      "⚠️ Misi ini sudah kamu klaim hari ini."
    );

    updateMissionButtons();

    return;
  }


  // Tambahkan poin
  points += reward;

  localStorage.setItem(
    "rewardku_points",
    points
  );


  // Simpan status
  saveMission(mission);


  // Update tampilan
  updatePoints();
  updateMissionButtons();


  alert(
    "🎉 Selamat!\n\n" +
    "+" + reward +
    " ⭐ berhasil ditambahkan!"
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
      .catch(function() {});

  } else {

    alert(
      "📤 Salin link RewardKu dan bagikan ke temanmu!"
    );
  }
}


// ======================================
// SAAT HALAMAN DIBUKA
// ======================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updatePoints();

    updateMissionButtons();

  }
);
