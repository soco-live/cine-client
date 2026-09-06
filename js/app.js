function initTheme() {
  const storedTheme = localStorage.getItem("tvphone-theme");
  if (storedTheme) {
    document.documentElement.setAttribute("data-theme", storedTheme);
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("tvphone-theme", next);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanMovieTitle(raw) {
  if (!raw) return "Movie Title";
  // Strip common download boilerplate like "| Download Hollywood Movie"
  let cleaned = raw.replace(/\s*\|\s*Download.*$/i, "").trim();
  // Strip HTML entities like &#8211; or &amp;
  const temp = document.createElement("div");
  temp.innerHTML = cleaned;
  return temp.textContent || temp.innerText || cleaned;
}

function getFallbackPromo() {
  return `
    <div class="promo-card">
      <div class="promo-badge" style="background:var(--c-primary);color:#fff">FEATURED CINEMA</div>
      <div class="promo-content text-center py-3">
        <span class="promo-meta text-xs font-bold text-[var(--c-primary)] mb-1 block"><i class="fa-solid fa-film"></i> Movies, Series & K-Dramas</span>
        <h3 class="text-base font-bold text-[var(--c-text)] mb-2">Cinema on Android TV & Phone</h3>
        <p class="text-xs text-[var(--c-text-secondary)] mb-3 leading-relaxed">Leanback remote D-pad simplicity, subtitle support, instant MKV playback, and zero intrusive ads.</p>
        <a href="#download" class="promo-btn inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[var(--c-primary)] text-white no-underline"><i class="fa-solid fa-cloud-arrow-down"></i> Download Nkiri TV</a>
      </div>
    </div>
  `;
}

async function loadLatestMovies() {
  const container = document.getElementById("dynamic-promo");
  if (!container) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const resp = await fetch("https://thenkiri.com/wp-json/wp/v2/posts?per_page=6", {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const posts = await resp.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = getFallbackPromo();
      return;
    }

    const cardsHtml = posts.map(p => {
      const title = cleanMovieTitle(p?.title?.rendered);
      const yoastImg = p?.yoast_head_json?.og_image?.[0]?.url;
      const poster = yoastImg || p?.jetpack_featured_media_url || "";

      return `
        <a href="#download" style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(2,132,199,0.06);border-radius:12px;border-left:3px solid var(--c-primary);text-decoration:none;color:inherit;transition:all 0.2s">
          <img src="${escapeHtml(poster)}" alt="${escapeHtml(title)}" style="width:40px;height:54px;object-fit:cover;border-radius:6px;flex-shrink:0;background:#1e293b" loading="lazy" onerror="this.style.display='none'">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
              <span style="font-size:0.62rem;font-weight:800;color:var(--c-primary);background:rgba(2,132,199,0.12);padding:1px 6px;border-radius:4px">CINEMA</span>
              <span style="font-size:0.6rem;font-weight:700;color:#10b981">HD</span>
            </div>
            <div style="font-weight:600;font-size:0.78rem;color:var(--c-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(title)}</div>
          </div>
        </a>
      `;
    }).join("");

    container.innerHTML = `
      <div class="promo-card">
        <div class="promo-badge" style="background:var(--c-primary);color:#fff">LATEST RELEASES</div>
        <div style="display:grid;grid-template-columns:1fr;gap:6px;margin-top:4px">
          ${cardsHtml}
        </div>
        <a href="#download" class="promo-btn" style="margin-top:12px;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:10px;border-radius:10px;background:var(--c-primary);color:#ffffff;font-weight:700;font-size:0.8rem;text-decoration:none">
          <i class="fa-solid fa-play"></i> Watch Latest Movies on TV & Phone
        </a>
      </div>
    `;
  } catch (err) {
    console.log("[Client] Latest movies fallback active:", err.message);
    container.innerHTML = getFallbackPromo();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadLatestMovies();
});
