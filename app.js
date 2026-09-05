/* =========================================================
   RewardKu V7
   Misi + Poin + Reward + Dark Mode + Profil + PWA Install
   Semua data demo disimpan di localStorage perangkat.
   ========================================================= */

const POINTS_KEY = "rewardku_points";
const MISSION_KEY = "rewardku_missions";
const REWARD_HISTORY_KEY = "rewardku_redemptions";
const THEME_KEY = "rewardku_theme";
const PROFILE_KEY = "rewardku_profile";

const DEFAULT_POINTS = 1250;

const MISSIONS = {
  iklan: 20,
  novel: 30,
  game: 25,
  shortvideo: 20,
  login: 10,
  survey: 40
};

function formatPoints(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function getPoints() {
  const saved = localStorage.getItem(POINTS_KEY);
  if (saved === null) {
    localStorage.setItem(POINTS_KEY, String(DEFAULT_POINTS));
    return DEFAULT_POINTS;
  }
  const value = Number(saved);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULT_POINTS;
}

function savePoints(value) {
  const safeValue = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(POINTS_KEY, String(safeValue));
}

function updatePoints() {
  const el = document.getElementById("points");
  if (el) el.textContent = formatPoints(getPoints());
  updateRewardPoints();
}

function getMissionState() {
  try {
    return JSON.parse(localStorage.getItem(MISSION_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveMissionState(state) {
  localStorage.setItem(MISSION_KEY, JSON.stringify(state));
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function isMissionClaimed(id) {
  const state = getMissionState();
  return state[id] === todayKey();
}

function updateMissionButtons() {
  Object.keys(MISSIONS).forEach((id) => {
    const button = document.getElementById("btn-" + id);
    if (!button) return;

    if (isMissionClaimed(id)) {
      button.textContent = "Sudah ✓";
      button.classList.add("claimed");
      button.disabled = true;
    } else {
      button.textContent = id === "login" ? "Klaim" : "Mulai";
      button.classList.remove("claimed");
      button.disabled = false;
    }
  });

  const shareButton = document.getElementById("btn-share");
  if (shareButton && isMissionClaimed("share")) {
    shareButton.textContent = "Sudah ✓";
    shareButton.classList.add("claimed");
    shareButton.disabled = true;
  }
}

function claimMission(id, amount) {
  if (!MISSIONS[id]) return;
  if (isMissionClaimed(id)) return;

  const state = getMissionState();
  state[id] = todayKey();
  saveMissionState(state);

  savePoints(getPoints() + Number(amount || MISSIONS[id]));
  updatePoints();
  updateMissionButtons();

  showToast("🎉 +" + formatPoints(amount || MISSIONS[id]) + " poin berhasil didapat!");
}

async function shareApp() {
  if (isMissionClaimed("share")) return;

  const shareData = {
    title: "RewardKu",
    text: "Yuk coba RewardKu — aktivitas kecil, manfaat besar!",
    url: location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(location.href);
      showToast("🔗 Link RewardKu berhasil disalin.");
    } else {
      showToast("🔗 Bagikan link RewardKu kepada teman.");
    }

    const state = getMissionState();
    state.share = todayKey();
    saveMissionState(state);

    savePoints(getPoints() + 50);
    updatePoints();
    updateMissionButtons();
    showToast("🎉 Misi berbagi selesai! +50 poin");
  } catch (error) {
    // Pengguna membatalkan dialog share: tidak memberi poin.
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  setActiveNav(0);
}

function scrollToMission() {
  const section = document.getElementById("missionSection");
  if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveNav(1);
}

function showRewardPage() {
  const section = document.getElementById("rewardSection");
  if (!section) return;

  updateRewardPoints();
  renderRewardHistory();
  section.scrollIntoView({ behavior: "smooth", block: "start" });
  setActiveNav(2);
}

function showMessage(name) {
  if (name === "Profil") {
    openProfile();
    return;
  }

  if (name === "Novel") {
    showToast("📖 Fitur Novel siap dikembangkan.");
    return;
  }

  if (name === "Game") {
    showToast("🎮 Fitur Game siap dikembangkan.");
    return;
  }

  if (name === "Notifikasi") {
    showToast("🔔 Belum ada notifikasi baru.");
  }
}

/* ---------- REWARD ---------- */

function getRewardHistory() {
  try {
    return JSON.parse(localStorage.getItem(REWARD_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRewardHistory(history) {
  localStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(history));
}

function updateRewardPoints() {
  const el = document.getElementById("rewardPoints");
  if (el) el.textContent = formatPoints(getPoints()) + " ⭐";
}

function redeemReward(rewardName, cost, icon) {
  const points = getPoints();

  if (points < cost) {
    showRewardInsufficient(rewardName, cost, points);
    return;
  }

  const old = document.getElementById("reward-confirm-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "reward-confirm-modal";
  modal.className = "reward-overlay";

  modal.innerHTML = `
    <div class="reward-modal">
      <div class="reward-modal-icon">${icon}</div>
      <h2>Tukar Reward?</h2>
      <p>Kamu akan menukarkan <strong>${formatPoints(cost)} ⭐</strong> untuk <strong>${rewardName}</strong>.</p>
      <p style="margin-top:8px;">Poin setelah penukaran:
        <strong>${formatPoints(points - cost)} ⭐</strong>
      </p>
      <button type="button" class="reward-confirm" id="confirmRewardButton">
        🎁 Konfirmasi Tukar
      </button>
      <button type="button" class="reward-cancel" id="cancelRewardButton">
        Batal
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cancelRewardButton").onclick = () => modal.remove();
  document.getElementById("confirmRewardButton").onclick = () => {
    confirmRedeemReward(rewardName, cost, icon, modal);
  };
}

function showRewardInsufficient(rewardName, cost, points) {
  const kurang = cost - points;
  showToast("⭐ Poin belum cukup. Masih kurang " + formatPoints(kurang) + " poin.");
}

function confirmRedeemReward(rewardName, cost, icon, modal) {
  const currentPoints = getPoints();

  if (currentPoints < cost) {
    if (modal) modal.remove();
    showRewardInsufficient(rewardName, cost, currentPoints);
    return;
  }

  const newPoints = currentPoints - cost;
  savePoints(newPoints);

  const history = getRewardHistory();
  history.unshift({
    name: rewardName,
    cost: cost,
    icon: icon,
    date: new Date().toLocaleString("id-ID")
  });

  saveRewardHistory(history);

  updatePoints();
  renderRewardHistory();

  if (modal) modal.remove();

  showToast("🎉 " + rewardName + " berhasil ditukar!");
}

function renderRewardHistory() {
  const container = document.getElementById("rewardHistory");
  if (!container) return;

  const history = getRewardHistory();

  if (!history.length) {
    container.innerHTML = `<div class="empty-history">Belum ada penukaran reward.</div>`;
    return;
  }

  container.innerHTML = history.slice(0, 10).map((item) => `
    <div class="history-item">
      <div class="history-icon">${item.icon || "🎁"}</div>
      <div class="history-info">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.date)}</small>
      </div>
      <div class="history-points">-${formatPoints(item.cost)} ⭐</div>
    </div>
  `).join("");
}

function clearRewardHistory() {
  const history = getRewardHistory();

  if (!history.length) {
    showToast("Belum ada riwayat penukaran.");
    return;
  }

  if (!confirm("Hapus semua riwayat penukaran?")) return;

  localStorage.removeItem(REWARD_HISTORY_KEY);
  renderRewardHistory();
  showToast("🗑️ Riwayat berhasil dihapus.");
}

/* ---------- TOAST ---------- */

let toastTimer;

function showToast(message) {
  let toast = document.getElementById("rewardku-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "rewardku-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

/* ---------- NAV ---------- */

function setActiveNav(index) {
  const buttons = document.querySelectorAll(".bottom-nav button");
  buttons.forEach((button, i) => {
    button.classList.toggle("active", i === index);
  });
}

/* ---------- DARK MODE ---------- */

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark-mode", dark);

  const themeButton = document.getElementById("rewardkuThemeButton");
  if (themeButton) {
    themeButton.textContent = dark ? "☀️" : "🌙";
    themeButton.setAttribute("aria-label", dark ? "Mode terang" : "Mode malam");
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#111216" : "#d90416");
}

function toggleTheme() {
  const next = document.body.classList.contains("dark-mode") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
  showToast(next === "dark" ? "🌙 Mode malam aktif." : "☀️ Mode terang aktif.");
}

/* ---------- PROFILE ---------- */

function getProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{"name":"Pengguna RewardKu"}');
  } catch {
    return { name: "Pengguna RewardKu" };
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function getMissionCount() {
  const state = getMissionState();
  return Object.keys(MISSIONS).filter((id) => state[id] === todayKey()).length +
         (state.share === todayKey() ? 1 : 0);
}

function openProfile() {
  let overlay = document.getElementById("rewardku-profile-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "rewardku-profile-overlay";
    overlay.className = "rewardku-profile-overlay";

    overlay.innerHTML = `
      <div class="rewardku-profile-panel">
        <div class="rewardku-profile-top">
          <div class="rewardku-avatar">👤</div>
          <div>
            <h2 id="rewardkuProfileName">Pengguna RewardKu</h2>
            <p>Profil & statistik akun</p>
          </div>
          <button class="rewardku-profile-close" type="button" id="rewardkuProfileClose">×</button>
        </div>

        <div class="rewardku-stats">
          <div class="rewardku-stat">
            <strong id="profilePointStat">0</strong>
            <span>Total Poin</span>
          </div>
          <div class="rewardku-stat">
            <strong id="profileMissionStat">0</strong>
            <span>Misi Hari Ini</span>
          </div>
          <div class="rewardku-stat">
            <strong id="profileRewardStat">0</strong>
            <span>Reward Ditukar</span>
          </div>
        </div>

        <div class="rewardku-profile-actions">
          <button type="button" id="profileEditName">
            ✏️ Nama Pengguna <span>Ubah</span>
          </button>
          <button type="button" id="profileThemeAction">
            🌙 Tampilan <span id="profileThemeText">Mode malam</span>
          </button>
          <button type="button" id="profileRewardAction">
            🎁 Riwayat Reward <span>Lihat</span>
          </button>
        </div>

        <div class="rewardku-profile-note">
          💡 Data profil, poin dan riwayat pada versi ini tersimpan di perangkat/browser.
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeProfile();
    });

    document.getElementById("rewardkuProfileClose").onclick = closeProfile;

    document.getElementById("profileEditName").onclick = () => {
      const current = getProfile().name || "Pengguna RewardKu";
      const name = prompt("Masukkan nama pengguna:", current);

      if (name === null) return;

      const clean = name.trim().slice(0, 30);
      if (!clean) return;

      saveProfile({ name: clean });
      renderProfile();
      showToast("✅ Nama profil diperbarui.");
    };

    document.getElementById("profileThemeAction").onclick = () => {
      toggleTheme();
      renderProfile();
    };

    document.getElementById("profileRewardAction").onclick = () => {
      closeProfile();
      showRewardPage();
    };
  }

  renderProfile();
  overlay.classList.add("show");
}

function renderProfile() {
  const profile = getProfile();
  const name = profile.name || "Pengguna RewardKu";

  const nameEl = document.getElementById("rewardkuProfileName");
  const pointsEl = document.getElementById("profilePointStat");
  const missionEl = document.getElementById("profileMissionStat");
  const rewardEl = document.getElementById("profileRewardStat");
  const themeText = document.getElementById("profileThemeText");

  if (nameEl) nameEl.textContent = name;
  if (pointsEl) pointsEl.textContent = formatPoints(getPoints());
  if (missionEl) missionEl.textContent = getMissionCount();
  if (rewardEl) rewardEl.textContent = getRewardHistory().length;
  if (themeText) {
    themeText.textContent = document.body.classList.contains("dark-mode")
      ? "Mode terang"
      : "Mode malam";
  }
}

function closeProfile() {
  const overlay = document.getElementById("rewardku-profile-overlay");
  if (overlay) overlay.classList.remove("show");
}

/* ---------- PWA INSTALL ---------- */

let deferredInstallPrompt = null;

function createInstallUI() {
  if (document.getElementById("rewardkuInstallCard")) return;

  const card = document.createElement("section");
  card.id = "rewardkuInstallCard";
  card.className = "install-card";

  card.innerHTML = `
    <div class="install-card-icon">📲</div>
    <div class="install-card-text">
      <strong>Install RewardKu</strong>
      <small>Pasang RewardKu di layar utama HP.</small>
    </div>
    <button type="button" id="rewardkuInstallButton">Install</button>
  `;

  const main = document.querySelector("main.container");
  const balance = document.querySelector(".balance-card");

  if (main && balance) {
    main.insertBefore(card, balance.nextSibling);
  } else if (main) {
    main.prepend(card);
  }

  document.getElementById("rewardkuInstallButton").onclick = installPWA;
}

function showInstallCard() {
  const card = document.getElementById("rewardkuInstallCard");
  if (card) card.classList.add("show");
}

function hideInstallCard() {
  const card = document.getElementById("rewardkuInstallCard");
  if (card) card.classList.remove("show");
}

async function installPWA() {
  if (!deferredInstallPrompt) {
    showToast("📲 Gunakan menu browser 'Tambahkan ke layar utama'.");
    return;
  }

  deferredInstallPrompt.prompt();

  try {
    await deferredInstallPrompt.userChoice;
  } catch {}

  deferredInstallPrompt = null;
  hideInstallCard();
}

function setupPWA() {
  // Manifest ditambahkan lewat JS agar index.html tidak perlu dirombak.
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "manifest.json";
    document.head.appendChild(manifest);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    showInstallCard();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallCard();
    showToast("🎉 RewardKu berhasil dipasang!");
  });

  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    hideInstallCard();
  }
}

/* ---------- FLOATING THEME + PROFILE ---------- */

function createFloatingTools() {
  if (document.getElementById("rewardkuFloatingTools")) return;

  const tools = document.createElement("div");
  tools.id = "rewardkuFloatingTools";
  tools.className = "rewardku-floating-tools";

  tools.innerHTML = `
    <button type="button" id="rewardkuThemeButton" aria-label="Mode malam">🌙</button>
    <button type="button" id="rewardkuProfileButton" aria-label="Profil">👤</button>
  `;

  document.body.appendChild(tools);

  document.getElementById("rewardkuThemeButton").onclick = toggleTheme;
  document.getElementById("rewardkuProfileButton").onclick = openProfile;
}

/* ---------- HELPERS ---------- */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- START ---------- */

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";

  applyTheme(savedTheme);
  updatePoints();
  updateMissionButtons();
  renderRewardHistory();
  createFloatingTools();
  createInstallUI();
  setupPWA();

  // Profil otomatis dibuat jika belum ada.
  if (!localStorage.getItem(PROFILE_KEY)) {
    saveProfile({ name: "Pengguna RewardKu" });
  }
});
