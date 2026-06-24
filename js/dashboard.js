const API_URL = "https://dzhar-schedule-api-default-rtdb.firebaseio.com";
const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");

// === DOM ELEMENT ===
const cardInput = document.getElementById("card-input");
const cardDisplay = document.getElementById("card-number");
const cardForm = document.getElementById("card-form");
const cardView = document.getElementById("card-view");

const currentTimeEl = document.getElementById("current-time");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const balanceEl = document.getElementById("balance");

const usdIncomeEl = document.getElementById("usd-income");
const usdExpenseEl = document.getElementById("usd-expense");
const usdBalanceEl = document.getElementById("usd-balance");

const jumlahInput = document.getElementById("jumlah");
const keteranganInput = document.getElementById("keterangan");
const jenisInput = document.getElementById("jenis");

let transaksi = [];
let chart;
let currentCardId = null;

// === Toast & Modal Custom ===
function ensureToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}

function showToast(title, message = "", type = "success", duration = 3200) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<strong>${title}</strong>${message ? `<span>${message}</span>` : ""}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

function showConfirm(title, message, confirmText = "Ya", cancelText = "Batal") {
  return new Promise(resolve => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <h4>${title}</h4>
        <p>${message}</p>
        <div class="modal-actions">
          <button type="button" class="cancel-btn">${cancelText}</button>
          <button type="button" class="danger-btn">${confirmText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (value) => {
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 180);
      resolve(value);
    };

    overlay.querySelector(".cancel-btn").addEventListener("click", () => close(false));
    overlay.querySelector(".danger-btn").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) close(false);
    });
  });
}

// === CEK LOGIN ===
if (!userId) {
  window.location.href = "login.html";
}

// === JAM REALTIME ===
function updateClock() {
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
setInterval(updateClock, 1000);
updateClock();

function formatRupiah(value) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

async function getUserCard() {
  const cardRes = await fetch(`${API_URL}/cards.json`);
  const cards = await cardRes.json();
  if (!cards) return null;

  const entry = Object.entries(cards).find(([, value]) => value.userId === userId);
  if (!entry) return null;

  return { id: entry[0], ...entry[1] };
}

// === SIMPAN NOMOR KARTU ===
async function simpanCardNumber() {
  const nomor = cardInput.value.trim();
  if (!/^[0-9]{9,15}$/.test(nomor)) {
    showToast("Nomor tidak valid", "Nomor harus angka 9–15 digit.", "warning");
    return;
  }

  try {
    const cardData = { userId, nomor };

    if (currentCardId) {
      await fetch(`${API_URL}/cards/${currentCardId}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData)
      });
    } else {
      const res = await fetch(`${API_URL}/cards.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardData)
      });
      const data = await res.json();
      currentCardId = data.name;
    }

    cardDisplay.textContent = nomor;
    tampilkanDashboard();
    await loadTransaksi();
    showToast("Nomor tersimpan", "Dashboard keuangan sudah aktif.", "success");
  } catch (error) {
    console.error(error);
    showToast("Gagal menyimpan", "Cek koneksi internet atau coba lagi nanti.", "danger");
  }
}

// === EDIT NOMOR KARTU ===
function editCardNumber() {
  cardInput.value = cardDisplay.textContent === "Belum diisi" ? "" : cardDisplay.textContent;
  cardForm.style.display = "grid";
  cardView.style.display = "none";
  cardInput.focus();
}

// Optional reset jika ingin benar-benar hapus nomor
async function resetCardNumber() {
  const confirmed = await showConfirm(
    "Hapus nomor?",
    "Nomor HP / DANA kamu akan dihapus dan dashboard disembunyikan sampai nomor diisi lagi.",
    "Hapus",
    "Batal"
  );
  if (!confirmed) return;

  try {
    if (currentCardId) {
      await fetch(`${API_URL}/cards/${currentCardId}.json`, { method: "DELETE" });
    }
    currentCardId = null;
    cardDisplay.textContent = "Belum diisi";
    sembunyikanDashboard();
    showToast("Nomor dihapus", "Silakan isi nomor kembali untuk membuka dashboard.", "danger");
  } catch (error) {
    console.error(error);
    showToast("Gagal menghapus", "Cek koneksi internet atau coba lagi nanti.", "danger");
  }
}

