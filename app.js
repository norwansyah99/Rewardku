/* =========================================================
   RewardKu V11
   Misi + Poin + Reward + Dark Mode + Profil + PWA Install
   Supabase Auth + Cloud Data + fallback local.
   ========================================================= */

const POINTS_KEY = "rewardku_points";
const MISSION_KEY = "rewardku_missions";
const REWARD_HISTORY_KEY = "rewardku_redemptions";
const THEME_KEY = "rewardku_theme";
const PROFILE_KEY = "rewardku_profile";
const USER_ID_KEY = "rewardku_user_id";

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


const REWARD_DETAILS = {
  "Voucher Reward": {
    icon: "🎟️",
    description: "Voucher digital untuk digunakan sesuai ketentuan reward.",
    how: "Pilih reward, cek jumlah poin, lalu konfirmasi penukaran.",
    terms: "Reward pada versi demo dicatat di riwayat perangkat."
  },
  "Pulsa Digital": {
    icon: "📱",
    description: "Reward pulsa digital dengan nilai sesuai program yang tersedia.",
    how: "Tukar poin lalu simpan catatan penukaran pada riwayat.",
    terms: "Versi saat ini masih berupa simulasi lokal."
  },
  "Saldo Digital": {
    icon: "💳",
    description: "Reward saldo digital yang ditampilkan sebagai simulasi.",
    how: "Pastikan poin mencukupi sebelum melakukan penukaran.",
    terms: "Belum terhubung ke penyedia pembayaran nyata."
  },
  "Premium Reward": {
    icon: "👑",
    description: "Reward premium dengan biaya poin lebih tinggi.",
    how: "Kumpulkan poin hingga mencukupi, kemudian konfirmasi.",
    terms: "Penukaran pada versi ini hanya dicatat di perangkat."
  }
};

function getRewardDetail(name, fallbackIcon) {
  return REWARD_DETAILS[name] || {
    icon: fallbackIcon || "🎁",
    description: "Reward digital dari RewardKu.",
    how: "Pilih reward dan konfirmasi penukaran.",
    terms: "Versi demo menyimpan transaksi secara lokal."
  };
}

function getCheapestRewardCost() {
  const costs = Object.keys(REWARD_DETAILS).map((name) => {
    const card = [...document.querySelectorAll(".reward-card")].find(
      (el) => (el.querySelector("h3")?.textContent || "").trim() === name
    );
    const strong = card?.querySelector(".reward-cost strong");
    const n = strong ? Number((strong.textContent || "").replace(/\D/g, "")) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }).filter(Number.isFinite);

  return costs.length ? Math.min(...costs) : 100;
}

function renderRewardProgress() {
  const section = document.getElementById("rewardSection");
  if (!section) return;

  let box = document.getElementById("rewardProgressBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "rewardProgressBox";
    box.className = "rewardku-progress-box";

    const grid = section.querySelector(".reward-grid, .rewards-grid");
    if (grid) section.insertBefore(box, grid);
    else section.prepend(box);
  }

  const points = getPoints();
  const target = getCheapestRewardCost();
  const percent = Math.min(100, Math.round((points / target) * 100));
  const remaining = Math.max(0, target - points);

  box.innerHTML = remaining > 0
    ? `
      <div class="rewardku-progress-top">
        <div>
          <span>🎯 Reward terdekat</span>
          <strong>${formatPoints(target)} ⭐</strong>
        </div>
        <b>${percent}%</b>
      </div>
      <div class="rewardku-progress-track"><i style="width:${percent}%"></i></div>
      <small>Kumpulkan ${formatPoints(remaining)} poin lagi untuk reward termurah.</small>
    `
    : `
      <div class="rewardku-progress-top">
        <div>
          <span>🎉 Poin mencukupi!</span>
          <strong>${formatPoints(points)} ⭐</strong>
        </div>
        <b>100%</b>
      </div>
      <div class="rewardku-progress-track"><i style="width:100%"></i></div>
      <small>Kamu sudah bisa menukar reward yang tersedia.</small>
    `;
}

