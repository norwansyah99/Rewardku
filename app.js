// ================================
// REWARDKU - JAVASCRIPT
// ================================

let points = 1250;

// Menampilkan pesan ketika tombol ditekan
function showMessage(message) {
  alert(message + " sedang dalam pengembangan 🚀");
}

// Fungsi menambah poin
function addPoints(amount) {
  points += amount;

  document.getElementById("points").textContent =
    points.toLocaleString("id-ID") + " ⭐";
}

// Login harian
function dailyReward() {
  addPoints(10);

  alert("🎉 Selamat!\nKamu mendapatkan +10 poin.");
}
