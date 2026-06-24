const list = document.getElementById("reminderList");
const form = document.getElementById("scheduleForm");
const fab = document.getElementById("fab");
const formPopup = document.getElementById("formPopup");
const submitBtn = document.getElementById("submitBtn");
const closePopupBtn = document.getElementById("closePopup");
const popupTitle = document.getElementById("popupTitle");

const userId = sessionStorage.getItem("userId") || "guest";
const REMINDER_KEY = `reminders_${userId}`;
const BASE_URL = `https://dzhar-schedule-api-default-rtdb.firebaseio.com/schedule/${userId}.json`;

let editingKey = null;

// ==== Custom Popup/Toast (pengganti alert & confirm bawaan browser) ====
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
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
  });
}

// ==== JAM ====
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
updateClock();

// ==== Reminder Local ====
function getReminders() {
  try {
    return JSON.parse(sessionStorage.getItem(REMINDER_KEY) || "[]");
  } catch (error) {
    console.error("Data reminder rusak:", error);
    return [];
  }
}
function saveReminders(reminders) {
  sessionStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}
function canAddReminder() {
  return getReminders().length < 5;
}

// ==== Popup Form ====
function openForm(editMode = false) {
  if (!formPopup) return;
  formPopup.classList.remove("hidden");
  formPopup.setAttribute("aria-hidden", "false");
  fab.classList.add("is-open");
  fab.textContent = "×";
  if (popupTitle) popupTitle.textContent = editMode ? "Edit Reminder" : "Tambah Reminder";
  if (submitBtn) submitBtn.textContent = editMode ? "Update Reminder" : "Simpan Reminder";
}

function closeForm(reset = true) {
  if (!formPopup) return;
  formPopup.classList.add("hidden");
  formPopup.setAttribute("aria-hidden", "true");
  fab.classList.remove("is-open");
  fab.textContent = "+";
  if (reset) resetForm();
}

fab.addEventListener("click", () => {
  if (formPopup.classList.contains("hidden")) {
    openForm(false);
  } else {
    closeForm(true);
  }
});

if (closePopupBtn) {
  closePopupBtn.addEventListener("click", () => closeForm(true));
}

// ==== Submit Reminder ====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const taskName = document.getElementById("taskName").value.trim();
  const taskTime = document.getElementById("taskTime").value;
  if (!taskName || !taskTime) {
    showToast("Data belum lengkap", "Isi nama kegiatan dan jam terlebih dahulu.", "warning");
    return;
  }

  let reminders = getReminders();
  const isEditing = editingKey !== null;

  if (!isEditing) {
    if (!canAddReminder()) {
      showToast("Reminder penuh", "Maksimal 5 reminder per hari ya.", "warning");
      return;
    }
    reminders.push({ name: taskName, time: taskTime, done: false, notified: false });
  } else {
    reminders[editingKey] = {
      ...reminders[editingKey],
      name: taskName,
      time: taskTime,
      done: false,
      notified: false
    };
    editingKey = null;
  }

  saveReminders(reminders);
  closeForm(true);
  loadData();
  showToast(isEditing ? "Reminder diperbarui" : "Reminder disimpan", `${taskTime} - ${taskName}`, "success");
});

// ==== Render Reminder ====
function loadData() {
  const reminders = getReminders().sort((a, b) => a.time.localeCompare(b.time));
  saveReminders(reminders);
  clearList();
  reminders.forEach((item, index) => createListItem(item, index));
  updateReminderProgress();
}

function createListItem(item, index) {
  const li = document.createElement("li");
  if (item.done) li.classList.add("is-done");

  const check = document.createElement("input");
  check.type = "checkbox";
  check.classList.add("reminder-checkbox");
  check.checked = item.done || false;
  check.setAttribute("aria-label", `Tandai ${item.name} selesai`);
  check.addEventListener("change", () => {
    let reminders = getReminders();
    reminders[index].done = check.checked;
    saveReminders(reminders);
    loadData();
  });

  const textSpan = document.createElement("span");
  textSpan.textContent = `${item.time} - ${item.name}`;

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.className = "edit-btn";
  editBtn.addEventListener("click", () => {
    document.getElementById("taskName").value = item.name;
    document.getElementById("taskTime").value = item.time;
    editingKey = index;
    openForm(true);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Hapus";
  deleteBtn.className = "delete-btn";
  deleteBtn.addEventListener("click", async () => {
    const confirmed = await showConfirm(
      "Hapus reminder?",
      `Reminder “${item.name}” akan dihapus dari daftar kamu.`,
      "Hapus",
      "Batal"
    );
    if (!confirmed) return;

    let reminders = getReminders();
    reminders.splice(index, 1);
    saveReminders(reminders);
    loadData();
    showToast("Reminder dihapus", "Data reminder berhasil diperbarui.", "danger");
  });

  li.appendChild(check);
  li.appendChild(textSpan);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);
  list.appendChild(li);
}

function clearList() {
  while (list.firstChild) list.removeChild(list.firstChild);
}
function resetForm() {
  form.reset();
  editingKey = null;
  if (popupTitle) popupTitle.textContent = "Tambah Reminder";
  if (submitBtn) submitBtn.textContent = "Simpan Reminder";
}

function updateReminderProgress() {
  const reminders = getReminders();
  const total = reminders.length;
  const checked = reminders.filter(r => r.done).length;
  document.getElementById("doneCount").textContent = checked;
  document.getElementById("totalCount").textContent = total;
  const percent = total > 0 ? (checked / total) * 100 : 0;
  document.getElementById("progressFillClock").style.width = percent + "%";
}

// ==== Notifikasi Reminder ====
setInterval(() => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  let reminders = getReminders();
  let changed = false;

  reminders.forEach(r => {
    if (r.time === currentTime && !r.notified && !r.done) {
      showToast("⏰ Waktunya!", r.name, "success", 5200);
      r.notified = true;
      changed = true;
    }
  });

  if (changed) saveReminders(reminders);
}, 5000);