function showRewardDetail(rewardName, cost, icon) {
  const old = document.getElementById("reward-detail-modal");
  if (old) old.remove();

  const detail = getRewardDetail(rewardName, icon);
  const points = getPoints();
  const enough = points >= cost;

  const modal = document.createElement("div");
  modal.id = "reward-detail-modal";
  modal.className = "rewardku-detail-overlay";

  modal.innerHTML = `
    <div class="rewardku-detail-modal">
      <button type="button" class="rewardku-detail-close" id="rewardDetailClose" aria-label="Tutup">×</button>
      <div class="rewardku-detail-icon">${detail.icon}</div>
      <div class="rewardku-detail-badge">REWARD</div>
      <h2>${escapeHtml(rewardName)}</h2>
      <p class="rewardku-detail-desc">${escapeHtml(detail.description)}</p>

      <div class="rewardku-detail-cost">
        <span>Harga reward</span>
        <strong>${formatPoints(cost)} ⭐</strong>
      </div>

      <div class="rewardku-detail-info">
        <div><span>📌 Cara kerja</span><p>${escapeHtml(detail.how)}</p></div>
        <div><span>ℹ️ Catatan</span><p>${escapeHtml(detail.terms)}</p></div>
      </div>

      <div class="rewardku-detail-balance">
        Poin kamu: <strong>${formatPoints(points)} ⭐</strong>
      </div>

      <button type="button" class="rewardku-detail-primary" id="rewardDetailRedeem" ${enough ? "" : "disabled"}>
        ${enough ? "🎁 Lanjut Tukar Reward" : "⭐ Poin Belum Cukup"}
      </button>
      <button type="button" class="rewardku-detail-secondary" id="rewardDetailCancel">Tutup</button>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  document.getElementById("rewardDetailClose").onclick = close;
  document.getElementById("rewardDetailCancel").onclick = close;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });

  const redeemButton = document.getElementById("rewardDetailRedeem");
  if (redeemButton && enough) {
    redeemButton.onclick = () => {
      close();
      redeemRewardConfirmOnly(rewardName, cost, detail.icon);
    };
  }
}

function redeemRewardConfirmOnly(rewardName, cost, icon) {
  const old = document.getElementById("reward-confirm-modal");
  if (old) old.remove();

  const points = getPoints();
  if (points < cost) {
    showRewardInsufficient(rewardName, cost, points);
    return;
  }

  const modal = document.createElement("div");
  modal.id = "reward-confirm-modal";
  modal.className = "reward-overlay";

  modal.innerHTML = `
    <div class="reward-modal rewardku-confirm-v9">
      <div class="reward-modal-icon">${icon}</div>
      <div class="rewardku-confirm-badge">KONFIRMASI</div>
      <h2>Tukar ${escapeHtml(rewardName)}?</h2>
      <p>Gunakan <strong>${formatPoints(cost)} ⭐</strong> dari saldo poin kamu.</p>

      <div class="rewardku-confirm-summary">
        <span>Poin sekarang</span><strong>${formatPoints(points)} ⭐</strong>
        <span>Poin setelah tukar</span><strong>${formatPoints(points - cost)} ⭐</strong>
      </div>

      <button type="button" class="reward-confirm" id="confirmRewardButton">
        🎁 Ya, Tukarkan
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
  renderRewardProgress();
}

