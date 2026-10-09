(() => {
  "use strict";
  const config = window.BIRTHDAY_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);   const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
  const musicLabel = musicToggle ? musicToggle.querySelector(".music-label") : null;
  const musicIcon = musicToggle ? musicToggle.querySelector(".music-icon") : null;
  const toast = $("#toast");

  let activePhoto = 0;
  let previousFocus = null;
  let toastTimer = null;
  let musicEnabled = false;
  let candlesBlown = false;
  let openedSecrets = new Set();
  let isPushedState = false; // Tracks browser history state for lightbox

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim() ? value.trim() : fallback;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function setPersonalContent() {
    const birthdayName = safeText(config.birthdayName, "my favourite person");
    const heroName = $("#heroName");
    const finalName = $("#finalName");
    const senderName = $("#senderName");
    const finalMessage = $("#finalMessage");
    const letterBody = $("#letterBody");

    if (heroName) heroName.textContent = birthdayName;
    if (finalName) finalName.textContent = safeText(config.finalName, birthdayName + ".");
    if (senderName) senderName.textContent = safeText(config.senderName, "someone who adores you");
    if (finalMessage) finalMessage.textContent = safeText(config.finalMessage, "I hope you feel loved today and always.");
    if (letterBody) letterBody.textContent = safeText(config.letter, "Happy birthday, my favourite person. I hope your year is filled with love, joy and beautiful surprises. ♡");
  }

  function makeGallery() {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!galleryGrid) return;
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
    if (!secretGrid) return;
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
    const progress = $("#secretProgress");
    if (progress) {
      progress.textContent = `${count} of ${(config.secrets || []).length} little notes opened`;
    }
  }

  function unlockSite() {
    if (gate) gate.classList.add("hidden");
    if (mainSite) {
      mainSite.classList.remove("hidden");
      mainSite.removeAttribute("inert");
    }
    document.body.classList.add("unlocked");
    initRevealObserver();
    createSparkles();

    // Auto-start music on unlock click
    if (!musicEnabled) {
      toggleMusic();
    }

    window.setTimeout(() => {
      const home = $("#home");
      if (home) home.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const entered = passwordInput.value;
      if (entered === String(config.password ?? "love2026")) {
        if (gateError) gateError.textContent = "";
        passwordInput.setAttribute("aria-invalid", "false");
        unlockSite();
      } else {
        if (gateError) gateError.textContent = "That doesn't seem right. Try your secret password again. ♡";
        passwordInput.setAttribute("aria-invalid", "true");
        passwordInput.value = "";
        passwordInput.focus();
        const card = $(".gate-card");
        card?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 230 });
      }
    });
  }

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      const reveal = passwordInput.type === "password";
      passwordInput.type = reveal ? "text" : "password";
      togglePassword.setAttribute("aria-label", reveal ? "Hide password" : "Show password");
    });
  }

  // --- LIGHTBOX WITH BACK-BUTTON (HISTORY API) & SMOOTH SLIDE ---
  function openLightbox(index) {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!photos.length || !photos[index] || !lightbox) return;

    previousFocus = document.activeElement;
    activePhoto = index;
    renderLightboxPhoto();

    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Push history state so physical browser/phone Back button closes the lightbox
    if (!isPushedState) {
      history.pushState({ lightboxOpen: true }, "");
      isPushedState = true;
    }

    const closeBtn = $("#lightboxClose");
    if (closeBtn) closeBtn.focus();
  }

  function renderLightboxPhoto() {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    const photo = photos[activePhoto];
    if (!photo || !lightboxImage) return;

    // Trigger smooth fade transition
    lightboxImage.classList.add("changing");

    const nextSrc = safeText(photo.src);
    const preload = new Image();

    preload.onload = () => {
      lightboxImage.src = nextSrc;
      lightboxImage.alt = safeText(photo.alt, safeText(photo.title, "Photo memory"));
      lightboxImage.classList.remove("changing");
    };

    preload.onerror = () => {
      lightboxImage.removeAttribute("src");
      lightboxImage.alt = "This image could not be loaded. Replace its URL in js/content.js.";
      lightboxImage.classList.remove("changing");
    };

    preload.src = nextSrc;

    if (lightboxCaption) {
      lightboxCaption.textContent = safeText(photo.title, "A little memory") + (photo.caption ? ` — ${photo.caption}` : "");
    }
    if (lightboxCounter) {
      lightboxCounter.textContent = `${activePhoto + 1} / ${photos.length}`;
    }

    const prevBtn = $("#lightboxPrev");
    const nextBtn = $("#lightboxNext");
    const multiple = photos.length > 1;

    if (prevBtn) prevBtn.classList.toggle("hidden", !multiple);
    if (nextBtn) nextBtn.classList.toggle("hidden", !multiple);
  }

  function moveLightbox(direction) {
    const photos = Array.isArray(config.photos) ? config.photos : [];
    if (!photos.length) return;
    activePhoto = (activePhoto + direction + photos.length) % photos.length;
    renderLightboxPhoto();
  }

  function closeLightbox(fromPopState = false) {
    if (!lightbox || lightbox.classList.contains("hidden")) return;

    lightbox.classList.add("hidden");
    document.body.style.overflow = "";

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }

    // If closed via UI (X button, overlay click, ESC), sync the history state back
    if (!fromPopState && isPushedState) {
      isPushedState = false;
      history.back();
    } else {
      isPushedState = false;
    }
  }

  // Intercept back button / swipe-back gesture
  window.addEventListener("popstate", () => {
    if (lightbox && !lightbox.classList.contains("hidden")) {
      closeLightbox(true); // Close lightbox via browser back
    }
  });

  const closeBtn = $("#lightboxClose");
  const prevBtn = $("#lightboxPrev");
  const nextBtn = $("#lightboxNext");    if (closeBtn) closeBtn.addEventListener("click", () => closeLightbox(false));   if (prevBtn) prevBtn.addEventListener("click", () => moveLightbox(-1));   if (nextBtn) nextBtn.addEventListener("click", () => moveLightbox(1));    if (lightbox) {     lightbox.addEventListener("click", (event) => {       if (event.target === lightbox) closeLightbox(false);     });   }    document.addEventListener("keydown", (event) => {     if (!lightbox \vert{}\vert{} lightbox.classList.contains("hidden")) return;     if (event.key === "Escape") closeLightbox(false);     if (event.key === "ArrowLeft") moveLightbox(-1);     if (event.key === "ArrowRight") moveLightbox(1);   });    // Touch Swipe Gesture Support for Mobile   let touchStartX = 0;   if (lightbox) {     lightbox.addEventListener("touchstart", (e) => {       touchStartX = e.changedTouches[0].clientX;     }, { passive: true });      lightbox.addEventListener("touchend", (e) => {       const touchEndX = e.changedTouches[0].clientX;       const diffX = touchEndX - touchStartX;       if (Math.abs(diffX) > 40) {         if (diffX < 0) moveLightbox(1);  // Swipe Left -> Next         else moveLightbox(-1);           // Swipe Right -> Prev       }     }, { passive: true });   }    // --- CANDLE & CONFETTI LOGIC ---   function blowOutCandles() {     if (candlesBlown) {       showToast("Your wish is already on its way. ♡");       return;     }     $$(".candle").forEach((candle) => candle.classList.remove("lit"));
    candlesBlown = true;
    const instruction = $("#candleInstruction");
    if (instruction) instruction.textContent = "Wish made. Keep it close to your heart. ♡";
    const blowBtn = $("#blowCandles");
    if (blowBtn) blowBtn.classList.add("hidden");
    const successMsg = $("#wishSuccess");     if (successMsg) successMsg.classList.remove("hidden");     createConfetti();     showToast("A little wish, sent with love ✨");   }    $$(".candle").forEach((candle) => candle.addEventListener("click", () => candle.classList.toggle("lit")));
  const blowCandlesBtn = $("#blowCandles");
  if (blowCandlesBtn) blowCandlesBtn.addEventListener("click", blowOutCandles);

  function createConfetti() {
    const panel = $(".wish-panel");
    if (!panel) return;
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
    if (!layer || layer.childElementCount) return;
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

  // --- MUSIC TOGGLE & VISIBILITY STATE ---
  async function toggleMusic() {
    if (!music || !musicToggle) return;
    if (!musicEnabled) {
      try {
        await music.play();
        musicEnabled = true;
        musicToggle.setAttribute("aria-label", "Pause background music");
        musicToggle.classList.add("music-playing");
        if (musicLabel) musicLabel.textContent = "Music ON";
        if (musicIcon) musicIcon.textContent = "♫";
        showToast("A little music for your moment ♫");
      } catch (error) {
        showToast("Add song2.mp3 to audio/ to enable music.");
      }
    } else {
      music.pause();
      musicEnabled = false;
      musicToggle.setAttribute("aria-label", "Play background music");
      musicToggle.classList.remove("music-playing");
      if (musicLabel) musicLabel.textContent = "Music OFF";
      if (musicIcon) musicIcon.textContent = "🔇";
    }
  }

  if (musicToggle) musicToggle.addEventListener("click", toggleMusic);
  if (music) {
    music.addEventListener("error", () => {
      if (musicEnabled) showToast("Music file not found. Check audio/song2.mp3.");
      musicEnabled = false;
      if (musicToggle) musicToggle.classList.remove("music-playing");
      if (musicLabel) musicLabel.textContent = "Music OFF";
      if (musicIcon) musicIcon.textContent = "🔇";
    });
  }

  const restartBtn = $("#restartTop");   if (restartBtn) {     restartBtn.addEventListener("click", () => {       const confirmed = window.confirm("Would you like to return to the beginning of your surprise?");       if (!confirmed) return;       closeLightbox(false);       openedSecrets.clear();       makeSecrets();       candlesBlown = false;       $$(".candle").forEach(candle => candle.classList.add("lit"));
      const instruction = $("#candleInstruction");
      if (instruction) instruction.textContent = "Tap each little flame to make your wish.";
      const blowBtn = $("#blowCandles");
      if (blowBtn) blowBtn.classList.remove("hidden");
      const wishSuccess = $("#wishSuccess");
      if (wishSuccess) wishSuccess.classList.add("hidden");
      const hiddenMsg = $("#finalHiddenMessage");
      if (hiddenMsg) hiddenMsg.classList.add("hidden");
      const finalBtn = $("#finalReveal");
      if (finalBtn) finalBtn.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const finalBtn = $("#finalReveal");
  if (finalBtn) {
    finalBtn.addEventListener("click", () => {
      const hiddenMsg = $("#finalHiddenMessage");
      if (hiddenMsg) hiddenMsg.classList.remove("hidden");
      finalBtn.classList.add("hidden");
      createConfetti();
    });
  }

  // Initial Setup
  setPersonalContent();
  makeGallery();
  makeSecrets();

  if (passwordInput) passwordInput.focus({ preventScroll: true });
})();
