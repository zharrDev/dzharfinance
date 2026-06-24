const apiKey = "a83459902d142e217edd14450b866d8e";
const userId = sessionStorage.getItem("userId") || "guest";
const lastCityKey = `lastCity_${userId}`;

let currentCity = "bandung";
let map;
let marker;
let forecastChart;

const cityInput = document.getElementById("cityInput");
const searchForm = document.getElementById("weatherSearchForm");

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

function titleCase(text = "") {
  return text.replace(/\b\w/g, char => char.toUpperCase());
}

// === WEATHER NOW ===
async function loadWeather(cityName = currentCity) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric&lang=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (String(data.cod) !== "200") {
      showToast("Kota tidak ditemukan", `Kota “${cityName}” tidak ditemukan.`, "warning");
      return false;
    }

    currentCity = data.name;
    document.getElementById("city-name").textContent = data.name;
    document.getElementById("temperature").textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById("description").textContent = titleCase(data.weather[0].description);
    document.getElementById("humidity").textContent = `Kelembapan: ${data.main.humidity}%`;
    document.getElementById("wind").textContent = `Angin: ${data.wind.speed} m/s`;
    document.getElementById("weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

    setupMap(data.coord.lat, data.coord.lon, data.name, data.main.temp);
    return true;
  } catch (error) {
    console.error("Gagal memuat cuaca:", error);
    showToast("Gagal memuat cuaca", "Cek koneksi internet atau coba lagi nanti.", "danger");
    return false;
  }
}

// === MAP ===
function setupMap(lat, lon, city, temp) {
  if (typeof L === "undefined") {
    document.getElementById("map").innerHTML = "<div class='map-fallback'>Peta belum tersedia.</div>";
    return;
  }

  if (!map) {
    map = L.map("map", { scrollWheelZoom: false }).setView([lat, lon], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);
  } else {
    map.setView([lat, lon], 11);
  }

  if (marker) marker.remove();
  marker = L.marker([lat, lon]).addTo(map).bindPopup(`${city}: ${Math.round(temp)}°C`).openPopup();

  setTimeout(() => map.invalidateSize(), 150);
}

// === FORECAST ===
async function loadForecast(cityName = currentCity) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${apiKey}&units=metric&lang=id`;
    const res = await fetch(url);
    const data = await res.json();

    if (String(data.cod) !== "200") {
      showToast("Forecast belum tersedia", "Ramalan cuaca untuk kota ini belum ditemukan.", "warning");
      return false;
    }

    const listElement = document.getElementById("forecast-list");
    while (listElement.firstChild) listElement.removeChild(listElement.firstChild);

    const labels = [];
    const temps = [];

    data.list.forEach((item, index) => {
      if (index % 8 === 0) {
        const day = new Date(item.dt_txt).toLocaleDateString("id-ID", { weekday: "long" });
        const temp = Math.round(item.main.temp);
        const desc = titleCase(item.weather[0].description);

        const li = document.createElement("li");
        li.innerHTML = `<strong>${day}</strong><span>${temp}°C, ${desc}</span>`;
        listElement.appendChild(li);

        labels.push(new Date(item.dt_txt).toLocaleDateString("id-ID", { weekday: "short" }));
        temps.push(item.main.temp);
      }
    });

    updateForecastChart(labels, temps);
    return true;
  } catch (error) {
    console.error("Gagal memuat forecast:", error);
    showToast("Forecast gagal dimuat", "Cek koneksi internet atau coba lagi nanti.", "danger");
    return false;
  }
}

function updateForecastChart(labels, temps) {
  const canvas = document.getElementById("forecastChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Suhu (°C)",
        data: temps,
        fill: true,
        borderColor: "#078cd4",
        backgroundColor: "rgba(7, 140, 212, 0.16)",
        pointBackgroundColor: "#05c227",
        pointBorderColor: "#05c227",
        pointRadius: 4,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { family: "Poppins" } } }
      },
      scales: {
        y: { beginAtZero: false },
        x: { grid: { display: false } }
      }
    }
  });
}

async function searchCity(cityName, save = true) {
  const okWeather = await loadWeather(cityName);
  if (!okWeather) return;

  await loadForecast(cityName);
  if (save) sessionStorage.setItem(lastCityKey, currentCity);
}

// === SEARCH CITY ===
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = cityInput.value.trim();
  if (!value) {
    showToast("Kota masih kosong", "Masukkan nama kota terlebih dahulu.", "warning");
    return;
  }

  searchCity(value);
  cityInput.value = "";
});

// === AUTO LOCATION ===
function getWeatherByLocation() {
  if (!navigator.geolocation) {
    searchCity("bandung", false);
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=id`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (String(data.cod) === "200") {
          currentCity = data.name;
          searchCity(data.name, false);
        } else {
          searchCity("bandung", false);
        }
      })
      .catch(() => searchCity("bandung", false));
  }, () => {
    searchCity("bandung", false);
  });
}

// === INIT ===
document.addEventListener("DOMContentLoaded", () => {
  const lastCity = sessionStorage.getItem(lastCityKey);
  if (lastCity) {
    searchCity(lastCity, false);
  } else {
    getWeatherByLocation();
  }
});