function redeemReward(rewardName, cost, icon) {
  showRewardDetail(rewardName, cost, icon);
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

function getUserId() {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    id = "RWK-" + random;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

function getMissionCount() {
  const state = getMissionState();
  return Object.keys(MISSIONS).filter((id) => state[id] === todayKey()).length +
         (state.share === todayKey() ? 1 : 0);
}

function getCompletedMissionCountAll() {
  const state = getMissionState();
  return Object.keys(MISSIONS).filter((id) => state[id]).length + (state.share ? 1 : 0);
}

function isAppInstalled() {
  return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
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
          <div class="rewardku-avatar" id="rewardkuAvatar">👤</div>
          <div class="rewardku-profile-heading">
            <h2 id="rewardkuProfileName">Pengguna RewardKu</h2>
            <p id="rewardkuUserId">ID RWK-XXXXXX</p>
          </div>
          <button class="rewardku-profile-close" type="button" id="rewardkuProfileClose" aria-label="Tutup">×</button>
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

        <div class="rewardku-profile-mini-stats">
          <div><span>Misi tercatat</span><strong id="profileMissionAllStat">0</strong></div>
          <div><span>Status aplikasi</span><strong id="profileInstallStat">Web</strong></div>
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
          <button type="button" id="profileInstallAction">
            📲 Aplikasi RewardKu <span id="profileInstallText">Install</span>
          </button>
        </div>

        <div class="rewardku-profile-about">
          <strong>🎁 Tentang RewardKu</strong>
          <p>Aktivitas kecil, manfaat besar. Versi demo ini menyimpan data di perangkat/browser.</p>
          <small>RewardKu V9 • PWA Ready</small>
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
      if (!clean) {
        showToast("⚠️ Nama tidak boleh kosong.");
        return;
      }

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

    document.getElementById("profileInstallAction").onclick = () => {
      if (isAppInstalled()) {
        showToast("📲 RewardKu sudah terpasang di perangkat.");
        return;
      }
      installPWA();
    };
  }

  renderProfile();
  overlay.classList.add("show");
}

function renderProfile() {
  const profile = getProfile();
  const name = profile.name || "Pengguna RewardKu";
  const firstLetter = name.trim().charAt(0).toUpperCase() || "👤";

  const nameEl = document.getElementById("rewardkuProfileName");
  const idEl = document.getElementById("rewardkuUserId");
  const avatarEl = document.getElementById("rewardkuAvatar");
  const pointsEl = document.getElementById("profilePointStat");
  const missionEl = document.getElementById("profileMissionStat");
  const rewardEl = document.getElementById("profileRewardStat");
  const missionAllEl = document.getElementById("profileMissionAllStat");
  const themeText = document.getElementById("profileThemeText");
  const installStat = document.getElementById("profileInstallStat");
  const installText = document.getElementById("profileInstallText");

  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = "ID " + getUserId();
  if (avatarEl) avatarEl.textContent = firstLetter;
  if (pointsEl) pointsEl.textContent = formatPoints(getPoints());
  if (missionEl) missionEl.textContent = getMissionCount();
  if (rewardEl) rewardEl.textContent = getRewardHistory().length;
  if (missionAllEl) missionAllEl.textContent = getCompletedMissionCountAll();

  const installed = isAppInstalled();
  if (installStat) installStat.textContent = installed ? "Terpasang" : "Web";
  if (installText) installText.textContent = installed ? "Terpasang ✓" : (deferredInstallPrompt ? "Install" : "Cara Install");

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
    renderProfile();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    hideInstallCard();
    renderProfile();
    showToast("🎉 RewardKu berhasil dipasang!");
  });

  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    hideInstallCard();
    renderProfile();
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
  renderRewardProgress();
  createFloatingTools();
  createInstallUI();
  setupPWA();

  // Profil otomatis dibuat jika belum ada.
  if (!localStorage.getItem(PROFILE_KEY)) {
    saveProfile({ name: "Pengguna RewardKu" });
  }
});

/* =========================================================
   RewardKu V10 - LEVEL + BADGES + LIFETIME STATS
   ========================================================= */

const LIFETIME_EARNED_KEY = "rewardku_lifetime_earned";
const TOTAL_MISSIONS_KEY = "rewardku_total_missions";

function getLifetimeEarned() {
  const saved = localStorage.getItem(LIFETIME_EARNED_KEY);

  // Untuk pengguna lama, mulai dari saldo saat ini sebagai seed.
  if (saved === null) {
    const seed = getPoints();
    localStorage.setItem(LIFETIME_EARNED_KEY, String(seed));
    return seed;
  }

  const value = Number(saved);
  return Number.isFinite(value) && value >= 0 ? value : getPoints();
}

function saveLifetimeEarned(value) {
  localStorage.setItem(
    LIFETIME_EARNED_KEY,
    String(Math.max(0, Math.floor(Number(value) || 0)))
  );
}

function recordLifetimeEarned(amount) {
  saveLifetimeEarned(
    getLifetimeEarned() + Math.max(0, Number(amount) || 0)
  );
}

