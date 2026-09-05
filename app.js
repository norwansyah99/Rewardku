// ==========================================
// REWARDKU V5
// SISTEM PENUKARAN REWARD
// ==========================================

const REWARD_HISTORY_KEY =
  "rewardku_redemptions";


// ==========================================
// DATA RIWAYAT
// ==========================================

function getRewardHistory() {

  try {

    return JSON.parse(
      localStorage.getItem(
        REWARD_HISTORY_KEY
      ) || "[]"
    );

  } catch (error) {

    return [];

  }

}


function saveRewardHistory(history) {

  localStorage.setItem(
    REWARD_HISTORY_KEY,
    JSON.stringify(history)
  );

}


// ==========================================
// UPDATE POIN DI HALAMAN REWARD
// ==========================================

function updateRewardPoints() {

  const element =
    document.getElementById(
      "rewardPoints"
    );

  if (!element) return;

  element.textContent =
    getPoints().toLocaleString("id-ID") +
    " ⭐";

}


// ==========================================
// TAMPILKAN HALAMAN REWARD
// ==========================================

function showRewardPage() {

  const section =
    document.getElementById(
      "rewardSection"
    );

  if (!section) return;

  updateRewardPoints();

  renderRewardHistory();

  section.scrollIntoView({

    behavior: "smooth",

    block: "start"

  });

}


// ==========================================
// KONFIRMASI REWARD
// ==========================================

function redeemReward(
  rewardName,
  cost,
  icon
) {

  const points =
    getPoints();

  if (points < cost) {

    showRewardInsufficient(
      rewardName,
      cost,
      points
    );

    return;

  }


  const old =
    document.getElementById(
      "reward-confirm-modal"
    );

  if (old) old.remove();


  const modal =
    document.createElement("div");

  modal.id =
    "reward-confirm-modal";

  modal.className =
    "reward-overlay";


  modal.innerHTML = `

    <div class="reward-modal">

      <div class="reward-modal-icon">
        ${icon}
      </div>

      <h2>
        Tukar Reward?
      </h2>

      <p>
        Kamu akan menukarkan
        <strong>${cost.toLocaleString("id-ID")} ⭐</strong>
        untuk
        <strong>${rewardName}</strong>.
      </p>

      <p style="margin-top:8px;">
        Poin setelah penukaran:
        <strong>
          ${(points - cost).toLocaleString("id-ID")} ⭐
        </strong>
      </p>

      <button
        type="button"
        class="reward-confirm"
        id="confirmRewardButton"
      >
        🎁 Konfirmasi Tukar
      </button>

      <button
        type="button"
        class="reward-cancel"
        id="cancelRewardButton"
      >
        Batal
      </button>

    </div>

  `;


  document.body.appendChild(modal);


  document
    .getElementById(
      "cancelRewardButton"
    )
    .onclick = function() {

      modal.remove();

    };


  document
    .getElementById(
      "confirmRewardButton"
    )
    .onclick = function() {

      confirmRedeemReward(
        rewardName,
        cost,
        icon,
        modal
      );

    };

}


// ==========================================
// POIN TIDAK CUKUP
// ==========================================

function showRewardInsufficient(
  rewardName,
  cost,
  points
) {

  const kurang =
    cost - points;


  alert(
    "⭐ Poin belum cukup.\n\n" +

    "Reward: " +
    rewardName +

    "\nHarga: " +
    cost.toLocaleString("id-ID") +
    " ⭐\n" +

    "Poin kamu: " +
    points.toLocaleString("id-ID") +
    " ⭐\n\n" +

    "Masih kurang " +
    kurang.toLocaleString("id-ID") +
    " ⭐.\n\n" +

    "Yuk selesaikan misi lagi!"
  );

}


// ==========================================
// PROSES PENUKARAN
// ==========================================

function confirmRedeemReward(
  rewardName,
  cost,
  icon,
  modal
) {

  const currentPoints =
    getPoints();


  if (currentPoints < cost) {

    if (modal) {
      modal.remove();
    }

    showRewardInsufficient(
      rewardName,
      cost,
      currentPoints
    );

    return;

  }


  const newPoints =
    currentPoints - cost;


  // Kurangi poin
  savePoints(
    newPoints
  );


  // Simpan riwayat
  const history =
    getRewardHistory();


  history.unshift({

    name: rewardName,

    cost: cost,

    icon: icon,

    date: new Date()
      .toLocaleString(
        "id-ID"
      )

  });


  saveRewardHistory(
    history
  );


  // Update semua tampilan
  updatePoints();

  updateRewardPoints();

  renderRewardHistory();


  if (modal) {
    modal.remove();
  }


  alert(
    "🎉 Penukaran berhasil!\n\n" +

    rewardName +

    "\n-" +
    cost.toLocaleString("id-ID") +
    " ⭐\n\n" +

    "Sisa poin: " +
    newPoints.toLocaleString("id-ID") +
    " ⭐"
  );

}


// ==========================================
// TAMPILKAN RIWAYAT
// ==========================================

function renderRewardHistory() {

  const container =
    document.getElementById(
      "rewardHistory"
    );

  if (!container) return;


  const history =
    getRewardHistory();


  if (
    history.length === 0
  ) {

    container.innerHTML = `

      <div class="empty-history">
        Belum ada penukaran reward.
      </div>

    `;

    return;

  }


  container.innerHTML =
    history
      .slice(0, 10)
      .map(function(item) {

        return `

          <div class="history-item">

            <div class="history-icon">
              ${item.icon}
            </div>

            <div class="history-info">

              <strong>
                ${item.name}
              </strong>

              <small>
                ${item.date}
              </small>

            </div>

            <div class="history-points">
              -${Number(item.cost)
                .toLocaleString("id-ID")}
              ⭐
            </div>

          </div>

        `;

      })
      .join("");

}


// ==========================================
// HAPUS RIWAYAT
// ==========================================

function clearRewardHistory() {

  const history =
    getRewardHistory();


  if (
    history.length === 0
  ) {

    alert(
      "Belum ada riwayat penukaran."
    );

    return;

  }


  const confirmDelete =
    confirm(
      "Hapus semua riwayat penukaran?"
    );


  if (!confirmDelete) return;


  localStorage.removeItem(
    REWARD_HISTORY_KEY
  );


  renderRewardHistory();

  alert(
    "🗑️ Riwayat berhasil dihapus."
  );

}


// ==========================================
// START REWARD
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    updateRewardPoints();

    renderRewardHistory();

  }
);
