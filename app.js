// ============================================================
// Constants
// ============================================================

const ENGINES = {
  ddg: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    favicon: "https://icons.duckduckgo.com/ip3/duckduckgo.com.ico",
    color: "#de5833",
    letter: "D",
  },
  google: {
    name: "Google",
    url: "https://www.google.com/search?q=",
    favicon: "https://icons.duckduckgo.com/ip3/google.com.ico",
    color: "#4285f4",
    letter: "G",
  },
  bing: {
    name: "Bing",
    url: "https://www.bing.com/search?q=",
    favicon: "https://icons.duckduckgo.com/ip3/bing.com.ico",
    color: "#0078d7",
    letter: "B",
  },
  brave: {
    name: "Brave",
    url: "https://search.brave.com/search?q=",
    favicon: "https://icons.duckduckgo.com/ip3/search.brave.com.ico",
    color: "#fb542b",
    letter: "B",
  },
  ecosia: {
    name: "Ecosia",
    url: "https://www.ecosia.org/search?q=",
    favicon: "https://icons.duckduckgo.com/ip3/ecosia.org.ico",
    color: "#4a9b5e",
    letter: "E",
  },
  startpage: {
    name: "Startpage",
    url: "https://www.startpage.com/sp/search?q=",
    favicon: "https://icons.duckduckgo.com/ip3/startpage.com.ico",
    color: "#3c8dbc",
    letter: "S",
  },
};

// ============================================================
// uid
// ============================================================

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ============================================================
// Default State
// ============================================================

const DEFAULT_BOOKMARKS = [
  { id: uid(), name: "GitHub", url: "https://github.com" },
  { id: uid(), name: "YouTube", url: "https://youtube.com" },
  { id: uid(), name: "Reddit", url: "https://reddit.com" },
  { id: uid(), name: "Gmail", url: "https://mail.google.com" },
  { id: uid(), name: "Hacker News", url: "https://news.ycombinator.com" },
  { id: uid(), name: "Wikipedia", url: "https://wikipedia.org" },
];

const DEFAULT_SETTINGS = {
  theme: "dark",
  clockFormat: "24h",
  showSeconds: true,
  searchEngine: "ddg",
  searchNewTab: false,
  weatherEnabled: true,
  weatherUnit: "celsius",
  accentColor: "#818cf8",
  // Background
  backgroundType: "gradient", // 'gradient' | 'color' | 'image'
  backgroundColor: "#0b0b14", // used when backgroundType === 'color'
  backgroundImage: "", // URL
  backgroundBlur: 4, // px  (0-20)
  backgroundBrightness: 80, // %   (20-100)
  backgroundOverlay: 50, // %   (0-90)
  // Bookmark cards
  bookmarkStyle: "glass", // 'glass' | 'solid' | 'outline' | 'minimal'
  bookmarkSize: "default", // 'compact' | 'default' | 'large'
  bookmarkSolidColor: "#1c1c2e", // custom fill used when style === 'solid'
};

let state = {
  settings: { ...DEFAULT_SETTINGS },
  bookmarks: [],
  editingBookmarkId: null,
};

// HTML5 DnD — tracks which bookmark is currently being dragged
let dragSrcId = null;

// ============================================================
// State Persistence
// ============================================================

function loadState() {
  try {
    const raw = localStorage.getItem("startpage");
    if (raw) {
      const parsed = JSON.parse(raw);
      state.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
      if (parsed.bookmarks && parsed.bookmarks.length) {
        state.bookmarks = parsed.bookmarks;
      } else {
        state.bookmarks = DEFAULT_BOOKMARKS.map((b) => ({ ...b }));
      }
    } else {
      state.bookmarks = DEFAULT_BOOKMARKS.map((b) => ({ ...b }));
    }
  } catch (_) {
    state.settings = { ...DEFAULT_SETTINGS };
    state.bookmarks = DEFAULT_BOOKMARKS.map((b) => ({ ...b }));
  }
}

function saveState() {
  localStorage.setItem(
    "startpage",
    JSON.stringify({ settings: state.settings, bookmarks: state.bookmarks }),
  );
}

// ============================================================
// Utilities
// ============================================================

function getFaviconUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch (_) {
    return "";
  }
}

// Deterministic hue-based color from a string (fallback favicon circles).
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = ((hash % 360) + 360) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

function isUrl(str) {
  return (
    /^(https?:\/\/)/.test(str) ||
    (/\.[a-z]{2,}/.test(str) && !str.includes(" "))
  );
}

function normalizeUrl(str) {
  if (!str.startsWith("http")) return "https://" + str;
  return str;
}

// ============================================================
// Theme Module
// ============================================================

function initTheme() {
  document.documentElement.dataset.theme = state.settings.theme;
  applyAccentColor(state.settings.accentColor);
  applyBackground();
}