function getTotalMissions() {
  const value = Number(localStorage.getItem(TOTAL_MISSIONS_KEY) || "0");
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function incrementTotalMissions() {
  localStorage.setItem(
    TOTAL_MISSIONS_KEY,
    String(getTotalMissions() + 1)
  );
}

function getLevelData() {
  const total = getLifetimeEarned();

  const levels = [
    { name: "Pemula", min: 0, icon: "🌱", color: "#7a7a7a" },
    { name: "Perunggu", min: 500, icon: "🥉", color: "#9a5a2b" },
    { name: "Perak", min: 2000, icon: "🥈", color: "#707b88" },
    { name: "Emas", min: 5000, icon: "🥇", color: "#d49d00" },
    { name: "Platinum", min: 10000, icon: "💎", color: "#4a78a6" }
  ];

  let current = levels[0];
  let next = null;

  for (let i = 0; i < levels.length; i++) {
    if (total >= levels[i].min) {
      current = levels[i];
      next = levels[i + 1] || null;
    }
  }

  if (!next) {
    return {
      ...current,
      total,
      next: null,
      progress: 100,
      remaining: 0
    };
  }

  const span = next.min - current.min;
  const done = total - current.min;
  const progress = Math.max(0, Math.min(100, Math.round((done / span) * 100)));

  return {
    ...current,
    total,
    next,
    progress,
    remaining: Math.max(0, next.min - total)
  };
}

function getBadges() {
  const missions = getTotalMissions();
  const earned = getLifetimeEarned();
  const rewards = getRewardHistory().length;

  return [
    {
      icon: "🌱",
      name: "Pemula",
      description: "Bergabung di RewardKu",
      earned: true
    },
    {
      icon: "🎯",
      name: "Rajin Misi",
      description: "Selesaikan 5 misi",
      earned: missions >= 5
    },
    {
      icon: "⭐",
      name: "Kolektor",
      description: "Kumpulkan 1.000 poin seumur hidup",
      earned: earned >= 1000
    },
    {
      icon: "🎁",
      name: "Penukar",
      description: "Tukar reward pertama",
      earned: rewards >= 1
    },
    {
      icon: "🏆",
      name: "Master Poin",
      description: "Kumpulkan 5.000 poin seumur hidup",
      earned: earned >= 5000
    }
  ];
}

function renderProfileV10() {
  const level = getLevelData();
  const badges = getBadges();

  const levelName = document.getElementById("profileLevelName");
  const levelProgress = document.getElementById("profileLevelProgress");
  const levelRemaining = document.getElementById("profileLevelRemaining");
  const levelBar = document.getElementById("profileLevelBar");
  const levelIcon = document.getElementById("profileLevelIcon");
  const lifetimeEl = document.getElementById("profileLifetimeStat");
  const missionEl = document.getElementById("profileMissionStat");
  const rewardEl = document.getElementById("profileRewardStat");
  const badgesEl = document.getElementById("profileBadges");

  if (levelName) {
    levelName.textContent = level.name;
    levelName.style.color = level.color;
  }

  if (levelIcon) levelIcon.textContent = level.icon;
  if (levelProgress) levelProgress.textContent = level.progress + "%";
  if (levelBar) levelBar.style.width = level.progress + "%";
  if (lifetimeEl) lifetimeEl.textContent = formatPoints(level.total);
  if (missionEl) missionEl.textContent = getTotalMissions();
  if (rewardEl) rewardEl.textContent = getRewardHistory().length;

  if (levelRemaining) {
    levelRemaining.textContent = level.next
      ? "Butuh " + formatPoints(level.remaining) + " poin lagi menuju " + level.next.name
      : "🏆 Level maksimum tercapai";
  }

  if (badgesEl) {
    badgesEl.innerHTML = badges.map((badge) => `
      <div class="rewardku-badge ${badge.earned ? "earned" : "locked"}">
        <div class="rewardku-badge-icon">${badge.icon}</div>
        <div>
          <strong>${escapeHtml(badge.name)}</strong>
          <small>${escapeHtml(badge.description)}</small>
        </div>
      </div>
    `).join("");
  }
}

/* Override profil agar V10 mempunyai level + badge. */
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
            <p>Profil, level & pencapaian</p>
          </div>
          <button class="rewardku-profile-close" type="button" id="rewardkuProfileClose">×</button>
        </div>

        <div class="rewardku-level-card">
          <div class="rewardku-level-icon" id="profileLevelIcon">🌱</div>
          <div class="rewardku-level-main">
            <div class="rewardku-level-title">
              <span>LEVEL</span>
              <strong id="profileLevelName">Pemula</strong>
              <b id="profileLevelProgress">0%</b>
            </div>
            <div class="rewardku-level-track">
              <i id="profileLevelBar"></i>
            </div>
            <small id="profileLevelRemaining">Mulai kumpulkan poin untuk naik level.</small>
          </div>
        </div>

        <div class="rewardku-stats">
          <div class="rewardku-stat">
            <strong id="profilePointStat">0</strong>
            <span>Poin Saat Ini</span>
          </div>
          <div class="rewardku-stat">
            <strong id="profileLifetimeStat">0</strong>
            <span>Poin Dikumpulkan</span>
          </div>
          <div class="rewardku-stat">
            <strong id="profileMissionStat">0</strong>
            <span>Misi Selesai</span>
          </div>
          <div class="rewardku-stat">
            <strong id="profileRewardStat">0</strong>
            <span>Reward Ditukar</span>
          </div>
        </div>

        <div class="rewardku-profile-section-title">
          <h3>🏅 Pencapaian</h3>
          <span>Kumpulkan semuanya</span>
        </div>

        <div id="profileBadges" class="rewardku-badges"></div>

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
          💡 Level dan badge dihitung dari aktivitas yang tercatat di perangkat ini.
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
  renderProfileV10();
  overlay.classList.add("show");
}

