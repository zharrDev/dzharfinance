const USERS_URL = "https://dzhar-schedule-api-default-rtdb.firebaseio.com/users.json";

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

function setButtonLoading(button, loading, text = "Login") {
  if (!button) return;
  button.classList.toggle("is-loading", loading);
  button.textContent = loading ? "Memproses..." : text;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const button = document.getElementById("loginBtn");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showToast("Data belum lengkap", "Email dan password harus diisi.", "warning");
      return;
    }

    try {
      setButtonLoading(button, true, "Login");

      const response = await fetch(USERS_URL);
      const data = await response.json();

      let userId = "";
      let userData = null;

      for (const key in (data || {})) {
        const user = data[key];
        if (user.email === email && user.password === password) {
          userId = key;
          userData = user;
          break;
        }
      }

      if (!userId) {
        showToast("Login gagal", "Email atau password salah.", "danger");
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", userData.email);
      localStorage.setItem("userId", userId);
      sessionStorage.setItem("userId", userId);

      showToast("Login berhasil", "Mengalihkan ke homepage...", "success", 1200);
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 850);
    } catch (error) {
      console.error("Gagal mengambil data dari Firebase:", error);
      showToast("Terjadi kesalahan", "Cek koneksi internet atau coba lagi nanti.", "danger");
    } finally {
      setButtonLoading(button, false, "Login");
    }
  });
});
