// ============================================================
// Constants
// ============================================================

const ENGINES = {
  ddg: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    color: "#de5833",
    letter: "D",
  },
  google: {
    name: "Google",
    url: "https://www.google.com/search?q=",
    color: "#4285f4",
    letter: "G",
  },
  bing: {
    name: "Bing",
    url: "https://www.bing.com/search?q=",
    color: "#0078d7",
    letter: "B",
  },
  brave: {
    name: "Brave",
    url: "https://search.brave.com/search?q=",
    color: "#fb542b",
    letter: "b",
  },
  ecosia: {
    name: "Ecosia",
    url: "https://www.ecosia.org/search?q=",
    color: "#4a9b5e",
    letter: "E",
  },
  startpage: {
    name: "Startpage",
    url: "https://www.startpage.com/sp/search?q=",
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
};

let state = {
  settings: { ...DEFAULT_SETTINGS },
  bookmarks: [],
  editingBookmarkId: null,
};

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

  iconEl.style.background = engine.color;
  iconEl.textContent = engine.letter;
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

    btn.innerHTML =
      `<span class="engine-option-circle" style="background:${engine.color}">${engine.letter}</span>` +
      `<span class="engine-option-name">${engine.name}</span>`;

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
    card.setAttribute("target", "_blank");
    card.setAttribute("rel", "noopener noreferrer");

    // ---- Favicon ----
    const faviconWrap = document.createElement("div");
    faviconWrap.className = "bookmark-favicon-container";

    const img = document.createElement("img");
    img.className = "bookmark-favicon";
    img.src = getFaviconUrl(bookmark.url);
    img.alt = "";

    const fallback = document.createElement("div");
    fallback.className = "bookmark-favicon-fallback";
    fallback.style.background = stringToColor(bookmark.name);
    fallback.style.display = "none";
    fallback.textContent = bookmark.name.charAt(0).toUpperCase();

    img.onerror = () => {
      img.style.display = "none";
      fallback.style.display = "flex";
    };

    faviconWrap.appendChild(img);
    faviconWrap.appendChild(fallback);

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
    grid.appendChild(card);
  });

  // ---- Add card ----
  const addCard = document.createElement("div");
  addCard.className = "bookmark-card bookmark-add-card";
  addCard.setAttribute("role", "button");
  addCard.setAttribute("tabindex", "0");
  addCard.setAttribute("aria-label", "Add bookmark");
  addCard.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
    <span>Add</span>`;
  addCard.addEventListener("click", openAddModal);
  addCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAddModal();
    }
  });
  grid.appendChild(addCard);
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

  if (bmName) bmName.value = "";
  if (bmUrl) bmUrl.value = "";
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

  if (bmName) bmName.value = bookmark.name;
  if (bmUrl) bmUrl.value = bookmark.url;
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
  if (!bmName || !bmUrl) return;

  const name = bmName.value.trim();
  const rawUrl = bmUrl.value.trim();
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
    }
  } else {
    state.bookmarks.push({ id: uid(), name, url });
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
});
