// ==========================================
// REWARDKU
// SISTEM POIN + STATUS MISI
// ==========================================


// ==========================================
// KONFIGURASI
// ==========================================

const DEFAULT_POINTS = 1250;

const POINTS_KEY = "rewardku_points";

const MISSIONS_KEY = "rewardku_missions";


// ==========================================
// DATA MISI
// ==========================================

const MISSIONS = {

  iklan: {
    name: "Melihat Iklan",
    reward: 20
  },

  novel: {
    name: "Baca Novel",
    reward: 30
  },

  game: {
    name: "Mainkan Game",
    reward: 25
  },

  shortvideo: {
    name: "Menonton Short Video",
    reward: 20
  },

  login: {
    name: "Login Harian",
    reward: 10
  },

  share: {
    name: "Bagikan RewardKu",
    reward: 50
  },

  survey: {
    name: "Survei Singkat",
    reward: 40
  }

};


// ==========================================
// AMBIL POIN
// ==========================================

function getPoints() {

  const saved =
    localStorage.getItem(POINTS_KEY);

  if (saved === null) {

    localStorage.setItem(
      POINTS_KEY,
      DEFAULT_POINTS
    );

    return DEFAULT_POINTS;
  }

  const number =
    Number(saved);

  if (Number.isNaN(number)) {

    localStorage.setItem(
      POINTS_KEY,
      DEFAULT_POINTS
    );

    return DEFAULT_POINTS;
  }

  return number;
}


// ==========================================
// SIMPAN POIN
// ==========================================

function savePoints(value) {

  localStorage.setItem(
    POINTS_KEY,
    String(value)
  );
}


// ==========================================
// TAMPILKAN POIN
// ==========================================

function updatePoints() {

  const element =
    document.getElementById("points");

  if (!element) {
    return;
  }

  const points =
    getPoints();

  element.textContent =
    points.toLocaleString("id-ID");
}


// ==========================================
// TANGGAL HARI INI
// ==========================================

function getToday() {

  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ==========================================
// AMBIL DATA MISI
// ==========================================

function getMissionData() {

  try {

    return JSON.parse(
      localStorage.getItem(
        MISSIONS_KEY
      ) || "{}"
    );

  } catch (error) {

    return {};

  }
}


// ==========================================
// SIMPAN DATA MISI
// ==========================================

function saveMissionData(data) {

  localStorage.setItem(
    MISSIONS_KEY,
    JSON.stringify(data)
  );
}


// ==========================================
// CEK MISI SUDAH DIKLAIM
// ==========================================

function isMissionClaimed(mission) {

  const data =
    getMissionData();

  return (
    data[mission] === getToday()
  );
}


// ==========================================
// TANDAI MISI SEBAGAI DIKLAIM
// ==========================================

function markMissionClaimed(mission) {

  const data =
    getMissionData();

  data[mission] =
    getToday();

  saveMissionData(data);
}


// ==========================================
// AMBIL TOMBOL MISI
// ==========================================

function getMissionButton(mission) {

  return document.getElementById(
    "btn-" + mission
  );
}


// ==========================================
// UPDATE STATUS TOMBOL
// ==========================================

function updateMissionButtons() {

  Object.keys(MISSIONS)
    .forEach(function(mission) {

      const button =
        getMissionButton(mission);

      if (!button) {
        return;
      }


      if (
        isMissionClaimed(mission)
      ) {

        button.textContent =
          "Sudah ✓";

        button.disabled =
          true;

        button.classList.add(
          "claimed"
        );

      } else {

        if (mission === "login") {

          button.textContent =
            "Klaim";

        } else {

          button.textContent =
            "Mulai";
        }

        button.disabled =
          false;

        button.classList.remove(
          "claimed"
        );
      }

    });
}


// ==========================================
// KLAIM MISI
// ==========================================

function claimMission(
  mission,
  reward
) {

  // Pastikan misi valid
  if (!MISSIONS[mission]) {

    console.error(
      "Misi tidak ditemukan:",
      mission
    );

    return;
  }


  // Cegah klaim ulang
  if (
    isMissionClaimed(mission)
  ) {

    alert(
      "⚠️ Misi ini sudah kamu klaim hari ini."
    );

    updateMissionButtons();

    return;
  }


  // Ambil poin sekarang
  let points =
    getPoints();


  // Tambahkan reward
  points += Number(reward);


  // Simpan
  savePoints(points);

  markMissionClaimed(mission);


  // Update tampilan
  updatePoints();

  updateMissionButtons();


  // Beri informasi
  alert(
    "🎉 Selamat!\n\n" +
    "+" +
    Number(reward) +
    " ⭐ berhasil ditambahkan."
  );
}


// ==========================================
// PESAN FITUR
// ==========================================

function showMessage(message) {

  alert(
    "🚀 " +
    message +
    "\n\n" +
    "Fitur ini sedang kita siapkan."
  );
}


// ==========================================
// BAGIKAN APLIKASI
// ==========================================

async function shareApp() {

  const shareData = {

    title: "RewardKu",

    text:
      "Yuk coba RewardKu dan kumpulkan poin!",

    url:
      window.location.href

  };


  // Jika sudah diklaim
  if (
    isMissionClaimed("share")
  ) {

    alert(
      "⚠️ Misi Bagikan RewardKu sudah kamu klaim hari ini."
    );

    updateMissionButtons();

    return;
  }


  // Web Share API tersedia
  if (
    navigator.share
  ) {

    try {

      await navigator.share(
        shareData
      );

      // Beri reward setelah share berhasil
      let points =
        getPoints();

      points += 50;

      savePoints(points);

      markMissionClaimed("share");

      updatePoints();

      updateMissionButtons();

      alert(
        "🎉 Berhasil!\n\n" +
        "+50 ⭐ ditambahkan."
      );

    } catch (error) {

      // User membatalkan share
      console.log(
        "Share dibatalkan."
      );
    }

    return;
  }


  // Browser tidak mendukung Share API
  try {

    await navigator.clipboard.writeText(
      window.location.href
    );

    alert(
      "🔗 Link RewardKu sudah disalin.\n\n" +
      "Silakan bagikan kepada teman."
    );

  } catch (error) {

    alert(
      "📤 Silakan salin link RewardKu secara manual."
    );
  }
}


// ==========================================
// SCROLL KE MISI
// ==========================================

function scrollToMission() {

  const section =
    document.getElementById(
      "missionSection"
    );

  if (!section) {
    return;
  }

  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


// ==========================================
// SCROLL KE ATAS
// ==========================================

function scrollToTop() {

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });
}


// ==========================================
// SAAT HALAMAN DIBUKA
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updatePoints();

    updateMissionButtons();

  }
);