function applyAccentColor(hex) {
  // Guard against malformed / short hex strings.
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;

  document.documentElement.style.setProperty("--accent", hex);

  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.documentElement.style.setProperty("--accent-rgb", `${r},${g},${b}`);
  document.documentElement.style.setProperty(
    "--border-focus",
    `rgba(${r},${g},${b},0.45)`,
  );
}

function applyBackground() {
  const s = state.settings;
  const bgEl = document.getElementById("bg-image");
  const root = document.documentElement;

  // Reset all modes first — re-apply the active one below.
  if (bgEl) {
    bgEl.style.display = "none";
    bgEl.style.backgroundImage = "";
  }
  root.style.setProperty("--bg-overlay", "0");
  document.body.classList.remove("has-bg-image", "has-solid-color");

  if (s.backgroundType === "color" && s.backgroundColor) {
    // Solid fill — stamp the chosen colour as a CSS variable; a body class activates it.
    root.style.setProperty("--bg-override", s.backgroundColor);
    document.body.classList.add("has-solid-color");
  } else if (s.backgroundType === "image" && s.backgroundImage) {
    if (bgEl) {
      const safeUrl = s.backgroundImage.replace(/["']/g, "%22");
      bgEl.style.backgroundImage = `url("${safeUrl}")`;
      const blur = s.backgroundBlur ?? 4;
      const brightness = s.backgroundBrightness ?? 80;
      bgEl.style.filter = `blur(${blur}px) brightness(${brightness}%)`;
      bgEl.style.display = "block";
    }
    root.style.setProperty(
      "--bg-overlay",
      String((s.backgroundOverlay ?? 50) / 100),
    );
    document.body.classList.add("has-bg-image");
  }
  // else: 'gradient' — already cleaned up above, body::before shows the default gradient.
}

/**
 * Stamp data-bm-style / data-bm-size onto the grid so CSS variant
 * selectors pick them up without any class manipulation.
 */
function applyBookmarkStyle() {
  const grid = document.getElementById("bookmarks-grid");
  if (!grid) return;
  grid.dataset.bmStyle = state.settings.bookmarkStyle || "glass";
  grid.dataset.bmSize = state.settings.bookmarkSize || "default";
  // Expose the custom solid colour as a CSS variable directly on the grid so
  // the CSS rule can pick it up without needing JS to touch every card.
  if (
    (state.settings.bookmarkStyle || "glass") === "solid" &&
    state.settings.bookmarkSolidColor
  ) {
    grid.style.setProperty("--bm-solid-bg", state.settings.bookmarkSolidColor);
  } else {
    grid.style.removeProperty("--bm-solid-bg");
  }
}

function toggleTheme() {
  state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
  saveState();
  initTheme();
}

// ============================================================
// Clock Module
// ============================================================

function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const pad = (n) => String(n).padStart(2, "0");

  // ---- Greeting ----
  let greeting;
  if (hour >= 5 && hour <= 11) greeting = "Good morning";
  else if (hour >= 12 && hour <= 17) greeting = "Good afternoon";
  else if (hour >= 18 && hour <= 21) greeting = "Good evening";
  else greeting = "Good night";

  const greetingEl = document.getElementById("greeting");
  if (greetingEl) greetingEl.textContent = greeting;

  // ---- Clock ----
  let timeStr;
  if (state.settings.clockFormat === "12h") {
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    timeStr = state.settings.showSeconds
      ? `${h12}:${pad(min)}:${pad(sec)} ${ampm}`
      : `${h12}:${pad(min)} ${ampm}`;
  } else {
    timeStr = state.settings.showSeconds
      ? `${pad(hour)}:${pad(min)}:${pad(sec)}`
      : `${pad(hour)}:${pad(min)}`;
  }

  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = timeStr;

  // ---- Date ----
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dateEl = document.getElementById("date");
  if (dateEl) dateEl.textContent = dateStr;
}

// ============================================================
// Weather Module
// ============================================================

function initWeather() {
  const widget = document.getElementById("weather-widget");
  if (!widget) return;

  if (!state.settings.weatherEnabled) {
    widget.innerHTML = "";
    return;
  }

  if (!navigator.geolocation) {
    widget.innerHTML = "";
    return;
  }

  navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError);
}

async function onGeoSuccess(pos) {
  const lat = pos.coords.latitude;
  const lon = pos.coords.longitude;

  try {
    const [weatherRes, geocodeRes] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code` +
          `&temperature_unit=celsius&wind_speed_unit=kmh`,
      ),
      fetch(
        `https://nominatim.openstreetmap.org/reverse` +
          `?lat=${lat}&lon=${lon}&format=json`,
      ),
    ]);

    if (!weatherRes.ok || !geocodeRes.ok) throw new Error("Bad response");

    const weather = await weatherRes.json();
    const geocode = await geocodeRes.json();

    const code = weather.current.weather_code;
    let temp = weather.current.temperature_2m;

    const addr = geocode.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || "";

    let unit = "C";
    if (state.settings.weatherUnit === "fahrenheit") {
      temp = Math.round((temp * 9) / 5 + 32);
      unit = "F";
    } else {
      temp = Math.round(temp);
    }

    const emoji = getWeatherEmoji(code);
    const widget = document.getElementById("weather-widget");
    if (widget) {
      widget.innerHTML =
        `<span class="weather-emoji">${emoji}</span>` +
        `<span>${temp}°${unit}${city ? " · " + city : ""}</span>`;
    }
  } catch (_) {
    onGeoError();
  }
}

