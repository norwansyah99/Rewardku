// ==========================================
// REWARDKU V4
// SISTEM POIN + MISI + TIMER
// ==========================================

const DEFAULT_POINTS = 1250;

const POINTS_KEY = "rewardku_points";
const MISSIONS_KEY = "rewardku_missions";

const MISSIONS = {
  iklan: {
    name: "Melihat Iklan",
    reward: 20,
    duration: 10,
    icon: "📺",
    description: "Selesaikan aktivitas iklan."
  },

  novel: {
    name: "Baca Novel",
    reward: 30,
    duration: 10,
    icon: "📖",
    description: "Baca novel selama waktu yang ditentukan."
  },

  game: {
    name: "Mainkan Game",
    reward: 25,
    duration: 10,
    icon: "🎮",
    description: "Mainkan game untuk mendapatkan poin."
  },

  shortvideo: {
    name: "Menonton Short Video",
    reward: 20,
    duration: 10,
    icon: "📱",
    description: "Tonton video sampai selesai."
  },

  login: {
    name: "Login Harian",
    reward: 10,
    duration: 0,
    icon: "📅",
    description: "Bonus login harian."
  },

  survey: {
    name: "Survei Singkat",
    reward: 40,
    duration: 10,
    icon: "📋",
    description: "Selesaikan survei singkat."
  }
};


// ==========================================
// POIN
// ==========================================

function getPoints() {

  const saved = localStorage.getItem(POINTS_KEY);

  if (saved === null) {
    localStorage.setItem(
      POINTS_KEY,
      DEFAULT_POINTS
    );

    return DEFAULT_POINTS;
  }

  const number = Number(saved);

  if (Number.isNaN(number)) {
    localStorage.setItem(
      POINTS_KEY,
      DEFAULT_POINTS
    );

    return DEFAULT_POINTS;
  }

  return number;
}


function savePoints(value) {

  localStorage.setItem(
    POINTS_KEY,
    String(value)
  );
}


function updatePoints() {

  const element =
    document.getElementById("points");

  if (!element) return;

  element.textContent =
    getPoints().toLocaleString("id-ID");
}


// ==========================================
// TANGGAL
// ==========================================