/* Override renderProfile agar stat V10 ikut terisi. */
function renderProfile() {
  const profile = getProfile();
  const name = profile.name || "Pengguna RewardKu";

  const nameEl = document.getElementById("rewardkuProfileName");
  const pointEl = document.getElementById("profilePointStat");
  const missionEl = document.getElementById("profileMissionStat");
  const rewardEl = document.getElementById("profileRewardStat");
  const themeText = document.getElementById("profileThemeText");

  if (nameEl) nameEl.textContent = name;
  if (pointEl) pointEl.textContent = formatPoints(getPoints());
  if (missionEl) missionEl.textContent = getTotalMissions();
  if (rewardEl) rewardEl.textContent = getRewardHistory().length;

  if (themeText) {
    themeText.textContent = document.body.classList.contains("dark-mode")
      ? "Mode terang"
      : "Mode malam";
  }

  renderProfileV10();
}

/* Override klaim misi agar statistik lifetime ikut bertambah. */
function claimMission(id, amount) {
  if (!MISSIONS[id]) return;
  if (isMissionClaimed(id)) return;

  const reward = Number(amount || MISSIONS[id]);
  const state = getMissionState();

  state[id] = todayKey();
  saveMissionState(state);

  savePoints(getPoints() + reward);
  recordLifetimeEarned(reward);
  incrementTotalMissions();

  updatePoints();
  updateMissionButtons();
  renderProfileV10();

  showToast("🎉 +" + formatPoints(reward) + " poin berhasil didapat!");
}

/* Override share agar poin share juga masuk statistik lifetime. */
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
    recordLifetimeEarned(50);
    incrementTotalMissions();

    updatePoints();
    updateMissionButtons();
    renderProfileV10();

    showToast("🎉 Misi berbagi selesai! +50 poin");
  } catch (error) {
    // Pengguna membatalkan share: tidak ada poin.
  }
}

/* Refresh statistik setelah reward ditukar / startup. */
function refreshV10Stats() {
  getLifetimeEarned();
  if (document.getElementById("rewardku-profile-overlay")?.classList.contains("show")) {
    renderProfile();
  }
}
document.addEventListener("DOMContentLoaded", refreshV10Stats);

/* =========================================================
   RewardKu V11 - SUPABASE AUTH + CLOUD DATA
   Replace the two config values before deploying.
   Use the browser publishable/anon key only.
   Never put a service_role key here.
   ========================================================= */

window.__rewardkuLocalClaimMission = window.claimMission;

const REWARDKU_SUPABASE_URL = "https://egrmjzpdldhobnkpxavf.supabase.co";
const REWARDKU_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TSSBozeizM0rERZCriiipg_IjnwUVRQ";

let rewardkuSupabase = null;
let rewardkuAuthReady = false;

function hasSupabaseConfig() {
  return (
    REWARDKU_SUPABASE_URL.startsWith("https://") &&
    !REWARDKU_SUPABASE_URL.includes("YOUR_SUPABASE") &&
    REWARDKU_SUPABASE_PUBLISHABLE_KEY &&
    !REWARDKU_SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE")
  );
}

function loadSupabaseSDK() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) {
      resolve(window.supabase);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;
    script.onload = () => window.supabase ? resolve(window.supabase) : reject(new Error("Supabase SDK tidak tersedia"));
    script.onerror = () => reject(new Error("Gagal memuat Supabase SDK"));
    document.head.appendChild(script);
  });
}

async function initRewardKuCloud() {
  if (!hasSupabaseConfig()) {
    rewardkuAuthReady = false;
    return null;
  }

  try {
    const sdk = await loadSupabaseSDK();

    rewardkuSupabase = sdk.createClient(
      REWARDKU_SUPABASE_URL,
      REWARDKU_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      }
    );

    rewardkuAuthReady = true;

    rewardkuSupabase.auth.onAuthStateChange(() => {
      setTimeout(syncCloudAccount, 0);
    });

    await syncCloudAccount();
    return rewardkuSupabase;
  } catch (error) {
    console.error(error);
    showToast("☁️ Cloud belum siap. Cek konfigurasi Supabase.");
    return null;
  }
}

async function getCloudUser() {
  if (!rewardkuSupabase) return null;
  const { data } = await rewardkuSupabase.auth.getUser();
  return data?.user || null;
}