function onGeoError() {
  const widget = document.getElementById("weather-widget");
  if (widget) widget.innerHTML = "";
}

function getWeatherEmoji(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

// ============================================================
// Search Module
// ============================================================

function initSearch() {
  renderEngineIcon();
  renderEngineDropdown();

  const engineBtn = document.getElementById("engine-btn");
  const engineDropdown = document.getElementById("engine-dropdown");
  const searchInput = document.getElementById("search-input");
  const searchSubmit = document.getElementById("search-submit");

  // Toggle dropdown
  if (engineBtn) {
    engineBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = engineDropdown.classList.toggle("hidden");
      engineBtn.setAttribute("aria-expanded", String(!isHidden));
      const chevron = engineBtn.querySelector(".chevron");
      if (chevron) chevron.classList.toggle("open", !isHidden);
    });
  }

  // Close dropdown on outside click
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest("#engine-btn") &&
      !e.target.closest("#engine-dropdown")
    ) {
      closeEngineDropdown();
    }
  });

  // Submit
  if (searchSubmit) {
    searchSubmit.addEventListener("click", submitSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitSearch();
    });
  }
}

function closeEngineDropdown() {
  const engineDropdown = document.getElementById("engine-dropdown");
  const engineBtn = document.getElementById("engine-btn");
  if (!engineDropdown) return;

  engineDropdown.classList.add("hidden");
  if (engineBtn) {
    engineBtn.setAttribute("aria-expanded", "false");
    const chevron = engineBtn.querySelector(".chevron");
    if (chevron) chevron.classList.remove("open");
  }
}

function renderEngineIcon() {
  const engine = ENGINES[state.settings.searchEngine];
  const iconEl = document.getElementById("engine-icon");
  if (!iconEl || !engine) return;

  // Reset to transparent — the image will fill it
  iconEl.innerHTML = "";
  iconEl.style.background = "transparent";
  iconEl.removeAttribute("data-letter");

  const img = document.createElement("img");
  img.src = engine.favicon;
  img.alt = engine.name;
  img.className = "engine-favicon";
  img.onerror = () => {
    // Favicon unavailable — fall back to a coloured circle with the initial
    iconEl.innerHTML = "";
    iconEl.style.background = engine.color;
    iconEl.textContent = engine.letter;
  };
  iconEl.appendChild(img);
}

function renderEngineDropdown() {
  const dropdown = document.getElementById("engine-dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  Object.entries(ENGINES).forEach(([key, engine]) => {
    const btn = document.createElement("button");
    btn.className = "engine-option";
    btn.dataset.engine = key;
    if (key === state.settings.searchEngine) btn.classList.add("active");

    // Circle container — shows favicon, falls back to coloured initial
    const circle = document.createElement("span");
    circle.className = "engine-option-circle";

    const optImg = document.createElement("img");
    optImg.src = engine.favicon;
    optImg.alt = "";
    optImg.className = "engine-favicon";
    optImg.onerror = () => {
      circle.removeChild(optImg);
      circle.style.background = engine.color;
      circle.textContent = engine.letter;
    };
    circle.appendChild(optImg);

    const nameSpan = document.createElement("span");
    nameSpan.className = "engine-option-name";
    nameSpan.textContent = engine.name;

    btn.appendChild(circle);
    btn.appendChild(nameSpan);

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.settings.searchEngine = key;
      saveState();
      renderEngineIcon();
      renderEngineDropdown();
      closeEngineDropdown();
    });

    dropdown.appendChild(btn);
  });
}

function submitSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  const query = searchInput.value.trim();
  if (!query) return;

  const url = isUrl(query)
    ? normalizeUrl(query)
    : ENGINES[state.settings.searchEngine].url + encodeURIComponent(query);

  if (state.settings.searchNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }

  searchInput.value = "";
}

// ============================================================
// Bookmarks Module
// ============================================================

/** Build a letter-circle fallback element for a bookmark. */
function makeFaviconFallback(name) {
  const div = document.createElement("div");
  div.className = "bookmark-favicon-fallback";
  div.style.background = stringToColor(name);
  div.textContent = (name || "?").charAt(0).toUpperCase();
  return div;
}

/**
 * Wire HTML5 Drag-and-Drop onto a single bookmark card.
 *
 * Why NOT pointer events: anchor elements trigger a native "link drag"
 * which fires dragstart → the browser MUST fire pointercancel immediately
 * after (per the Pointer Events spec), killing the capture before our
 * pointermove threshold is ever reached.  The native DnD API has no such
 * conflict and works reliably on all desktop browsers.
 */
