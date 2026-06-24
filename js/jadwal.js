const hariList = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const hariWrapper = document.getElementById("hariWrapper");
const form = document.getElementById("jadwalForm");
const saveBtn = document.getElementById("saveScheduleBtn");
const BASE_URL = "https://dzhar-schedule-api-default-rtdb.firebaseio.com/schedule";
const userId = sessionStorage.getItem("userId") || "guest";

const popup = document.getElementById("customPopup");
const popupIcon = document.getElementById("popupIcon");
const popupTitle = document.getElementById("popupTitle");
const popupMessage = document.getElementById("popupMessage");
const popupButton = document.getElementById("popupButton");

let redirectAfterPopup = null;

function showPopup(title, message, icon = "✅", isError = false, redirectUrl = null) {
  popupIcon.textContent = icon;
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popupButton.classList.toggle("error", isError);
  popup.classList.remove("hidden");
  popup.setAttribute("aria-hidden", "false");
  redirectAfterPopup = redirectUrl;
}

function closePopup() {
  popup.classList.add("hidden");
  popup.setAttribute("aria-hidden", "true");
  if (redirectAfterPopup) {
    const target = redirectAfterPopup;
    redirectAfterPopup = null;
    window.location.href = target;
  }
}

popupButton.addEventListener("click", closePopup);
popup.addEventListener("click", (event) => {
  if (event.target === popup) closePopup();
});

function createDayCards() {
  hariWrapper.innerHTML = "";

  hariList.forEach((hari) => {
    const card = document.createElement("div");
    card.classList.add("hari-card");

    card.innerHTML = `
      <h2>${hari}</h2>
      <label for="${hari}_motivasi">Motivasi Hari Ini</label>
      <textarea id="${hari}_motivasi" name="${hari}_motivasi" placeholder="Tuliskan motivasi untuk hari ini..."></textarea>

      <div class="kegiatan-container" id="kegiatan-${hari}"></div>

      <button type="button" class="add-activity-btn">+ Tambah Kegiatan</button>
    `;

    const kegiatanContainer = card.querySelector(`#kegiatan-${hari}`);
    const addBtn = card.querySelector(".add-activity-btn");

    for (let i = 0; i < 2; i++) addKegiatanInput(hari, kegiatanContainer);

    addBtn.addEventListener("click", () => {
      if (kegiatanContainer.children.length < 6) {
        addKegiatanInput(hari, kegiatanContainer);
      } else {
        showPopup("Batas Maksimal", "Maksimal 6 kegiatan per hari ya.", "⚠️", true);
      }
    });

    hariWrapper.appendChild(card);
  });
}

function addKegiatanInput(hari, container, activity = {}) {
  const row = document.createElement("div");
  row.classList.add("kegiatan-row");

  row.innerHTML = `
    <input type="time" name="${hari}_jam[]" value="${activity.time || ""}" required>
    <input type="text" name="${hari}_task[]" placeholder="Nama kegiatan..." value="${activity.task || ""}" required>
    <button type="button" class="delete-btn" title="Hapus kegiatan" aria-label="Hapus kegiatan">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
      </svg>
    </button>
  `;

  row.querySelector(".delete-btn").addEventListener("click", () => {
    if (container.children.length > 1) {
      row.remove();
    } else {
      showPopup("Minimal 1 Kegiatan", "Setiap hari harus punya minimal 1 kegiatan.", "⚠️", true);
    }
  });

  container.appendChild(row);
}

function collectScheduleData() {
  const jadwalObject = {};

  hariList.forEach((hari) => {
    const motivasi = form[`${hari}_motivasi`].value.trim();
    const jamInputs = form.querySelectorAll(`[name="${hari}_jam[]"]`);
    const taskInputs = form.querySelectorAll(`[name="${hari}_task[]"]`);

    const activities = Array.from(jamInputs).map((input, index) => ({
      time: input.value,
      task: taskInputs[index].value.trim()
    }));

    jadwalObject[hari] = {
      motivation: motivasi || "Semangat hari ini!",
      activities
    };
  });

  return jadwalObject;
}

async function loadExistingSchedule() {
  try {
    const response = await fetch(`${BASE_URL}/${userId}.json`);
    const data = await response.json();
    if (!data || Array.isArray(data)) return;

    hariList.forEach((hari) => {
      const detail = data[hari];
      if (!detail) return;

      const motivasiInput = form[`${hari}_motivasi`];
      const container = document.getElementById(`kegiatan-${hari}`);
      if (!motivasiInput || !container) return;

      motivasiInput.value = detail.motivation || "";

      if (Array.isArray(detail.activities) && detail.activities.length > 0) {
        container.innerHTML = "";
        detail.activities.slice(0, 6).forEach((activity) => addKegiatanInput(hari, container, activity));
      }
    });
  } catch (error) {
    console.warn("Tidak bisa memuat jadwal lama:", error);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    showPopup("Data Belum Lengkap", "Isi semua jam dan nama kegiatan terlebih dahulu.", "⚠️", true);
    return;
  }

  const jadwalObject = collectScheduleData();

  try {
    saveBtn.classList.add("is-loading");
    saveBtn.textContent = "Menyimpan...";

    await fetch(`${BASE_URL}/${userId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jadwalObject)
    });

    showPopup(
      "Berhasil Disimpan!",
      "Jadwal mingguan kamu telah tersimpan dengan aman ✨",
      "✅",
      false,
      "reminder.html"
    );
  } catch (error) {
    console.error(error);
    showPopup("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan jadwal. Coba lagi nanti.", "❌", true);
  } finally {
    saveBtn.classList.remove("is-loading");
    saveBtn.textContent = "Simpan Jadwal";
  }
});

createDayCards();
loadExistingSchedule();
