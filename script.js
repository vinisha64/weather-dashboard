// ====== CONFIG ======
// Get a free API key at https://openweathermap.org/api
const API_KEY = "a020c891ba10cc5615961958b45ae0c0";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ====== DOM refs ======
const form = document.getElementById("searchForm");
const input = document.getElementById("cityInput");
const result = document.getElementById("result");
const lastUpdated = document.getElementById("lastUpdated");
const particles = document.getElementById("particles");

// Maps OpenWeatherMap's "main" condition to a body class for the backdrop
const conditionClassMap = {
  Clear: "clear",
  Clouds: "clouds",
  Rain: "rain",
  Drizzle: "drizzle",
  Thunderstorm: "thunder",
  Snow: "snow",
  Mist: "mist",
  Fog: "mist",
  Haze: "mist",
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = input.value.trim();
  if (!city) return;
  getWeather(city);
});

async function getWeather(city) {
  showLoading();

  if (API_KEY === "YOUR_API_KEY_HERE") {
    showError(
      "No API key set",
      "Open script.js and paste your OpenWeatherMap key into API_KEY."
    );
    return;
  }

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("City not found. Check the spelling and try again.");
      }
      throw new Error("Something went wrong fetching the weather.");
    }

    const data = await response.json();
    renderWeather(data);
  } catch (err) {
    showError("Couldn't load weather", err.message);
  }
}

function renderWeather(data) {
  const {
    name,
    sys: { country },
    main: { temp, feels_like, humidity, pressure },
    weather,
    wind: { speed, deg },
  } = data;

  const condition = weather[0];
  const isNight = condition.icon.endsWith("n");
  const bucket = conditionClassMap[condition.main] || "clouds";

  document.body.className = isNight ? "night" : bucket;
  renderParticles(bucket);

  const windDeg = Number.isFinite(deg) ? deg : 0;

  result.innerHTML = `
    <div class="card">
      <div class="card-top">
        <div>
          <p class="city-name">${escapeHtml(name)}</p>
          <p class="city-country">${escapeHtml(country)}</p>
        </div>
        <img class="icon" src="https://openweathermap.org/img/wn/${condition.icon}@2x.png" alt="${escapeHtml(condition.description)}" />
      </div>

      <div class="temp-row">
        <span class="temp">${Math.round(temp)}°</span>
        <span class="feels">feels like ${Math.round(feels_like)}°</span>
      </div>
      <p class="condition">${escapeHtml(condition.description)}</p>

      <div class="stat-grid">
        <div class="stat">
          <span class="stat-label">Humidity</span>
          <span class="stat-value">${humidity}%</span>
        </div>
        <div class="stat">
          <span class="stat-label">Wind</span>
          <div class="compass">
            <svg class="compass-svg" viewBox="0 0 64 64">
              <circle class="compass-ring" cx="32" cy="32" r="27"/>
              <text x="32" y="10" class="compass-tick">N</text>
              <text x="57" y="35" class="compass-tick">E</text>
              <text x="32" y="60" class="compass-tick">S</text>
              <text x="7"  y="35" class="compass-tick">W</text>
              <g class="needle-group" style="transform: rotate(${windDeg}deg)">
                <line x1="32" y1="32" x2="32" y2="13" class="needle-main"/>
                <line x1="32" y1="32" x2="32" y2="47" class="needle-tail"/>
                <circle cx="32" cy="32" r="2.6" class="needle-hub"/>
              </g>
            </svg>
          </div>
          <span class="stat-value">${Math.round(speed)} m/s</span>
        </div>
        <div class="stat">
          <span class="stat-label">Pressure</span>
          <span class="stat-value">${pressure}</span>
          <span class="stat-value" style="font-size:9px;color:var(--ink-faint)">hPa</span>
        </div>
      </div>
    </div>
  `;

  lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

// Builds the ambient particle layer (rain streaks / snow drift) for the
// current condition bucket. Clear/cloud/mist conditions get no particles —
// the sun-glow pulse for "clear" is handled entirely in CSS via body.clear.
function renderParticles(bucket) {
  particles.innerHTML = "";

  if (bucket === "rain" || bucket === "drizzle" || bucket === "thunder") {
    const count = bucket === "drizzle" ? 40 : 70;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "streak";
      el.style.left = `${Math.random() * 100}%`;
      el.style.animationDuration = `${0.4 + Math.random() * 0.5}s`;
      el.style.animationDelay = `${Math.random() * 2}s`;
      el.style.opacity = 0.4 + Math.random() * 0.5;
      particles.appendChild(el);
    }
  }

  if (bucket === "snow") {
    for (let i = 0; i < 50; i++) {
      const el = document.createElement("div");
      const size = 2 + Math.random() * 3;
      el.className = "flake";
      el.style.left = `${Math.random() * 100}%`;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.animationDuration = `${6 + Math.random() * 6}s`;
      el.style.animationDelay = `${Math.random() * 5}s`;
      el.style.opacity = 0.5 + Math.random() * 0.5;
      particles.appendChild(el);
    }
  }
}

function showLoading() {
  result.innerHTML = `<div class="loader" aria-label="Loading"></div>`;
  lastUpdated.textContent = "";
}

function showError(title, sub) {
  particles.innerHTML = "";
  result.innerHTML = `
    <div class="error-box">
      <p class="error-title">${escapeHtml(title)}</p>
      <p class="error-sub">${escapeHtml(sub)}</p>
    </div>
  `;
}

// Minimal escaping so city names / descriptions can't break markup
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