// Reset status notified setiap pergantian hari/saat reload beda tanggal
(function resetDailyNotificationFlag() {
  const today = new Date().toISOString().slice(0, 10);
  const savedDay = sessionStorage.getItem(`${REMINDER_KEY}_date`);
  if (savedDay !== today) {
    const reminders = getReminders().map(r => ({ ...r, notified: false }));
    saveReminders(reminders);
    sessionStorage.setItem(`${REMINDER_KEY}_date`, today);
  }
})();

// ==== Jadwal Mingguan ====
async function loadJadwalMingguan() {
  const container = document.getElementById("slider-jadwal");
  const promptEl = document.getElementById("prompt-jadwal");
  const jadwalEl = document.getElementById("jadwal-berjalan");

  if (!container || !promptEl || !jadwalEl) return;

  while (container.firstChild) container.removeChild(container.firstChild);

  try {
    const res = await fetch(BASE_URL);
    const data = await res.json();

    if (!data) {
      promptEl.classList.remove("hidden");
      jadwalEl.classList.add("hidden");
      return;
    }

    let adaJadwal = false;
    const hariUrut = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

    const renderCard = (hari, detail) => {
      if (!detail) return;
      adaJadwal = true;

      const card = document.createElement("div");
      card.className = "hari-box";

      const h3 = document.createElement("h3");
      h3.textContent = hari;
      card.appendChild(h3);

      const activities = detail.activities || [];
      if (activities.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "Belum ada kegiatan.";
        card.appendChild(empty);
      } else {
        activities.forEach(act => {
          const p = document.createElement("p");
          p.textContent = `${act.time || "--:--"} - ${act.task || "Kegiatan"}`;
          card.appendChild(p);
        });
      }

      if (detail.motivation) {
        const motivasi = document.createElement("small");
        motivasi.textContent = `Motivasi: ${detail.motivation}`;
        card.appendChild(motivasi);
      }

      container.appendChild(card);
    };

    if (!Array.isArray(data)) {
      hariUrut.forEach(hari => renderCard(hari, data[hari]));
    } else {
      hariUrut.forEach(hari => {
        const hariData = data.find(d => d.day === hari);
        if (hariData) {
          renderCard(hari, {
            motivation: hariData.motivation,
            activities: hariData.activities
          });
        }
      });
    }

    if (adaJadwal) {
      promptEl.classList.add("hidden");
      jadwalEl.classList.remove("hidden");
    } else {
      promptEl.classList.remove("hidden");
      jadwalEl.classList.add("hidden");
    }
  } catch (error) {
    console.error("Gagal memuat jadwal:", error);
    promptEl.classList.remove("hidden");
    jadwalEl.classList.add("hidden");
    showToast("Jadwal belum termuat", "Cek koneksi internet atau coba lagi nanti.", "warning");
  }
}

// ==== Cuaca ====
async function getWeatherByLocation() {
  if (!navigator.geolocation) {
    return getWeather("bandung");
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const apiKey = "a83459902d142e217edd14450b866d8e";
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      updateWeatherUI(data);
    } catch (error) {
      console.error("Gagal memuat cuaca:", error);
      getWeather("bandung");
    }
  }, () => {
    getWeather("bandung");
  });
}

async function getWeather(city = "bandung") {
  const apiKey = "a83459902d142e217edd14450b866d8e";
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    updateWeatherUI(data);
  } catch (error) {
    console.error("Gagal memuat cuaca:", error);
    document.getElementById("weather-temp").textContent = "--°C";
    document.getElementById("weather-city").textContent = "Unknown";
    document.getElementById("weather-icon").src = "";
  }
}

function updateWeatherUI(data) {
  if (!data || !data.main || !data.weather) return;
  document.getElementById("weather-temp").textContent = `${Math.round(data.main.temp)}°C`;
  document.getElementById("weather-city").textContent = data.name || "Unknown";
  document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  loadJadwalMingguan();
  getWeatherByLocation();

  const weatherBtn = document.querySelector(".weather");
  if (weatherBtn) {
    weatherBtn.addEventListener("click", () => {
      window.location.href = "weather.html";
    });
  }
});
