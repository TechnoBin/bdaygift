(() => {
  "use strict";
  const config = window.BIRTHDAY_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const gate = $("#passwordGate");
  const mainSite = $("#mainSite");
  const passwordForm = $("#passwordForm");
  const passwordInput = $("#passwordInput");
  const gateError = $("#gateError");
  const togglePassword = $("#togglePassword");
  const galleryGrid = $("#galleryGrid");
  const secretGrid = $("#secretGrid");
  const lightbox = $("#lightbox");
  const lightboxImage = $("#lightboxImage");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxCounter = $("#lightboxCounter");
  const music = $("#backgroundMusic");
  const musicToggle = $("#musicToggle");
  const toast = $("#toast");

  let activePhoto = 0;
  let previousFocus = null;
  let toastTimer = null;
  let musicEnabled = false;
  let candlesBlown = false;
  let openedSecrets = new Set();

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setPersonalContent() {
    const birthdayName = safeText(config.birthdayName, "my favourite person");
    $("#heroName").textContent = birthdayName;
    $("#finalName").textContent = safeText(config.finalName, birthdayName + ".");
    $("#senderName").textContent = safeText(config.senderName, "someone who adores you");
    $("#finalMessage").textContent = safeText(config.finalMessage, "I hope you feel loved today and always.");
    $("#letterBody").textContent = safeText(config.letter, "Happy birthday, my favourite person. I hope your year is filled with love, joy and beautiful surprises. ♡");
  }

  function makeGallery() {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    galleryGrid.replaceChildren();
    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "gallery-card";
      button.setAttribute("aria-label", `Open photo ${index + 1}: ${safeText(photo.title, "A memory")}`);

      const img = document.createElement("img");
      img.src = safeText(photo.src);
      img.alt = safeText(photo.alt, safeText(photo.title, "A photo memory"));
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        img.removeAttribute("src");
        img.alt = "Image unavailable — replace this photo in js/content.js";
        img.classList.add("image-unavailable");
        button.classList.add("photo-error");
      }, { once: true });

      const title = document.createElement("span");
      title.className = "gallery-card-title";
      title.textContent = safeText(photo.title, `Memory ${index + 1}`);
      const caption = document.createElement("span");
      caption.className = "gallery-card-caption";
      caption.textContent = safeText(photo.caption, "A little memory to keep.");

      button.append(img, title, caption);
      button.addEventListener("click", () => openLightbox(index));
      galleryGrid.append(button);
    });
  }

  function makeSecrets() {
    const secrets = Array.isArray(config.secrets) ? config.secrets : [];
    secretGrid.replaceChildren();
    secrets.forEach((secret, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secret-card";
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", `Reveal secret note: ${safeText(secret.title, "A little secret")}`);

      const icon = document.createElement("span");
      icon.className = "secret-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = safeText(secret.icon, "♡");
      const title = document.createElement("span");
      title.className = "secret-title";
      title.textContent = safeText(secret.title, `Little secret ${index + 1}`);
      const teaser = document.createElement("span");
      teaser.className = "secret-teaser";
      teaser.textContent = safeText(secret.teaser, "Tap to open");

      button.append(icon, title, teaser);
      button.addEventListener("click", () => {
        const isOpen = button.classList.toggle("opened");
        button.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
          const message = document.createElement("span");
          message.className = "secret-message";
          message.textContent = safeText(secret.message, "You are special, today and always. ♡");
          button.append(message);
          openedSecrets.add(index);
        } else {
          const message = $(".secret-message", button);
          if (message) message.remove();
          openedSecrets.delete(index);
        }
        updateSecretProgress();
      });
      secretGrid.append(button);
    });
    updateSecretProgress();
  }

  function updateSecretProgress() {
    const count = openedSecrets.size;
    $("#secretProgress").textContent = `${count} of ${(config.secrets || []).length} little notes opened`;
  }

  function unlockSite() {
    gate.classList.add("hidden");
    mainSite.classList.remove("hidden");
    mainSite.removeAttribute("inert");
    document.body.classList.add("unlocked");
    initRevealObserver();
    createSparkles();
    window.setTimeout(() => $("#home").scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const entered = passwordInput.value;
    if (entered === String(config.password ?? "love2026")) {
      gateError.textContent = "";
      passwordInput.setAttribute("aria-invalid", "false");
      unlockSite();
    } else {
      gateError.textContent = "That doesn't seem right. Try your secret password again. ♡";
      passwordInput.setAttribute("aria-invalid", "true");
      passwordInput.value = "";
      passwordInput.focus();
      const card = $(".gate-card");
      card.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 230 });
    }
  });

  togglePassword.addEventListener("click", () => {
    const reveal = passwordInput.type === "password";
    passwordInput.type = reveal ? "text" : "password";
    togglePassword.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
  });

  function openLightbox(index) {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!photos.length || !photos[index]) return;
    previousFocus = document.activeElement;
    activePhoto = index;
    renderLightboxPhoto();
    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    $("#lightboxClose").focus();
  }

  function renderLightboxPhoto() {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    const photo = photos[activePhoto];
    if (!photo) return;
    lightboxImage.style.opacity = "0";
    const nextSrc = safeText(photo.src);
    const preload = new Image();
    preload.onload = () => {
      lightboxImage.src = nextSrc;
      lightboxImage.alt = safeText(photo.alt, safeText(photo.title, "Photo memory"));
      lightboxImage.style.opacity = "1";
    };
    preload.onerror = () => {
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "This image could not be loaded. Replace its URL in js/content.js.";
      lightboxImage.style.opacity = "1";
    };
    preload.src = nextSrc;
    lightboxCaption.textContent = safeText(photo.title, "A little memory") + (photo.caption ? ` — ${photo.caption}` : "");
    lightboxCounter.textContent = `${activePhoto + 1} / ${photos.length}`;
    const multiple = photos.length > 1;
    $("#lightboxPrev").classList.toggle("hidden", !multiple);
    $("#lightboxNext").classList.toggle("hidden", !multiple);
  }

  function moveLightbox(direction) {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!photos.length) return;
    activePhoto = (activePhoto + direction + photos.length) % photos.length;
    renderLightboxPhoto();
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    document.body.style.overflow = "";
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightboxPrev").addEventListener("click", () => moveLightbox(-1));
  $("#lightboxNext").addEventListener("click", () => moveLightbox(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (lightbox.classList.contains("hidden")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  function blowOutCandles() {
    if (candlesBlown) {
      showToast("Your wish is already on its way. ♡");
      return;
    }
    $$(".candle").forEach((candle) => candle.classList.remove("lit"));
    candlesBlown = true;
    $("#candleInstruction").textContent = "Wish made. Keep it close to your heart. ♡";
    $("#blowCandles").classList.add("hidden");
    $("#wishSuccess").classList.remove("hidden");
    createConfetti();
    showToast("A little wish, sent with love ✨");
  }
  $$(".candle").forEach((candle) => candle.addEventListener("click", () => candle.classList.toggle("lit")));
  $("#blowCandles").addEventListener("click", blowOutCandles);

  function createConfetti() {
    const panel = $(".wish-panel");
    const symbols = ["♡", "✦", "✧", "♥", "✿"];
    for (let i = 0; i < 28; i++) {
      const bit = document.createElement("span");
      bit.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      bit.setAttribute("aria-hidden", "true");
      Object.assign(bit.style, {
        position: "absolute",
        zIndex: "5",
        left: `${8 + Math.random() * 84}%`,
        top: `${22 + Math.random() * 35}%`,
        color: ["#b96f94", "#9e8acb", "#d8a4c0", "#fff"][i % 4],
        fontSize: `${12 + Math.random() * 14}px`,
        pointerEvents: "none",
        transition: "transform 1.5s ease, opacity 1.5s ease"
      });
      panel.append(bit);
      requestAnimationFrame(() => {
        bit.style.transform = `translate(${Math.random() * 90 - 45}px, ${100 + Math.random() * 180}px) rotate(${Math.random() * 220 - 110}deg)`;
        bit.style.opacity = "0";
      });
      window.setTimeout(() => bit.remove(), 1700);
    }
  }

  function createSparkles() {
    const layer = $("#sparkleLayer");
    if (layer.childElementCount) return;
    const symbols = ["✧", "·", "♡", "✦"];
    for (let i = 0; i < 18; i++) {
      const sparkle = document.createElement("span");
      sparkle.className = "sparkle";
      sparkle.textContent = symbols[i % symbols.length];
      sparkle.style.left = `${(i * 37 + 8) % 100}%`;
      sparkle.style.top = `${(i * 23 + 9) % 100}%`;
      sparkle.style.fontSize = `${9 + (i % 4) * 4}px`;
      sparkle.style.animationDelay = `${(i % 7) * -.7}s`;
      layer.append(sparkle);
    }
  }

  function initRevealObserver() {
    const items = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(item => item.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(item => observer.observe(item));
  }

  async function toggleMusic() {
    if (!musicEnabled) {
      try {
        await music.play();
        musicEnabled = true;
        musicToggle.setAttribute("aria-label", "Pause background music");
        musicToggle.classList.add("music-playing");
        showToast("A little music for your moment ♫");
      } catch (error) {
        showToast("Add your-song.mp3 to assets/audio to enable music.");
      }
    } else {
      music.pause();
      musicEnabled = false;
      musicToggle.setAttribute("aria-label", "Play background music");
      musicToggle.classList.remove("music-playing");
    }
  }
  musicToggle.addEventListener("click", toggleMusic);
  music.addEventListener("error", () => {
    if (musicEnabled) showToast("Music file not found. Add your song in assets/audio.");
    musicEnabled = false;
    musicToggle.classList.remove("music-playing");
  });

  $("#restartTop").addEventListener("click", () => {
    const confirmed = window.confirm("Would you like to return to the beginning of your surprise?");
    if (!confirmed) return;
    closeLightboxIfOpen();
    openedSecrets.clear();
    makeSecrets();
    candlesBlown = false;
    $$(".candle").forEach(candle => candle.classList.add("lit"));
    $("#candleInstruction").textContent = "Tap each little flame to make your wish.";
    $("#blowCandles").classList.remove("hidden");
    $("#wishSuccess").classList.add("hidden");
    $("#finalHiddenMessage").classList.add("hidden");
    $("#finalReveal").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function closeLightboxIfOpen() {
    if (!lightbox.classList.contains("hidden")) closeLightbox();
  }

  $("#finalReveal").addEventListener("click", () => {
    $("#finalHiddenMessage").classList.remove("hidden");
    $("#finalReveal").classList.add("hidden");
    createConfetti();
  });

  // Build personalized sections and keep the password screen as the initial view.
  setPersonalContent();
  makeGallery();
  makeSecrets();

  // If the visitor has JavaScript disabled, the page won't be able to unlock; focus input for usability.
  passwordInput.focus({ preventScroll: true });
})();
