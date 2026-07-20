(function () {
  const MUSIC_KEY = "bamboo_music_enabled";
  const TIME_KEY = "bamboo_music_time";
  const VOLUME_KEY = "bamboo_music_volume";
  const DEFAULT_VOLUME = 0.36;

  const scriptUrl = new URL(document.currentScript.src);
  const audioUrl = new URL("日式和風配樂.mp3", scriptUrl);

  const style = document.createElement("style");
  style.textContent = `
    .bamboo-music-toggle {
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 9999;
      min-height: 40px;
      padding: 9px 13px;
      border: 1px solid rgba(248,218,145,.7);
      border-radius: 999px;
      color: #25170d;
      background: linear-gradient(180deg, #f4df9f, #c89045);
      box-shadow: 0 12px 28px rgba(0,0,0,.32);
      font: 900 14px/1.2 "Noto Serif TC", "PMingLiU", "MingLiU", serif;
      cursor: pointer;
    }
    .bamboo-music-toggle.is-off {
      color: #f8ecd2;
      background: rgba(7,8,7,.78);
      border-color: rgba(217,180,100,.42);
    }
    .bamboo-music-toggle.has-error {
      color: #ffe8dc;
      background: rgba(134,43,34,.86);
      border-color: rgba(196,82,70,.9);
    }
  `;
  document.head.appendChild(style);

  const audio = document.createElement("audio");
  audio.loop = true;
  audio.preload = "auto";
  audio.playsInline = true;
  audio.volume = 0;

  const source = document.createElement("source");
  source.src = audioUrl.href;
  source.type = "audio/mp4";
  audio.appendChild(source);
  document.body.appendChild(audio);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "bamboo-music-toggle is-off";
  button.setAttribute("aria-label", "背景音樂開關");
  document.body.appendChild(button);

  let enabled = localStorage.getItem(MUSIC_KEY) === "true";
  let targetVolume = Number(localStorage.getItem(VOLUME_KEY)) || DEFAULT_VOLUME;
  let fadeTimer = null;

  const savedTime = Number(localStorage.getItem(TIME_KEY));
  if (Number.isFinite(savedTime) && savedTime > 0) {
    audio.addEventListener("loadedmetadata", () => {
      if (savedTime < audio.duration) audio.currentTime = savedTime;
    }, { once: true });
  }

  function updateButton(label) {
    button.classList.toggle("is-off", !enabled);
    button.textContent = label || (enabled ? "♪ 音樂 開" : "♪ 音樂 關");
  }

  function fadeTo(volume) {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      const diff = volume - audio.volume;
      if (Math.abs(diff) < 0.025) {
        audio.volume = volume;
        clearInterval(fadeTimer);
        return;
      }
      audio.volume = Math.max(0, Math.min(targetVolume, audio.volume + Math.sign(diff) * 0.025));
    }, 45);
  }

  async function playMusic() {
    button.classList.remove("has-error");
    try {
      await audio.play();
      enabled = true;
      localStorage.setItem(MUSIC_KEY, "true");
      fadeTo(targetVolume);
      updateButton();
    } catch (error) {
      enabled = true;
      localStorage.setItem(MUSIC_KEY, "true");
      updateButton("♪ 點一下播放");
    }
  }

  function pauseMusic() {
    enabled = false;
    localStorage.setItem(MUSIC_KEY, "false");
    fadeTo(0);
    setTimeout(() => {
      if (!enabled) audio.pause();
    }, 260);
    updateButton();
  }

  button.addEventListener("click", event => {
    event.stopPropagation();
    if (button.classList.contains("has-error")) return;
    if (audio.paused || !enabled) playMusic();
    else pauseMusic();
  });

  audio.addEventListener("error", () => {
    button.classList.add("has-error");
    button.textContent = "音檔無法播放";
  });

  document.addEventListener("pointerdown", () => {
    if (enabled && audio.paused && !button.classList.contains("has-error")) playMusic();
  }, { once: true });

  setInterval(() => {
    if (!Number.isNaN(audio.currentTime)) {
      localStorage.setItem(TIME_KEY, String(Math.floor(audio.currentTime)));
    }
  }, 2000);

  window.addEventListener("beforeunload", () => {
    if (!Number.isNaN(audio.currentTime)) {
      localStorage.setItem(TIME_KEY, String(Math.floor(audio.currentTime)));
    }
  });

  updateButton();
  if (enabled) playMusic();
})();