function setupBookmarkDrag(card, bookmarkId) {
  card.setAttribute("draggable", "true");

  // ── dragstart: mark the source, let the browser build its ghost image ──
  card.addEventListener("dragstart", (e) => {
    dragSrcId = bookmarkId;
    e.dataTransfer.effectAllowed = "move";
    // Some browsers require at least one setData call for DnD to activate.
    e.dataTransfer.setData("text/plain", bookmarkId);
    // Use rAF so the ghost is snapped before we fade the original card.
    requestAnimationFrame(() => card.classList.add("is-dragging"));
  });

  // ── dragover: live-reorder while the user is hovering ──
  card.addEventListener("dragover", (e) => {
    e.preventDefault(); // required: marks this element as a valid drop target
    if (!dragSrcId || dragSrcId === bookmarkId) return;

    const grid = card.closest(".bookmarks-grid");
    if (!grid) return;
    const srcEl = grid.querySelector(`[data-bookmark-id="${dragSrcId}"]`);
    if (!srcEl) return;

    const { left, width } = card.getBoundingClientRect();
    if (e.clientX < left + width / 2) {
      grid.insertBefore(srcEl, card);
    } else {
      // insertBefore(el, null) appends to end — correct for the last slot
      grid.insertBefore(srcEl, card.nextSibling);
    }
  });

  // ── dragend: always fires on the *source* card; persist the new order ──
  card.addEventListener("dragend", () => {
    card.classList.remove("is-dragging");
    dragSrcId = null;

    const grid = document.getElementById("bookmarks-grid");
    if (!grid) return;

    const newOrder = [];
    grid.querySelectorAll("[data-bookmark-id]").forEach((el) => {
      const bm = state.bookmarks.find((b) => b.id === el.dataset.bookmarkId);
      if (bm) newOrder.push(bm);
    });

    if (newOrder.length === state.bookmarks.length) {
      state.bookmarks = newOrder;
      saveState();
    }
    renderBookmarks();
  });
}

function initBookmarks() {
  renderBookmarks();

  // Live preview wiring for the bookmark modal inputs.
  const bmName = document.getElementById("bm-name");
  const bmUrl = document.getElementById("bm-url");

  if (bmUrl) {
    bmUrl.addEventListener("input", () => {
      const faviconEl = document.getElementById("bm-favicon");
      const raw = bmUrl.value.trim();
      if (faviconEl) {
        faviconEl.src = raw ? getFaviconUrl(normalizeUrl(raw)) : "";
      }
    });
  }

  if (bmName) {
    bmName.addEventListener("input", () => {
      const previewName = document.getElementById("bm-preview-name");
      if (previewName) {
        previewName.textContent = bmName.value.trim() || "Bookmark preview";
      }
    });
  }
}

