const apiKey = "pub_b9daeb2b5ad44ec3bc3d8366b23f1056";
const searchInput = document.getElementById("search-input");
const newsContainer = document.getElementById("news-container");
const loadingSpinner = document.getElementById("loading-spinner");
const newsStatus = document.getElementById("newsStatus");
const newsSearchForm = document.getElementById("newsSearchForm");

let nextPage = null;
let isLoading = false;
let currentQuery = "";
let debounceTimer = null;

const placeholderImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#078cd4"/>
      <stop offset="1" stop-color="#05c227"/>
    </linearGradient>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <circle cx="520" cy="70" r="90" fill="rgba(255,255,255,.15)"/>
  <rect x="70" y="95" width="500" height="38" rx="19" fill="rgba(255,255,255,.7)"/>
  <rect x="70" y="155" width="420" height="26" rx="13" fill="rgba(255,255,255,.45)"/>
  <rect x="70" y="202" width="470" height="26" rx="13" fill="rgba(255,255,255,.38)"/>
  <text x="70" y="285" font-family="Arial" font-size="34" font-weight="700" fill="white">DzharFinance News</text>
</svg>
`)}`;

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

function setStatus(message = "") {
  newsStatus.textContent = message;
}

async function fetchNews(query = "", page = null) {
  if (isLoading) return;
  isLoading = true;
  showLoading(true);

  if (!page) setStatus(query ? `Mencari berita: “${query}”...` : "Memuat berita terbaru...");

  let url = `https://newsdata.io/api/1/news?apikey=${apiKey}&country=id&language=id`;
  if (query) url += `&q=${encodeURIComponent(query)}`;
  if (page) url += `&page=${page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal fetch data berita");
    const data = await res.json();

    if (data.status === "error") {
      throw new Error(data.results?.message || data.message || "API error");
    }

    nextPage = data.nextPage || null;
    const articles = Array.isArray(data.results) ? data.results : [];
    renderNews(articles, page !== null);

    if (articles.length === 0 && !page) {
      setStatus("Berita tidak ditemukan. Coba kata kunci lain.");
    } else {
      setStatus(nextPage ? "Scroll ke bawah untuk memuat berita lainnya." : "Semua berita sudah tampil.");
    }
  } catch (error) {
    console.error(error);
    if (!page) clearNews();
    setStatus("Gagal memuat berita. Cek koneksi internet atau coba lagi nanti.");
    showToast("Berita gagal dimuat", "Cek koneksi internet atau coba lagi nanti.", "danger");
  } finally {
    showLoading(false);
    isLoading = false;
  }
}

function clearNews() {
  while (newsContainer.firstChild) newsContainer.removeChild(newsContainer.firstChild);
}

function renderNews(articles, append = false) {
  if (!append) clearNews();

  articles.forEach(article => {
    const card = document.createElement("article");
    card.classList.add("news-card");

    const img = document.createElement("img");
    img.src = article.image_url || placeholderImage;
    img.alt = article.title || "News image";
    img.loading = "lazy";
    img.onerror = () => { img.src = placeholderImage; };

    const body = document.createElement("div");
    body.className = "news-card-body";

    const meta = document.createElement("span");
    meta.className = "news-meta";
    meta.textContent = article.source_id || "News";

    const title = document.createElement("h3");
    title.textContent = article.title || "Tanpa judul";

    const desc = document.createElement("p");
    let description = article.description || article.content || "Tidak ada deskripsi.";
    if (description.length > 135) description = description.substring(0, 135) + "...";
    desc.textContent = description;

    const link = document.createElement("a");
    link.href = article.link || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Baca Selengkapnya →";

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(link);

    card.appendChild(img);
    card.appendChild(body);
    newsContainer.appendChild(card);
  });
}

function showLoading(show) {
  loadingSpinner.style.display = show ? "block" : "none";
}

function runSearch() {
  currentQuery = searchInput.value.trim();
  nextPage = null;
  fetchNews(currentQuery);
}

newsSearchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 650);
});

window.addEventListener("scroll", () => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 260;
  if (nearBottom && nextPage && !isLoading) {
    fetchNews(currentQuery, nextPage);
  }
});

fetchNews();