function getToday() {

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(now.getDate())
      .padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ==========================================
// DATA MISI
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


function saveMissionData(data) {

  localStorage.setItem(
    MISSIONS_KEY,
    JSON.stringify(data)
  );
}


function isMissionClaimed(mission) {

  const data =
    getMissionData();

  return data[mission] === getToday();
}


function markMissionClaimed(mission) {

  const data =
    getMissionData();

  data[mission] =
    getToday();

  saveMissionData(data);
}


// ==========================================
// UPDATE TOMBOL
// ==========================================

function getMissionButton(mission) {

  return document.getElementById(
    "btn-" + mission
  );
}


function updateMissionButtons() {

  Object.keys(MISSIONS)
    .forEach(function(mission) {

      const button =
        getMissionButton(mission);

      if (!button) return;

      if (isMissionClaimed(mission)) {

        button.textContent =
          "Sudah ✓";

        button.disabled = true;

        button.classList.add(
          "claimed"
        );

      } else {

        button.textContent =
          mission === "login"
            ? "Klaim"
            : "Mulai";

        button.disabled = false;

        button.classList.remove(
          "claimed"
        );
      }

    });
}


// ==========================================
// MODAL AKTIVITAS
// ==========================================

function createMissionModal(
  mission,
  reward
) {

  const data =
    MISSIONS[mission];

  const old =
    document.getElementById(
      "mission-modal"
    );

  if (old) old.remove();


  const modal =
    document.createElement("div");

  modal.id =
    "mission-modal";

  modal.innerHTML = `

    <div class="mission-overlay">

      <div class="mission-modal-box">

        <div class="modal-icon">
          ${data.icon}
        </div>

        <h2>
          ${data.name}
        </h2>

        <p>
          ${data.description}
        </p>

        <div
          id="mission-countdown"
          class="mission-countdown"
        >
          ${data.duration > 0
            ? data.duration
            : "✓"}
        </div>

        <p
          id="mission-status"
          class="mission-status"
        >
          ${
            data.duration > 0
              ? "Sedang memproses..."
              : "Siap diklaim"
          }
        </p>

        <button
          id="mission-claim-button"
          class="mission-claim-button"
          disabled
        >
          ${
            data.duration > 0
              ? "Tunggu..."
              : "Klaim +" + reward + " ⭐"
          }
        </button>

        <button
          id="mission-close-button"
          class="mission-close-button"
        >
          Tutup
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(modal);


  document
    .getElementById(
      "mission-close-button"
    )
    .onclick = function() {

      modal.remove();

    };


  const claimButton =
    document.getElementById(
      "mission-claim-button"
    );


  // ======================================
  // TIMER
  // ======================================

  let remaining =
    data.duration;


  if (remaining <= 0) {

    claimButton.disabled =
      false;

    claimButton.textContent =
      "Klaim +" + reward + " ⭐";

    claimButton.onclick =
      function() {

        finishMission(
          mission,
          reward,
          modal
        );

      };

    return;
  }


  const countdown =
    document.getElementById(
      "mission-countdown"
    );

  const status =
    document.getElementById(
      "mission-status"
    );


  const timer =
    setInterval(function() {

      remaining--;

      countdown.textContent =
        remaining;


      if (remaining <= 0) {

        clearInterval(timer);

        countdown.textContent =
          "✓";

        status.textContent =
          "Aktivitas selesai!";

        claimButton.disabled =
          false;

        claimButton.textContent =
          "Klaim +" + reward + " ⭐";


        claimButton.onclick =
          function() {

            finishMission(
              mission,
              reward,
              modal
            );

          };

      }

    }, 1000);
}


// ==========================================
// SELESAIKAN MISI
// ==========================================

function finishMission(
  mission,
  reward,
  modal
) {

  if (
    isMissionClaimed(mission)
  ) {

    alert(
      "⚠️ Misi ini sudah kamu klaim hari ini."
    );

    if (modal) {
      modal.remove();
    }

    updateMissionButtons();

    return;
  }


  let points =
    getPoints();


  points += Number(reward);


  savePoints(points);

  markMissionClaimed(
    mission
  );


  updatePoints();

  updateMissionButtons();


  if (modal) {
    modal.remove();
  }


  alert(
    "🎉 Berhasil!\n\n" +
    "+" +
    reward +
    " ⭐ berhasil ditambahkan."
  );
}


// ==========================================
// KLIK MULAI MISI
// ==========================================

function claimMission(
  mission,
  reward
) {

  if (!MISSIONS[mission]) {

    alert(
      "Misi tidak ditemukan."
    );

    return;
  }


  if (
    isMissionClaimed(mission)
  ) {

    alert(
      "⚠️ Misi ini sudah kamu klaim hari ini."
    );

    updateMissionButtons();

    return;
  }


  const data =
    MISSIONS[mission];


  createMissionModal(
    mission,
    data.reward
  );
}


// ==========================================
// BAGIKAN APLIKASI
// ==========================================

async function shareApp() {

  if (
    isMissionClaimed("share")
  ) {

    alert(
      "⚠️ Misi bagikan sudah diklaim hari ini."
    );

    return;
  }


  const shareData = {

    title: "RewardKu",

    text:
      "Yuk coba RewardKu dan kumpulkan poin!",

    url:
      window.location.href
  };


  if (
    navigator.share
  ) {

    try {

      await navigator.share(
        shareData
      );

      let points =
        getPoints();

      points += 50;

      savePoints(points);

      markMissionClaimed(
        "share"
      );

      updatePoints();

      updateMissionButtons();

      alert(
        "🎉 Berhasil!\n\n" +
        "+50 ⭐ ditambahkan."
      );

    } catch (error) {

      console.log(
        "Share dibatalkan."
      );

    }

    return;
  }


  try {

    await navigator.clipboard.writeText(
      window.location.href
    );

    alert(
      "🔗 Link RewardKu berhasil disalin."
    );

  } catch (error) {

    alert(
      "Silakan salin link RewardKu secara manual."
    );

  }
}


// ==========================================
// NAVIGASI
// ==========================================

function scrollToMission() {

  const section =
    document.getElementById(
      "missionSection"
    );

  if (!section) return;

  section.scrollIntoView({

    behavior: "smooth",

    block: "start"

  });
}


function scrollToTop() {

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });
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
// STYLE MODAL
// ==========================================

function addMissionModalStyle() {

  if (
    document.getElementById(
      "mission-modal-style"
    )
  ) return;


  const style =
    document.createElement("style");

  style.id =
    "mission-modal-style";


  style.textContent = `

    .mission-overlay {

      position: fixed;

      inset: 0;

      background:
        rgba(0,0,0,0.65);

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 20px;

      z-index: 99999;

      backdrop-filter:
        blur(4px);
    }


    .mission-modal-box {

      width: 100%;

      max-width: 390px;

      background: #ffffff;

      border-radius: 28px;

      padding: 30px 24px;

      text-align: center;

      box-shadow:
        0 20px 60px
        rgba(0,0,0,0.3);

      animation:
        missionPop
        0.25s ease;
    }


    .modal-icon {

      width: 75px;

      height: 75px;

      margin: 0 auto 15px;

      border-radius: 22px;

      background: #fff0f1;

      display: flex;

      align-items: center;

      justify-content: center;

      font-size: 42px;
    }


    .mission-modal-box h2 {

      margin: 5px 0 8px;

      color: #222;

      font-size: 23px;
    }


    .mission-modal-box p {

      color: #777;

      line-height: 1.5;

      margin: 8px 0;
    }


    .mission-countdown {

      width: 90px;

      height: 90px;

      margin: 20px auto;

      border-radius: 50%;

      background:
        linear-gradient(
          135deg,
          #d90416,
          #ff3345
        );

      color: white;

      display: flex;

      align-items: center;

      justify-content: center;

      font-size: 38px;

      font-weight: 800;

      box-shadow:
        0 8px 25px
        rgba(217,4,22,0.25);
    }


    .mission-status {

      font-size: 14px;

      min-height: 22px;
    }


    .mission-claim-button {

      width: 100%;

      border: none;

      border-radius: 14px;

      padding: 15px;

      margin-top: 10px;

      background: #d90416;

      color: white;

      font-size: 16px;

      font-weight: 700;

      cursor: pointer;
    }


    .mission-claim-button:disabled {

      background: #cccccc;

      cursor: not-allowed;

    }


    .mission-close-button {

      width: 100%;

      border: none;

      background: transparent;

      color: #777;

      padding: 14px;

      margin-top: 5px;

      font-size: 14px;

    }


    @keyframes missionPop {

      from {

        opacity: 0;

        transform:
          scale(0.9)
          translateY(15px);

      }

      to {

        opacity: 1;

        transform:
          scale(1)
          translateY(0);

      }

    }

  `;


  document.head.appendChild(
    style
  );
}


// ==========================================
// START
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    addMissionModalStyle();

    updatePoints();

    updateMissionButtons();

  }
);