async function getCloudProfile() {
  const user = await getCloudUser();
  if (!user) return null;

  const { data, error } = await rewardkuSupabase
    .from("profiles")
    .select("id, display_name, public_code, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

async function getCloudBalance() {
  if (!rewardkuSupabase) return null;

  const { data, error } =
    await rewardkuSupabase.rpc("get_my_balance");

  if (error) {
    console.error(error);
    return null;
  }

  return Number(data || 0);
}

async function syncCloudAccount() {
  if (!rewardkuSupabase) {
    updateCloudUI();
    return;
  }

  const user = await getCloudUser();

  if (!user) {
    updateCloudUI(null, null);
    return;
  }

  const [profile, balance] = await Promise.all([
    getCloudProfile(),
    getCloudBalance()
  ]);

  updateCloudUI(user, profile);

  if (Number.isFinite(balance)) {
    savePoints(balance);
    updatePoints();
  }
}

function updateCloudUI(user, profile) {
  const cloudBadge =
    document.getElementById("rewardkuCloudBadge");

  const cloudButton =
    document.getElementById("rewardkuCloudButton");

  if (user) {
    if (cloudBadge) {
      cloudBadge.textContent = "☁️ Online";
      cloudBadge.classList.add("online");
    }

    if (cloudButton) {
      cloudButton.textContent = "👤 Akun Cloud";
    }

    if (profile?.display_name) {
      saveProfile({
        name: profile.display_name,
        cloudId: profile.public_code || ""
      });
    }
  } else {
    if (cloudBadge) {
      cloudBadge.textContent = "📱 Lokal";
      cloudBadge.classList.remove("online");
    }

    if (cloudButton) {
      cloudButton.textContent = "🔐 Login / Daftar";
    }
  }
}

/* ---------- AUTH MODAL ---------- */

function openAuthModal() {
  const old = document.getElementById("rewardku-auth-overlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.id = "rewardku-auth-overlay";
  overlay.className = "rewardku-auth-overlay";

  overlay.innerHTML = `
    <div class="rewardku-auth-card">
      <button type="button" class="rewardku-auth-close" id="authClose">×</button>
      <div class="rewardku-auth-logo">🎁</div>
      <h2 id="authTitle">Masuk ke RewardKu</h2>
      <p id="authSubtitle">Simpan poinmu di cloud agar bisa dipakai lintas perangkat.</p>

      <div class="rewardku-auth-switch">
        <button type="button" class="active" id="authLoginTab">Masuk</button>
        <button type="button" id="authRegisterTab">Daftar</button>
      </div>

      <form id="rewardkuAuthForm">
        <label>Email</label>
        <input id="authEmail" type="email" autocomplete="email" placeholder="nama@email.com" required>

        <label>Password</label>
        <input id="authPassword" type="password" autocomplete="current-password" placeholder="Minimal 6 karakter" minlength="6" required>

        <input id="authName" type="text" autocomplete="name" placeholder="Nama pengguna" style="display:none;">

        <button type="submit" class="rewardku-auth-submit" id="authSubmit">Masuk</button>
      </form>

      <div class="rewardku-auth-status" id="authStatus"></div>

      <div class="rewardku-auth-note">
        🔒 Password diproses oleh layanan autentikasi Supabase; jangan pernah memasukkan service_role key ke aplikasi.
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  let mode = "login";

  const title = document.getElementById("authTitle");
  const subtitle = document.getElementById("authSubtitle");
  const submit = document.getElementById("authSubmit");
  const nameInput = document.getElementById("authName");
  const loginTab = document.getElementById("authLoginTab");
  const registerTab = document.getElementById("authRegisterTab");
  const status = document.getElementById("authStatus");

  const setMode = (next) => {
    mode = next;
    const register = mode === "register";

    title.textContent = register ? "Buat Akun RewardKu" : "Masuk ke RewardKu";
    subtitle.textContent = register
      ? "Buat akun untuk menyimpan poin dan riwayat secara online."
      : "Simpan poinmu di cloud agar bisa dipakai lintas perangkat.";
    submit.textContent = register ? "Daftar" : "Masuk";

    nameInput.style.display = register ? "block" : "none";
    nameInput.required = register;

    loginTab.classList.toggle("active", !register);
    registerTab.classList.toggle("active", register);
    status.textContent = "";
  };

  loginTab.onclick = () => setMode("login");
  registerTab.onclick = () => setMode("register");
  document.getElementById("authClose").onclick = () => overlay.remove();

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });

  document.getElementById("rewardkuAuthForm").onsubmit = async (event) => {
    event.preventDefault();

    if (!rewardkuSupabase) {
      status.textContent = "Supabase belum dikonfigurasi.";
      return;
    }

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const displayName = nameInput.value.trim().slice(0, 30);

    submit.disabled = true;
    status.textContent = register ? "Membuat akun..." : "Memproses...";

    try {
      let result;

      if (mode === "register") {
        result = await rewardkuSupabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || "Pengguna RewardKu"
            },
            emailRedirectTo: location.href
          }
        });
      } else {
        result = await rewardkuSupabase.auth.signInWithPassword({
          email,
          password
        });
      }

      if (result.error) throw result.error;

      if (mode === "register" && !result.data.session) {
        status.textContent = "✅ Akun dibuat. Cek email untuk konfirmasi bila diminta.";
      } else {
        status.textContent = "✅ Berhasil masuk.";
        await syncCloudAccount();
        setTimeout(() => overlay.remove(), 450);
      }
    } catch (error) {
      console.error(error);
      status.textContent = "❌ " + (error.message || "Terjadi kesalahan.");
    } finally {
      submit.disabled = false;
    }
  };
}

async function logoutCloud() {
  if (!rewardkuSupabase) return;

  const { error } = await rewardkuSupabase.auth.signOut();
  if (error) {
    showToast("❌ Gagal keluar.");
    return;
  }

  showToast("👋 Kamu sudah keluar dari akun cloud.");
  updateCloudUI(null, null);
}

/* ---------- CLOUD PROFILE PANEL ---------- */

function openCloudProfile() {
  if (!rewardkuSupabase) {
    showToast("☁️ Supabase belum dikonfigurasi.");
    return;
  }

  getCloudUser().then(async (user) => {
    if (!user) {
      openAuthModal();
      return;
    }

    const profile = await getCloudProfile();

    const old = document.getElementById("rewardku-cloud-panel");
    if (old) old.remove();

    const panel = document.createElement("div");
    panel.id = "rewardku-cloud-panel";
    panel.className = "rewardku-cloud-overlay";

    panel.innerHTML = `
      <div class="rewardku-cloud-card">
        <button type="button" class="rewardku-auth-close" id="cloudClose">×</button>
        <div class="rewardku-auth-logo">☁️</div>
        <h2>${escapeHtml(profile?.display_name || "Pengguna RewardKu")}</h2>
        <p>${escapeHtml(user.email || "")}</p>

        <div class="rewardku-cloud-code">
          <span>ID Pengguna</span>
          <strong>${escapeHtml(profile?.public_code || user.id.slice(0, 8))}</strong>
        </div>

        <div class="rewardku-cloud-balance">
          <span>Saldo Cloud</span>
          <strong id="cloudBalanceValue">${formatPoints(getPoints())} ⭐</strong>
        </div>

        <button type="button" class="rewardku-auth-submit" id="cloudSyncButton">☁️ Sinkronkan</button>
        <button type="button" class="rewardku-cloud-logout" id="cloudLogoutButton">Keluar Akun</button>
      </div>
    `;

    document.body.appendChild(panel);

    document.getElementById("cloudClose").onclick = () => panel.remove();
    panel.addEventListener("click", (e) => {
      if (e.target === panel) panel.remove();
    });

    document.getElementById("cloudSyncButton").onclick = async () => {
      await syncCloudAccount();
      const value = document.getElementById("cloudBalanceValue");
      if (value) value.textContent = formatPoints(getPoints()) + " ⭐";
      showToast("✅ Data cloud diperbarui.");
    };

    document.getElementById("cloudLogoutButton").onclick = async () => {
      await logoutCloud();
      panel.remove();
    };
  });
}

/* ---------- SERVER-BASED MISSION ---------- */

async function claimMission(id, amount) {
  if (!rewardkuSupabase) {
    // Fallback ke demo lokal agar V11 belum dikonfigurasi.
    if (typeof window.__rewardkuLocalClaimMission === "function") {
      return window.__rewardkuLocalClaimMission(id, amount);
    }
    showToast("☁️ Login cloud belum tersedia.");
    return;
  }

  const user = await getCloudUser();

  if (!user) {
    openAuthModal();
    return;
  }

  const { data, error } =
    await rewardkuSupabase.rpc("claim_mission", {
      p_mission_id: id
    });

  if (error) {
    if (String(error.message).includes("ALREADY_CLAIMED")) {
      showToast("⚠️ Misi ini sudah diklaim hari ini.");
    } else {
      console.error(error);
      showToast("❌ Misi gagal diklaim: " + error.message);
    }
    return;
  }

  await syncCloudAccount();
  updateMissionButtons();
  showToast("🎉 +" + formatPoints(data?.reward || amount || 0) + " poin masuk ke akun cloud.");
}

/* ---------- SERVER-BASED REDEMPTION ---------- */

function redeemReward(rewardName, cost, icon) {
  showRewardDetail(rewardName, cost, icon);
}

function redeemRewardConfirmOnly(rewardName, cost, icon) {
  const old = document.getElementById("reward-confirm-modal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "reward-confirm-modal";
  modal.className = "reward-overlay";

  modal.innerHTML = `
    <div class="reward-modal rewardku-confirm-v10">
      <div class="reward-modal-icon">${icon}</div>
      <div class="rewardku-confirm-badge">KONFIRMASI</div>
      <h2>Tukar ${escapeHtml(rewardName)}?</h2>
      <p>Gunakan <strong>${formatPoints(cost)} ⭐</strong> dari saldo kamu.</p>
      <div class="rewardku-confirm-summary">
        <span>Poin sekarang</span><strong>${formatPoints(getPoints())} ⭐</strong>
        <span>Poin setelah tukar</span><strong>${formatPoints(getPoints() - cost)} ⭐</strong>
      </div>
      <button type="button" class="reward-confirm" id="confirmRewardButton">🎁 Ya, Tukarkan</button>
      <button type="button" class="reward-cancel" id="cancelRewardButton">Batal</button>
    </div>
  `;

  document.body.appendChild(modal);
  document.getElementById("cancelRewardButton").onclick = () => modal.remove();
  document.getElementById("confirmRewardButton").onclick = () =>
    confirmRedeemReward(rewardName, cost, icon, modal);
}

async function confirmRedeemReward(rewardName, cost, icon, modal) {
  if (!rewardkuSupabase) {
    showToast("☁️ Sistem cloud belum aktif.");
    if (modal) modal.remove();
    return;
  }

  const user = await getCloudUser();
  if (!user) {
    if (modal) modal.remove();
    openAuthModal();
    return;
  }

  const { data, error } = await rewardkuSupabase.rpc("redeem_reward", {
    p_reward_name: rewardName,
    p_reward_code: rewardName.toLowerCase().replace(/\s+/g, "_"),
    p_cost: Number(cost)
  });

  if (error) {
    console.error(error);

    if (String(error.message).includes("INSUFFICIENT_POINTS")) {
      showRewardInsufficient(rewardName, cost, getPoints());
    } else {
      showToast("❌ Penukaran gagal: " + error.message);
    }

    if (modal) modal.remove();
    return;
  }

  if (data?.new_balance !== undefined) {
    savePoints(Number(data.new_balance));
  } else {
    await syncCloudAccount();
  }

  updatePoints();
  renderRewardHistory();
  if (modal) modal.remove();

  showToast("🎉 Penukaran berhasil dicatat. Saldo tersisa " + formatPoints(getPoints()) + " ⭐");
}

/* ---------- CLOUD REWARD HISTORY ---------- */

async function renderCloudRewardHistory() {
  if (!rewardkuSupabase) return;

  const user = await getCloudUser();
  if (!user) return;

  const { data, error } = await rewardkuSupabase
    .from("redemptions")
    .select("reward_name, cost, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error);
    return;
  }

  const container = document.getElementById("rewardHistory");
  if (!container) return;

  if (!data?.length) {
    container.innerHTML =
      `<div class="empty-history">Belum ada penukaran reward.</div>`;
    return;
  }

  container.innerHTML = data.map(item => `
    <div class="history-item">
      <div class="history-icon">🎁</div>
      <div class="history-info">
        <strong>${escapeHtml(item.reward_name)}</strong>
        <small>${new Date(item.created_at).toLocaleString("id-ID")} • ${escapeHtml(item.status)}</small>
      </div>
      <div class="history-points">-${formatPoints(item.cost)} ⭐</div>
    </div>
  `).join("");
}

/* ---------- SMALL UI PATCH ---------- */

function ensureCloudUI() {
  if (document.getElementById("rewardkuCloudBadge")) return;

  const badge = document.createElement("div");
  badge.id = "rewardkuCloudBadge";
  badge.className = "rewardku-cloud-badge";
  badge.textContent = "📱 Lokal";

  document.body.appendChild(badge);
}

function installV11Hooks() {
  ensureCloudUI();

  const profileButtons =
    [...document.querySelectorAll('[onclick*="showMessage(\'Profil\')"], [onclick*="showMessage("Profil")"]')];

  profileButtons.forEach((button) => {
    button.onclick = openCloudProfile;
  });

  const accountButtons =
    [...document.querySelectorAll(".bottom-nav button")];

  accountButtons.forEach((button) => {
    const text = button.textContent || "";
    if (text.includes("Akun")) {
      button.onclick = openCloudProfile;
    }
  });

  const rewardButtons =
    [...document.querySelectorAll('[onclick*="showRewardPage"]')];

  rewardButtons.forEach((button) => {
    button.onclick = showRewardPage;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  installV11Hooks();
  await initRewardKuCloud();
  await renderCloudRewardHistory();
});
