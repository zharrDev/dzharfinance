let languageSelector = document.getElementById("languageSelector");
let pipik = document.getElementById("pipik");
let welcomeText = document.getElementById("welcomeText");
let subText = document.getElementById("subText");
let whyText = document.getElementById("whyText");
let contentText = document.getElementById("contentText");
let can = document.getElementById("can");
let aboutText = document.getElementById("aboutText");
let btnLink = document.getElementById("btnLink")
let heroSection = document.getElementById("heroSection");
let a = document.getElementById("a");
let b = document.getElementById("b");
let c = document.getElementById("c");
let d = document.getElementById("d");
let fitur = document.getElementById("fitur");
let e = document.getElementById("e");
let f = document.getElementById("f");
let g = document.getElementById("g");
let h = document.getElementById("h");
let choose = document.getElementById("choose");
let home = document.getElementById("home");
let fiturr = document.getElementById("fiturr");
let aboutt = document.getElementById("aboutt");
let contact = document.getElementById("contact");
let btnSignIn = document.getElementById("btnSignIn");

let index = 0;
 const backgrounds = [
   "url('assets/indexx.jpg')",
   "url('assets/a.png')",
   "url('assets/r.png')"
 ];
 
 function gantiBackground() {
   heroSection.style.backgroundImage = backgrounds[index];
   index = (index + 1) % backgrounds.length;
 }
 
 gantiBackground(); // Set awal
 setInterval(gantiBackground, 5000); // Ganti tiap 5 detik
 
// index.js
document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  
  if (isLoggedIn === "true") {
    // Tampilkan elemen yang disembunyikan untuk user login
    document.querySelectorAll(".login-hidden").forEach(el => {
      el.classList.remove("hidden");
    });
    
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
    logoutBtn.classList.remove("hidden");
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      location.reload(); // Atau redirect ke login.html
    });
  }
}
});

languageSelector.addEventListener("change", function () {
  let selectedLanguage = languageSelector.value;

  if (selectedLanguage === "English") {
    choose.textContent = "Choose your language";
    home.textContent = "Home";
    fiturr.textContent = "Feature";
    aboutt.textContent = "About";
    contact.textContent = "Contact";
    btnSignIn.textContent = "Sign-up";
    subText.textContent = "Smart way to manage your money, time, and news";
    whyText.textContent = "Why Choose DzharFinance?";
    contentText.textContent = "Empower your financial decisions with DzharFinance, the smart solution for managing your money, time, and staying updated with the latest news. Our innovative platform integrates accounting tools with real-time news updates and time management features, ensuring you have everything you need at your fingertips. Whether you're an individual or a business owner, our tailored services help you simplify your financial life and make informed decisions.";
    can.textContent = "About us";
    aboutText.textContent = "DzharFinance was created for you who want a more organized and efficient life. Here, you can record expenses, manage your schedule, and even see the latest weather and news updates — all in one simple web app with a cool look. It's perfect for students, university students, freelancers, or anyone who wants a more structured life. Let's start managing your life with DzharFinance!";
    btnLink.textContent = "Get Started Today";
    a.textContent = "Manage Finances";
    b.textContent = "Record your expenses and income for better control.";
    c.textContent = "Time Management";
    d.textContent = "Manage your daily schedule and routines with ease.";
    fitur.textContent = "Feature";
    e.textContent = "Weather Updates";
    f.textContent = "See daily weather forecasts directly from your dashboard.";
    g.textContent = "Latest News";
    h.textContent = "Get relevant, up-to-date news every day.";
  } else if (selectedLanguage === "Indonesia") {
    choose.textContent = "Pilih Bahasamu";
    home.textContent = "Rumah";
    fiturr.textContent = "Fitur";
    aboutt.textContent = "Tentang";
    contact.textContent = "Hubungi";
    btnSignIn.textContent = "Daftar";
    subText.textContent = "Cara cerdas mengatur uang, waktu, dan berita";
    whyText.textContent = "Mengapa Memilih DzharFinance?";
    contentText.textContent = "Berdayakan keputusan finansial Anda dengan DzharFinance, solusi cerdas untuk mengelola uang, waktu, dan tetap terbarui dengan berita terkini. Platform inovatif kami mengintegrasikan alat akuntansi dengan pembaruan berita real-time dan fitur manajemen waktu, memastikan Anda memiliki semua yang Anda butuhkan di ujung jari Anda. Baik Anda seorang individu maupun pemilik bisnis, layanan khusus kami membantu Anda menyederhanakan kehidupan finansial Anda dan membuat keputusan yang tepat.";
    can.textContent = "Tentang kami";
    aboutText.textContent = "DzharFinance dibuat buat kamu yang pengen hidup lebih teratur dan efisien. Di sini kamu bisa nyatat pengeluaran, atur jadwal, sampe liat update cuaca dan berita terbaru — semuanya dalam satu web simpel yang tampilannya keren. Cocok buat pelajar, mahasiswa, freelancer, atau siapa pun yang pengen hidupnya lebih tertata. Yuk mulai kelola hidupmu bareng DzharFinance!";
    btnLink.textContent = "Mulai Sekarang";
    a.textContent = "Kelola Keuangan";
    b.textContent = "Catat pengeluaran dan pemasukan kamu biar lebih terkontrol.";
    c.textContent = "Manajemen Waktu";
    d.textContent = "Atur jadwal dan rutinitas harian dengan mudah.";
    fitur.textContent = "Fitur";
    e.textContent = "Update Cuaca";
    f.textContent = "Lihat prakiraan cuaca harian langsung dari dashboard kamu."
    g.textContent = "Berita Terkini";
    h.textContent = "Dapatkan berita terbaru yang relevan setiap hari.";

  }
});

let burger = document.getElementById('burger');
let navLinks = document.getElementById('navLinks');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

const loadingScreen = document.getElementById("loadingScreen");
const loadingVideo = document.getElementById("loadingVideo");

// Pilih semua tombol (Get Started + Sign-in)
document.querySelectorAll(".btn-link, .sign-in").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();

    // Tampilkan loading screen
    loadingScreen.classList.remove("hidden");

    // Pastikan video diulang dari awal
    loadingVideo.currentTime = 0;
    loadingVideo.play();

    // Tentukan tujuan berdasarkan tombol yang diklik
    const targetUrl = btn.classList.contains("sign-in")
      ? "html/register.html"   // jika tombol Sign-In → ke registrasi
      : "html/login.html";     // jika tombol Get Started → ke login

    // Setelah video selesai → pindah halaman yang sesuai
    const goTarget = () => { window.location.href = targetUrl; };
    loadingVideo.onended = goTarget;
    loadingVideo.onerror = goTarget;
    setTimeout(goTarget, 1800);
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (isLoggedIn) {
    // sembunyikan tombol Sign-In & Get Started
    document.getElementById("btnSignIn").style.display = "none";
    document.getElementById("btnLink").style.display = "none";
  } else {
    // kalau belum login, tombol tetap ada
    document.getElementById("btnSignIn").style.display = "block";
    document.getElementById("btnLink").style.display = "block";
  }
});


