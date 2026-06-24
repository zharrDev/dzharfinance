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

function setButtonLoading(button, loading, text = "Daftar") {
  if (!button) return;
  button.classList.toggle("is-loading", loading);
  button.textContent = loading ? "Memproses..." : text;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const button = document.getElementById("registerBtn");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      showToast("Data belum lengkap", "Email dan password harus diisi.", "warning");
      return;
    }

    if (password.length < 6) {
      showToast("Password terlalu pendek", "Minimal password 6 karakter ya.", "warning");
      return;
    }

    try {
      setButtonLoading(button, true, "Daftar");

      const response = await fetch(USERS_URL);
      const data = await response.json();
      const userExists = Object.values(data || {}).some(user => user.email === email);

      if (userExists) {
        showToast("Email sudah terdaftar", "Silakan login atau gunakan email lain.", "warning");
        return;
      }

      const newUser = {
        email,
        password,
        nomorHP: "",
        nomorDana: "",
        createdAt: new Date().toISOString()
      };

      await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });

      showToast("Registrasi berhasil", "Silakan login dengan akun barumu.", "success", 1400);
      setTimeout(() => {
        window.location.href = "login.html";
      }, 950);
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      showToast("Registrasi gagal", "Cek koneksi internet atau coba lagi nanti.", "danger");
    } finally {
      setButtonLoading(button, false, "Daftar");
    }
  });
});