function renderBookmarks() {
  const grid = document.getElementById("bookmarks-grid");
  if (!grid) return;
  grid.innerHTML = "";

  state.bookmarks.forEach((bookmark) => {
    const card = document.createElement("a");
    card.className = "bookmark-card";
    card.href = bookmark.url;
    card.setAttribute("role", "listitem");
    const openNewTab = bookmark.openNewTab !== false; // default true for existing bookmarks
    card.setAttribute("target", openNewTab ? "_blank" : "_self");
    if (openNewTab) card.setAttribute("rel", "noopener noreferrer");
    // Used by the drag system to identify this card in the DOM.
    card.dataset.bookmarkId = bookmark.id;

    // ---- Icon / Favicon ----
    const faviconWrap = document.createElement("div");
    faviconWrap.className = "bookmark-favicon-container";

    const customIcon = (bookmark.icon || "").trim();

    if (customIcon && /^https?:\/\//i.test(customIcon)) {
      // Custom image URL
      const img = document.createElement("img");
      img.className = "bookmark-favicon";
      img.src = customIcon;
      img.alt = "";
      img.onerror = () => img.replaceWith(makeFaviconFallback(bookmark.name));
      faviconWrap.appendChild(img);
    } else if (customIcon) {
      // Emoji or short text
      const span = document.createElement("span");
      span.className = "bookmark-emoji-icon";
      span.textContent = customIcon;
      faviconWrap.appendChild(span);
    } else {
      // Auto-favicon from the bookmark URL
      const img = document.createElement("img");
      img.className = "bookmark-favicon";
      img.src = getFaviconUrl(bookmark.url);
      img.alt = "";
      const fallback = makeFaviconFallback(bookmark.name);
      fallback.style.display = "none";
      img.onerror = () => {
        img.style.display = "none";
        fallback.style.display = "flex";
      };
      faviconWrap.appendChild(img);
      faviconWrap.appendChild(fallback);
    }

    // ---- Name ----
    const nameSpan = document.createElement("span");
    nameSpan.className = "bookmark-name";
    nameSpan.textContent = bookmark.name;

    // ---- Edit button ----
    const editBtn = document.createElement("button");
    editBtn.className = "bookmark-edit-btn";
    editBtn.setAttribute("aria-label", `Edit ${bookmark.name}`);
    editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"
           viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>`;
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditModal(bookmark.id);
    });

    card.appendChild(faviconWrap);
    card.appendChild(nameSpan);
    card.appendChild(editBtn);

    setupBookmarkDrag(card, bookmark.id);
    grid.appendChild(card);
  });

  // Apply card-style / size data attributes so CSS selectors take effect.
  applyBookmarkStyle();
}

function openAddModal() {
  state.editingBookmarkId = null;

  const bmName = document.getElementById("bm-name");
  const bmUrl = document.getElementById("bm-url");
  const bmTitle = document.getElementById("bookmark-title");
  const btnDelete = document.getElementById("btn-delete-bookmark");
  const bmFavicon = document.getElementById("bm-favicon");
  const previewName = document.getElementById("bm-preview-name");
  const backdrop = document.getElementById("bookmark-backdrop");

  const bmIcon = document.getElementById("bm-icon");
  const bmNewtab = document.getElementById("bm-newtab");

  if (bmName) bmName.value = "";
  if (bmUrl) bmUrl.value = "";
  if (bmIcon) bmIcon.value = "";
  if (bmNewtab) bmNewtab.checked = true; // default: open in new tab
  if (bmTitle) bmTitle.textContent = "Add Bookmark";
  if (btnDelete) btnDelete.classList.add("hidden");
  if (bmFavicon) bmFavicon.src = "";
  if (previewName) previewName.textContent = "Bookmark preview";
  if (backdrop) backdrop.classList.remove("hidden");

  // Auto-focus name input for convenience.
  if (bmName) setTimeout(() => bmName.focus(), 50);
}

function openEditModal(id) {
  const bookmark = state.bookmarks.find((b) => b.id === id);
  if (!bookmark) return;

  state.editingBookmarkId = id;

  const bmName = document.getElementById("bm-name");
  const bmUrl = document.getElementById("bm-url");
  const bmTitle = document.getElementById("bookmark-title");
  const btnDelete = document.getElementById("btn-delete-bookmark");
  const bmFavicon = document.getElementById("bm-favicon");
  const previewName = document.getElementById("bm-preview-name");
  const backdrop = document.getElementById("bookmark-backdrop");

  const bmIcon = document.getElementById("bm-icon");
  const bmNewtab = document.getElementById("bm-newtab");

  if (bmName) bmName.value = bookmark.name;
  if (bmUrl) bmUrl.value = bookmark.url;
  if (bmIcon) bmIcon.value = bookmark.icon || "";
  if (bmNewtab) bmNewtab.checked = bookmark.openNewTab !== false;
  if (bmTitle) bmTitle.textContent = "Edit Bookmark";
  if (btnDelete) btnDelete.classList.remove("hidden");

  // Update preview
  if (bmFavicon) bmFavicon.src = getFaviconUrl(bookmark.url);
  if (previewName)
    previewName.textContent = bookmark.name || "Bookmark preview";

  if (backdrop) backdrop.classList.remove("hidden");
  if (bmName) setTimeout(() => bmName.focus(), 50);
}

function closeBookmarkModal() {
  const backdrop = document.getElementById("bookmark-backdrop");
  if (backdrop) backdrop.classList.add("hidden");
  state.editingBookmarkId = null;
}

function saveBookmark() {
  const bmName = document.getElementById("bm-name");
  const bmUrl = document.getElementById("bm-url");
  const bmIcon = document.getElementById("bm-icon");
  const bmNewtab = document.getElementById("bm-newtab");
  if (!bmName || !bmUrl) return;

  const name = bmName.value.trim();
  const rawUrl = bmUrl.value.trim();
  const icon = bmIcon ? bmIcon.value.trim() : "";
  const openNewTab = bmNewtab ? bmNewtab.checked : true;
  let valid = true;

  if (!name) {
    shakeElement(bmName);
    valid = false;
  }
  if (!rawUrl) {
    shakeElement(bmUrl);
    valid = false;
  }
  if (!valid) return;

  const url = normalizeUrl(rawUrl);

  if (state.editingBookmarkId) {
    const bookmark = state.bookmarks.find(
      (b) => b.id === state.editingBookmarkId,
    );
    if (bookmark) {
      bookmark.name = name;
      bookmark.url = url;
      bookmark.icon = icon;
      bookmark.openNewTab = openNewTab;
    }
  } else {
    state.bookmarks.push({ id: uid(), name, url, icon, openNewTab });
  }

  saveState();
  renderBookmarks();
  closeBookmarkModal();
}

function deleteBookmark() {
  if (!state.editingBookmarkId) return;
  state.bookmarks = state.bookmarks.filter(
    (b) => b.id !== state.editingBookmarkId,
  );
  saveState();
  renderBookmarks();
  closeBookmarkModal();
}

function shakeElement(el) {
  el.classList.remove("shake"); // reset in case it's already shaking
  void el.offsetWidth; // force reflow so the animation restarts
  el.classList.add("shake");
  setTimeout(() => el.classList.remove("shake"), 500);
}

// ============================================================
// Settings Module
// ============================================================

function initSettings() {
  syncSettingsUI();

  // Open
  const btnSettings = document.getElementById("btn-settings");
  if (btnSettings) {
    btnSettings.addEventListener("click", () => {
      syncSettingsUI();
      const backdrop = document.getElementById("settings-backdrop");
      if (backdrop) backdrop.classList.remove("hidden");
    });
  }

  // Close — button
  const btnClose = document.getElementById("btn-close-settings");
  if (btnClose) btnClose.addEventListener("click", closeSettings);

  // Close — backdrop click-outside
  const settingsBackdrop = document.getElementById("settings-backdrop");
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", (e) => {
      if (e.target === settingsBackdrop) closeSettings();
    });
  }

  // ---- Clock settings ----
  // #setting-24h: checked → 24h, unchecked → 12h
  const setting24h = document.getElementById("setting-24h");
  if (setting24h) {
    setting24h.addEventListener("change", () => {
      state.settings.clockFormat = setting24h.checked ? "24h" : "12h";
      saveState();
      updateClock();
    });
  }

  const settingSeconds = document.getElementById("setting-seconds");
  if (settingSeconds) {
    settingSeconds.addEventListener("change", () => {
      state.settings.showSeconds = settingSeconds.checked;
      saveState();
      updateClock();
    });
  }

  // ---- Search settings ----
  const settingNewtab = document.getElementById("setting-newtab");
  if (settingNewtab) {
    settingNewtab.addEventListener("change", () => {
      state.settings.searchNewTab = settingNewtab.checked;
      saveState();
    });
  }

  // ---- Weather settings ----
  const settingWeather = document.getElementById("setting-weather");
  if (settingWeather) {
    settingWeather.addEventListener("change", () => {
      state.settings.weatherEnabled = settingWeather.checked;
      saveState();
      initWeather();
    });
  }

  // #setting-fahrenheit: checked → fahrenheit, unchecked → celsius
  const settingFahrenheit = document.getElementById("setting-fahrenheit");
  if (settingFahrenheit) {
    settingFahrenheit.addEventListener("change", () => {
      state.settings.weatherUnit = settingFahrenheit.checked
        ? "fahrenheit"
        : "celsius";
      saveState();
      initWeather();
    });
  }

  // ---- Accent color ----
  const settingAccent = document.getElementById("setting-accent");
  if (settingAccent) {
    settingAccent.addEventListener("input", () => {
      const hex = settingAccent.value;
      state.settings.accentColor = hex;
      applyAccentColor(hex);
      saveState();
      syncAccentDots(hex);
    });
  }

  // Accent preset dots
  document.querySelectorAll(".accent-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.color;
      if (!color) return;
      state.settings.accentColor = color;
      applyAccentColor(color);
      saveState();
      if (settingAccent) settingAccent.value = color;
      syncAccentDots(color);
    });
  });

  // ---- Background settings ----

  // Type toggle (Gradient / Image)
  document.querySelectorAll(".bg-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.settings.backgroundType = btn.dataset.type;
      saveState();
      applyBackground();
      syncSettingsUI();
    });
  });

  // Solid color picker
  const bgSolidColorInput = document.getElementById("bg-solid-color");
  if (bgSolidColorInput) {
    bgSolidColorInput.addEventListener("input", () => {
      state.settings.backgroundColor = bgSolidColorInput.value;
      saveState();
      applyBackground();
    });
  }

  // Image URL  — typing a URL clears any loaded-file indicator
  const bgUrlInput = document.getElementById("bg-url");
  if (bgUrlInput) {
    bgUrlInput.addEventListener("input", () => {
      state.settings.backgroundImage = bgUrlInput.value.trim();
      const bgFileNameEl = document.getElementById("bg-file-name");
      if (bgFileNameEl) bgFileNameEl.textContent = "";
      saveState();
      applyBackground();
    });
  }

  // Local file upload — converts to data URL, stores in backgroundImage
  const bgFileInput = document.getElementById("bg-file-input");
  if (bgFileInput) {
    bgFileInput.addEventListener("change", () => {
      const file = bgFileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        state.settings.backgroundImage = evt.target.result;
        // Show the filename in the label
        const bgFileNameEl = document.getElementById("bg-file-name");
        if (bgFileNameEl) bgFileNameEl.textContent = file.name;
        // Clear the URL field — file takes precedence
        if (bgUrlInput) bgUrlInput.value = "";
        applyBackground();
        // Persist — may fail if the image is very large
        try {
          saveState();
          const errEl = document.getElementById("bg-file-error");
          if (errEl) errEl.classList.add("hidden");
        } catch (_) {
          const errEl = document.getElementById("bg-file-error");
          if (errEl) {
            errEl.textContent =
              "File too large to save — will reset on reload.";
            errEl.classList.remove("hidden");
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Blur slider
  const bgBlurInput = document.getElementById("bg-blur");
  const bgBlurVal = document.getElementById("bg-blur-val");
  if (bgBlurInput) {
    bgBlurInput.addEventListener("input", () => {
      state.settings.backgroundBlur = Number(bgBlurInput.value);
      if (bgBlurVal) bgBlurVal.textContent = `${bgBlurInput.value}px`;
      saveState();
      applyBackground();
    });
  }

  // Brightness slider
  const bgBrightnessInput = document.getElementById("bg-brightness");
  const bgBrightnessVal = document.getElementById("bg-brightness-val");
  if (bgBrightnessInput) {
    bgBrightnessInput.addEventListener("input", () => {
      state.settings.backgroundBrightness = Number(bgBrightnessInput.value);
      if (bgBrightnessVal)
        bgBrightnessVal.textContent = `${bgBrightnessInput.value}%`;
      saveState();
      applyBackground();
    });
  }

  // Overlay slider
  const bgOverlayInput = document.getElementById("bg-overlay");
  const bgOverlayVal = document.getElementById("bg-overlay-val");
  if (bgOverlayInput) {
    bgOverlayInput.addEventListener("input", () => {
      state.settings.backgroundOverlay = Number(bgOverlayInput.value);
      if (bgOverlayVal) bgOverlayVal.textContent = `${bgOverlayInput.value}%`;
      saveState();
      applyBackground();
    });
  }

  // ---- Bookmark card style ----
  document.querySelectorAll(".bm-style-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.settings.bookmarkStyle = btn.dataset.style;
      saveState();
      applyBookmarkStyle();
      syncBmStyleUI();
    });
  });

  // Solid card colour picker
  const bmSolidColorInput = document.getElementById("bm-solid-color");
  if (bmSolidColorInput) {
    bmSolidColorInput.addEventListener("input", () => {
      state.settings.bookmarkSolidColor = bmSolidColorInput.value;
      saveState();
      applyBookmarkStyle();
    });
  }

  // ---- Bookmark card size ----
  document.querySelectorAll(".bm-size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.settings.bookmarkSize = btn.dataset.size;
      saveState();
      applyBookmarkStyle();
      syncBmStyleUI();
    });
  });
}

function syncSettingsUI() {
  const s = state.settings;

  const setting24h = document.getElementById("setting-24h");
  if (setting24h) setting24h.checked = s.clockFormat === "24h";

  const settingSeconds = document.getElementById("setting-seconds");
  if (settingSeconds) settingSeconds.checked = s.showSeconds;

  const settingNewtab = document.getElementById("setting-newtab");
  if (settingNewtab) settingNewtab.checked = s.searchNewTab;

  const settingWeather = document.getElementById("setting-weather");
  if (settingWeather) settingWeather.checked = s.weatherEnabled;

  const settingFahrenheit = document.getElementById("setting-fahrenheit");
  if (settingFahrenheit)
    settingFahrenheit.checked = s.weatherUnit === "fahrenheit";

  const settingAccent = document.getElementById("setting-accent");
  if (settingAccent) settingAccent.value = s.accentColor;

  syncAccentDots(s.accentColor);

  // Background
  const bgType = s.backgroundType || "gradient";

  const bgGradientBtn = document.getElementById("bg-type-gradient");
  const bgColorBtn = document.getElementById("bg-type-color");
  const bgImageBtn = document.getElementById("bg-type-image");
  if (bgGradientBtn)
    bgGradientBtn.classList.toggle("active", bgType === "gradient");
  if (bgColorBtn) bgColorBtn.classList.toggle("active", bgType === "color");
  if (bgImageBtn) bgImageBtn.classList.toggle("active", bgType === "image");

  const bgColorOptions = document.getElementById("bg-color-options");
  const bgImageOptions = document.getElementById("bg-image-options");
  if (bgColorOptions)
    bgColorOptions.classList.toggle("hidden", bgType !== "color");
  if (bgImageOptions)
    bgImageOptions.classList.toggle("hidden", bgType !== "image");

  const bgSolidColorEl = document.getElementById("bg-solid-color");
  if (bgSolidColorEl) bgSolidColorEl.value = s.backgroundColor || "#0b0b14";

  // When the saved image is a data URL (from a file), don't pollute the
  // URL text field with raw base64 — just show the filename indicator.
  const bgImg = s.backgroundImage || "";
  const bgUrlEl = document.getElementById("bg-url");
  const bgFileNameEl = document.getElementById("bg-file-name");
  if (bgImg.startsWith("data:")) {
    if (bgUrlEl) bgUrlEl.value = "";
    if (bgFileNameEl) bgFileNameEl.textContent = "Local file";
  } else {
    if (bgUrlEl) bgUrlEl.value = bgImg;
    if (bgFileNameEl) bgFileNameEl.textContent = "";
  }

  const bgBlurEl = document.getElementById("bg-blur");
  const bgBlurV = document.getElementById("bg-blur-val");
  const blurVal = s.backgroundBlur ?? 4;
  if (bgBlurEl) bgBlurEl.value = blurVal;
  if (bgBlurV) bgBlurV.textContent = `${blurVal}px`;

  const bgBrightEl = document.getElementById("bg-brightness");
  const bgBrightV = document.getElementById("bg-brightness-val");
  const brightVal = s.backgroundBrightness ?? 80;
  if (bgBrightEl) bgBrightEl.value = brightVal;
  if (bgBrightV) bgBrightV.textContent = `${brightVal}%`;

  const bgOverlayEl = document.getElementById("bg-overlay");
  const bgOverlayV = document.getElementById("bg-overlay-val");
  const overlayVal = s.backgroundOverlay ?? 50;
  if (bgOverlayEl) bgOverlayEl.value = overlayVal;
  if (bgOverlayV) bgOverlayV.textContent = `${overlayVal}%`;

  syncBmStyleUI();
}

/** Sync bookmark style/size pickers and the conditional solid-colour row. */
function syncBmStyleUI() {
  const style = state.settings.bookmarkStyle || "glass";
  const size = state.settings.bookmarkSize || "default";

  document.querySelectorAll(".bm-style-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.style === style);
  });
  document.querySelectorAll(".bm-size-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.size === size);
  });

  // Show the colour picker only when Solid is the active style
  const solidColorRow = document.getElementById("bm-solid-color-row");
  if (solidColorRow)
    solidColorRow.classList.toggle("hidden", style !== "solid");

  const solidColorInput = document.getElementById("bm-solid-color");
  if (solidColorInput)
    solidColorInput.value = state.settings.bookmarkSolidColor || "#1c1c2e";
}

function syncAccentDots(activeColor) {
  document.querySelectorAll(".accent-dot").forEach((dot) => {
    dot.classList.toggle("active", dot.dataset.color === activeColor);
  });
}

function closeSettings() {
  const backdrop = document.getElementById("settings-backdrop");
  if (backdrop) backdrop.classList.add("hidden");
}

// ============================================================
// Keyboard Shortcuts
// ============================================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    const tag = active ? active.tagName.toLowerCase() : "";
    const inInput =
      tag === "input" ||
      tag === "textarea" ||
      (active && active.isContentEditable);

    // '/' → focus search bar (unless already editing text)
    if (e.key === "/" && !inInput) {
      e.preventDefault();
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.focus();
      return;
    }

    // Escape → close the topmost open UI element
    if (e.key === "Escape") {
      // 1. Engine dropdown
      const engineDropdown = document.getElementById("engine-dropdown");
      if (engineDropdown && !engineDropdown.classList.contains("hidden")) {
        closeEngineDropdown();
        return;
      }

      // 2. Bookmark modal
      const bookmarkBackdrop = document.getElementById("bookmark-backdrop");
      if (bookmarkBackdrop && !bookmarkBackdrop.classList.contains("hidden")) {
        closeBookmarkModal();
        return;
      }

      // 3. Settings modal
      const settingsBackdrop = document.getElementById("settings-backdrop");
      if (settingsBackdrop && !settingsBackdrop.classList.contains("hidden")) {
        closeSettings();
        return;
      }
    }
  });
}

// ============================================================
// Initialization
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initTheme();
  initClock();
  initWeather();
  initSearch();
  initBookmarks();
  initSettings();
  setupKeyboardShortcuts();

  // ---- Theme toggle button ----
  const btnTheme = document.getElementById("btn-theme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);

  // ---- Bookmark modal footer buttons ----
  const btnSave = document.getElementById("btn-save-bookmark");
  if (btnSave) btnSave.addEventListener("click", saveBookmark);

  const btnCancel = document.getElementById("btn-cancel-bookmark");
  if (btnCancel) btnCancel.addEventListener("click", closeBookmarkModal);

  const btnClose = document.getElementById("btn-close-bookmark");
  if (btnClose) btnClose.addEventListener("click", closeBookmarkModal);

  const btnDelete = document.getElementById("btn-delete-bookmark");
  if (btnDelete) {
    btnDelete.addEventListener("click", () => {
      if (confirm("Delete this bookmark?")) deleteBookmark();
    });
  }

  // ---- Bookmark backdrop click-outside ----
  const bookmarkBackdrop = document.getElementById("bookmark-backdrop");
  if (bookmarkBackdrop) {
    bookmarkBackdrop.addEventListener("click", (e) => {
      if (e.target === bookmarkBackdrop) closeBookmarkModal();
    });
  }

  // ---- Right-click on page background → add bookmark form ----
  // Interactive elements (links, buttons, inputs …) keep their native context menu.
  document.addEventListener("contextmenu", (e) => {
    if (
      e.target.closest(
        "a, button, input, textarea, select, header, .modal-backdrop, .engine-dropdown",
      )
    )
      return;

    // Don’t reset the form if the modal is already open
    const bmBackdrop = document.getElementById("bookmark-backdrop");
    if (bmBackdrop && !bmBackdrop.classList.contains("hidden")) return;

    e.preventDefault();
    openAddModal();
  });
});