// === TAMBAH TRANSAKSI ===
async function tambahTransaksi() {
  const jumlah = Number(jumlahInput.value);
  const keterangan = keteranganInput.value.trim();
  const jenis = jenisInput.value;

  if (!jumlah || jumlah <= 0 || !keterangan) {
    showToast("Data belum lengkap", "Isi jumlah dan keterangan dengan benar.", "warning");
    return;
  }

  const transaksiBaru = {
    userId,
    jumlah,
    keterangan,
    jenis,
    tanggal: new Date().toISOString().split("T")[0]
  };

  try {
    await fetch(`${API_URL}/transactions.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaksiBaru)
    });

    jumlahInput.value = "";
    keteranganInput.value = "";
    jenisInput.value = "pemasukan";

    await loadTransaksi();
    showToast("Transaksi tersimpan", `${jenis === "pemasukan" ? "Pemasukan" : "Pengeluaran"} ${formatRupiah(jumlah)}`, "success");
  } catch (error) {
    console.error(error);
    showToast("Gagal menyimpan", "Cek koneksi internet atau coba lagi nanti.", "danger");
  }
}

// === AMBIL DATA TRANSAKSI USER ===
async function loadTransaksi() {
  try {
    const res = await fetch(`${API_URL}/transactions.json`);
    const data = await res.json();
    transaksi = data ? Object.values(data).filter(t => t.userId === userId) : [];
    updateDashboard();
  } catch (error) {
    console.error(error);
    transaksi = [];
    updateDashboard();
    showToast("Data belum termuat", "Cek koneksi untuk memuat transaksi terbaru.", "warning");
  }
}

// === HITUNG & TAMPILKAN DASHBOARD ===
async function updateDashboard() {
  let pemasukan = 0;
  let pengeluaran = 0;

  transaksi.forEach(t => {
    const jumlah = Number(t.jumlah) || 0;
    if (t.jenis === "pemasukan") pemasukan += jumlah;
    else pengeluaran += jumlah;
  });

  const saldo = pemasukan - pengeluaran;

  incomeEl.textContent = formatRupiah(pemasukan);
  expenseEl.textContent = formatRupiah(pengeluaran);
  balanceEl.textContent = formatRupiah(saldo);

  try {
    const kurs = await fetch("https://api.frankfurter.dev/v1/latest?base=IDR&symbols=USD").then(r => r.json());
    const rate = kurs.rates.USD;
    usdIncomeEl.textContent = `≈ $${(pemasukan * rate).toFixed(2)}`;
    usdExpenseEl.textContent = `≈ $${(pengeluaran * rate).toFixed(2)}`;
    usdBalanceEl.textContent = `≈ $${(saldo * rate).toFixed(2)}`;
  } catch {
    usdIncomeEl.textContent = usdExpenseEl.textContent = usdBalanceEl.textContent = "Kurs tidak tersedia";
  }

  updateChart();
}

// === GRAFIK ===
function updateChart() {
  const canvas = document.getElementById("financeChart");
  if (!canvas || typeof Chart === "undefined") return;
  if (chart) chart.destroy();

  const labels = transaksi.length ? transaksi.map(t => `${t.tanggal} - ${t.keterangan}`) : ["Belum ada transaksi"];
  const pemasukanData = transaksi.length ? transaksi.map(t => (t.jenis === "pemasukan" ? Number(t.jumlah) : 0)) : [0];
  const pengeluaranData = transaksi.length ? transaksi.map(t => (t.jenis === "pengeluaran" ? Number(t.jumlah) : 0)) : [0];

  chart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Pemasukan",
          data: pemasukanData,
          backgroundColor: "rgba(5, 194, 39, 0.65)",
          borderColor: "rgba(5, 194, 39, 1)",
          borderWidth: 1,
          borderRadius: 8
        },
        {
          label: "Pengeluaran",
          data: pengeluaranData,
          backgroundColor: "rgba(231, 76, 60, 0.65)",
          borderColor: "rgba(231, 76, 60, 1)",
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: "Poppins" } } }
      },
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 } },
        y: { beginAtZero: true }
      }
    }
  });
}

// === TAMPILKAN / SEMBUNYIKAN DASHBOARD ===
function tampilkanDashboard() {
  document.querySelector(".summary").classList.remove("hidden");
  document.querySelector(".transaksi-grafik").classList.remove("hidden");
  cardForm.style.display = "none";
  cardView.style.display = "grid";
}

function sembunyikanDashboard() {
  document.querySelector(".summary").classList.add("hidden");
  document.querySelector(".transaksi-grafik").classList.add("hidden");
  cardForm.style.display = "grid";
  cardView.style.display = "none";
}

// === SAAT HALAMAN DIBUKA ===
window.addEventListener("DOMContentLoaded", async () => {
  try {
    const cardData = await getUserCard();

    if (cardData) {
      currentCardId = cardData.id;
      cardDisplay.textContent = cardData.nomor;
      tampilkanDashboard();
    } else {
      sembunyikanDashboard();
    }

    await loadTransaksi();
  } catch (error) {
    console.error(error);
    sembunyikanDashboard();
    showToast("Data belum termuat", "Cek koneksi internet atau coba lagi nanti.", "warning");
  }

  document.getElementById("submit-transaksi").addEventListener("click", tambahTransaksi);
  document.getElementById("save-card").addEventListener("click", simpanCardNumber);
  document.getElementById("edit-card").addEventListener("click", editCardNumber);
});
