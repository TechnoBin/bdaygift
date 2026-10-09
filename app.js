(() => {
  "use strict";

  // =========================
  // CONFIGURATION
  // =========================

  const config = window.BIRTHDAY_CONFIG || {};

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  // =========================
  // HTML ELEMENTS
  // =========================

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

  const musicLabel = musicToggle
    ? $(".music-label", musicToggle)
    : null;

  const musicIcon = musicToggle
    ? $(".music-icon", musicToggle)
    : null;

  const toast = $("#toast");

  // =========================
  // VARIABLES
  // =========================

  let activePhoto = 0;
  let previousFocus = null;
  let toastTimer = null;
  let musicEnabled = false;
  let wasMusicPlayingBeforeVideo = false; // Tracks music state before video launch
  let candlesBlown = false;
  let isPushedState = false;

  const openedSecrets = new Set();

  // =========================
  // HELPER FUNCTIONS
  // =========================

  function safeText(value, fallback = "") {
    return typeof value === "string" && value.trim()
      ? value.trim()
      : fallback;
  }

  function getPhotos() {
    return Array.isArray(config.photos)
      ? config.photos
      : [];
  }

  function getSecrets() {
    return Array.isArray(config.secrets)
      ? config.secrets
      : [];
  }

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2600);
  }

    // --- BIG SCREEN VIDEO LIGHTBOX HANDLER ---
  const videoCards = $$(".video-card");
  
  videoCards.forEach((card) => {
    card.addEventListener("click", () => {
      const src = card.getAttribute("data-video-src");
      const title = card.getAttribute("data-title") || "Memory Video";
      if (!src || !lightbox) return;

      previousFocus = document.activeElement;

      // Pause background music if playing
      if (musicEnabled && music) {
        music.pause();
      }

      // Hide image element, create or show video player in Lightbox
      if (lightboxImage) lightboxImage.classList.add("hidden");
      
      let modalVideo = $("#lightboxVideo");
      if (!modalVideo) {
        modalVideo = document.createElement("video");
        modalVideo.id = "lightboxVideo";
        modalVideo.className = "lightbox-video";
        modalVideo.controls = true;
        modalVideo.autoplay = true;
        modalVideo.playsInline = true;
        $(".lightbox-figure")?.append(modalVideo);
      } else {
        modalVideo.classList.remove("hidden");
      }

      modalVideo.src = src;

      if (lightboxCaption) lightboxCaption.textContent = title;
      if (lightboxCounter) lightboxCounter.textContent = "Video Clip";

      // Hide photo prev/next buttons for video mode
      $("#lightboxPrev")?.classList.add("hidden");
      $("#lightboxNext")?.classList.add("hidden");

      lightbox.classList.remove("hidden");
      document.body.style.overflow = "hidden";

      if (!isPushedState) {
        history.pushState({ lightboxOpen: true }, "");
        isPushedState = true;
      }
    });
  });

  // Intercept closing lightbox to stop video & restore image mode
  const originalCloseLightbox = closeLightbox;
  closeLightbox = function(fromPopState = false) {
    const modalVideo = $("#lightboxVideo");
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.removeAttribute("src");
      modalVideo.classList.add("hidden");
    }
    if (lightboxImage) lightboxImage.classList.remove("hidden");

    originalCloseLightbox(fromPopState);
  };
  
  // --- VIDEO LIGHTBOX HANDLER ---
    function openVideoLightbox(src, title) {
    if (!src || !lightbox) return;

    previousFocus = document.activeElement;

    // Check if background music is actively playing before pausing
    if (musicEnabled && music && !music.paused) {
      wasMusicPlayingBeforeVideo = true;
      music.pause();
    } else {
      wasMusicPlayingBeforeVideo = false;
    }

    if (lightboxImage) lightboxImage.classList.add("hidden");

    let modalVideo = $("#lightboxVideo");
    if (!modalVideo) {
      modalVideo = document.createElement("video");
      modalVideo.id = "lightboxVideo";
      modalVideo.className = "lightbox-video";
      modalVideo.controls = true;
      modalVideo.autoplay = true;
      modalVideo.playsInline = true;
      $(".lightbox-figure")?.append(modalVideo);
    } else {
      modalVideo.classList.remove("hidden");
    }

    modalVideo.src = src;

    if (lightboxCaption) lightboxCaption.textContent = title;
    if (lightboxCounter) lightboxCounter.textContent = "Video Clip";

    $("#lightboxPrev")?.classList.add("hidden");
    $("#lightboxNext")?.classList.add("hidden");

    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    if (!isPushedState) {
      history.pushState({ lightboxOpen: true }, "");
      isPushedState = true;
    }
  }


  // Attach click listener to video cards
  $$(".video-card").forEach((card) => {
    card.addEventListener("click", () => {
      const src = card.getAttribute("data-video-src");
      const title = card.getAttribute("data-title") || "Memory Video";
      openVideoLightbox(src, title);
    });
  });
  
  // =========================
  // PERSONAL CONTENT
  // =========================

  function setPersonalContent() {
    const birthdayName = safeText(
      config.birthdayName,
      "my favourite person"
    );

    const heroName = $("#heroName");
    const finalName = $("#finalName");
    const senderName = $("#senderName");
    const finalMessage = $("#finalMessage");
    const letterBody = $("#letterBody");

    if (heroName) {
      heroName.textContent = birthdayName;
    }

    if (finalName) {
      finalName.textContent = safeText(
        config.finalName,
        birthdayName + "."
      );
    }

    if (senderName) {
      senderName.textContent = safeText(
        config.senderName,
        "someone who adores you"
      );
    }

    if (finalMessage) {
      finalMessage.textContent = safeText(
        config.finalMessage,
        "I hope you feel loved today and always."
      );
    }

    if (letterBody) {
      letterBody.textContent = safeText(
        config.letter,
        "Happy birthday, my favourite person. " +
        "I hope your year is filled with love, joy " +
        "and beautiful surprises. ♡"
      );
    }
  }

  // =========================
  // PHOTO GALLERY
  // =========================

  function makeGallery() {
    if (!galleryGrid) return;

    galleryGrid.replaceChildren();

    getPhotos().forEach((photo, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "gallery-card";

      button.setAttribute(
        "aria-label",
        `Open photo ${index + 1}: ${
          safeText(photo.title, "A memory")
        }`
      );

      const img = document.createElement("img");

      img.alt = safeText(
        photo.alt,
        safeText(photo.title, "A photo memory")
      );

      img.loading = "lazy";
      img.decoding = "async";

      img.addEventListener("error", () => {
        img.removeAttribute("src");
        img.alt = "Image unavailable. Check the photo URL.";
        img.classList.add("image-unavailable");
        button.classList.add("photo-error");
      });

      const title = document.createElement("span");
      title.className = "gallery-card-title";
      title.textContent = safeText(
        photo.title,
        `Memory ${index + 1}`
      );

      const caption = document.createElement("span");
      caption.className = "gallery-card-caption";
      caption.textContent = safeText(
        photo.caption,
        "A little memory to keep."
      );

      button.append(img, title, caption);

      button.addEventListener("click", () => {
        openLightbox(index);
      });

      galleryGrid.append(button);

      const src = safeText(photo.src);

      if (src) {
        img.src = src;
      }
    });
  }

  // =========================
  // LIGHTBOX
  // =========================

  function openLightbox(index) {
    const photos = getPhotos();

    if (!lightbox || !photos[index]) return;

    previousFocus = document.activeElement;
    activePhoto = index;

    renderLightboxPhoto();

    lightbox.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    if (!isPushedState) {
      history.pushState({ lightboxOpen: true }, "");
      isPushedState = true;
    }

    const closeButton = $("#lightboxClose");

    if (closeButton) {
      closeButton.focus();
    }
  }

  function renderLightboxPhoto() {
    const photos = getPhotos();
    const photo = photos[activePhoto];

    if (!photo || !lightboxImage) return;

    const requestedIndex = activePhoto;
    const src = safeText(photo.src);

    lightboxImage.classList.add("changing");

    const preload = new Image();

    preload.onload = () => {
      if (requestedIndex !== activePhoto) return;

      lightboxImage.src = src;

      lightboxImage.alt = safeText(
        photo.alt,
        safeText(photo.title, "Photo memory")
      );

      lightboxImage.classList.remove("changing");
    };

    preload.onerror = () => {
      if (requestedIndex !== activePhoto) return;

      lightboxImage.removeAttribute("src");

      lightboxImage.alt =
        "Image could not be loaded. Check the photo URL.";

      lightboxImage.classList.remove("changing");
    };

    if (src) {
      preload.src = src;
    } else {
      preload.onerror();
    }

    if (lightboxCaption) {
      lightboxCaption.textContent =
        safeText(photo.title, "A little memory") +
        (photo.caption ? ` — ${photo.caption}` : "");
    }

    if (lightboxCounter) {
      lightboxCounter.textContent =
        `${activePhoto + 1} / ${photos.length}`;
    }

    const prevButton = $("#lightboxPrev");
    const nextButton = $("#lightboxNext");
    const multiple = photos.length > 1;

    if (prevButton) {
      prevButton.classList.toggle("hidden", !multiple);
    }

    if (nextButton) {
      nextButton.classList.toggle("hidden", !multiple);
    }
  }

  function moveLightbox(direction) {
    const photos = getPhotos();

    if (!photos.length) return;

    activePhoto =
      (activePhoto + direction + photos.length) %
      photos.length;

    renderLightboxPhoto();
  }

      function closeLightbox(fromPopState = false) {
    if (!lightbox || lightbox.classList.contains("hidden")) return;

    // Stop and reset video element
    const modalVideo = $("#lightboxVideo");
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.removeAttribute("src");
      modalVideo.classList.add("hidden");
    }

    // Auto-resume background audio if it was playing prior to opening the video
    if (wasMusicPlayingBeforeVideo && music) {
      music.play().catch(() => {});
      wasMusicPlayingBeforeVideo = false;
    }

    if (lightboxImage) lightboxImage.classList.remove("hidden");

    lightbox.classList.add("hidden");
    document.body.style.overflow = "";

    if (previousFocus && typeof previousFocus.focus === "function") {
      previousFocus.focus();
    }

    if (!fromPopState && isPushedState) {
      isPushedState = false;
      history.back();
    } else {
      isPushedState = false;
    }
  }


  const closeButton = $("#lightboxClose");
  const prevButton = $("#lightboxPrev");
  const nextButton = $("#lightboxNext");

  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeLightbox();
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      moveLightbox(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      moveLightbox(1);
    });
  }

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  window.addEventListener("popstate", () => {
    if (lightbox && !lightbox.classList.contains("hidden")) {
      closeLightbox(true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.classList.contains("hidden")) {
      return;
    }

    if (event.key === "Escape") {
      closeLightbox();
    }

    if (event.key === "ArrowLeft") {
      moveLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      moveLightbox(1);
    }
  });

  let touchStartX = 0;

  if (lightbox) {
    lightbox.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true }
    );

    lightbox.addEventListener(
      "touchend",
      (event) => {
        const touchEndX = event.changedTouches[0].clientX;
        const difference = touchEndX - touchStartX;

        if (Math.abs(difference) > 40) {
          moveLightbox(difference < 0 ? 1 : -1);
        }
      },
      { passive: true }
    );
  }

  // =========================
  // SECRET MESSAGES
  // =========================

  function makeSecrets() {
    if (!secretGrid) return;

    secretGrid.replaceChildren();

    getSecrets().forEach((secret, index) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "secret-card";
      button.setAttribute("aria-expanded", "false");

      const icon = document.createElement("span");
      icon.className = "secret-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = safeText(secret.icon, "♡");

      const title = document.createElement("span");
      title.className = "secret-title";
      title.textContent = safeText(
        secret.title,
        `Little secret ${index + 1}`
      );

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
          message.textContent = safeText(
            secret.message,
            "You are special, today and always. ♡"
          );

          button.append(message);
          openedSecrets.add(index);
        } else {
          const message = $(".secret-message", button);

          if (message) {
            message.remove();
          }

          openedSecrets.delete(index);
        }

        updateSecretProgress();
      });

      secretGrid.append(button);
    });

    updateSecretProgress();
  }

  function updateSecretProgress() {
    const progress = $("#secretProgress");

    if (!progress) return;

    progress.textContent =
      `${openedSecrets.size} of ${getSecrets().length} ` +
      "little notes opened";
  }

  // =========================
  // PASSWORD GATE
  // =========================

  function unlockSite() {
    if (gate) {
      gate.classList.add("hidden");
      gate.style.display = "none";
    }

    if (mainSite) {
      mainSite.classList.remove("hidden");
      mainSite.style.display = "block";
      mainSite.removeAttribute("inert");
    }

    document.body.classList.add("unlocked");

    $$(".reveal").forEach((item) => {
      item.classList.add("visible");
    });

    initRevealObserver();
    createSparkles();

    // Music may be blocked by the browser.
    // The visitor can always use the music button.
    if (music && !musicEnabled) {
      toggleMusic();
    }

    setTimeout(() => {
      const home = $("#home");

      if (home) {
        home.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 60);
  }

  function handleUnlockAttempt(event) {
    event.preventDefault();

    const entered = passwordInput
      ? passwordInput.value.trim().toLowerCase()
      : "";

    const configuredPassword = String(
      config.password || "birthday"
    ).trim().toLowerCase();

    // Only the configured password is accepted.
    if (entered && entered === configuredPassword) {
      if (gateError) {
        gateError.textContent = "";
      }

      if (passwordInput) {
        passwordInput.setAttribute("aria-invalid", "false");
      }

      unlockSite();
    } else {
      if (gateError) {
        gateError.textContent =
          "That doesn't seem right. Try your password again. ♡";
      }

      if (passwordInput) {
        passwordInput.setAttribute("aria-invalid", "true");
        passwordInput.value = "";
        passwordInput.focus();
      }

      const card = $(".gate-card");

      if (card && card.animate) {
        card.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(5px)" },
            { transform: "translateX(0)" }
          ],
          { duration: 230 }
        );
      }
    }
  }

  if (passwordForm) {
    passwordForm.addEventListener(
      "submit",
      handleUnlockAttempt
    );
  }

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const show = passwordInput.type === "password";

      passwordInput.type = show ? "text" : "password";

      togglePassword.setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );
    });
  }

  // =========================
  // CANDLES AND WISH
  // =========================

  function blowOutCandles() {
    if (candlesBlown) {
      showToast("Your wish is already on its way. ♡");
      return;
    }

    $$(".candle").forEach((candle) => {
      candle.classList.remove("lit");
    });

    candlesBlown = true;

    const instruction = $("#candleInstruction");
    const blowButton = $("#blowCandles");
    const successMessage = $("#wishSuccess");

    if (instruction) {
      instruction.textContent =
        "Wish made. Keep it close to your heart. ♡";
    }

    if (blowButton) {
      blowButton.classList.add("hidden");
    }

    if (successMessage) {
      successMessage.classList.remove("hidden");
    }

    createConfetti();
    showToast("A little wish, sent with love ✨");
  }

  $$(".candle").forEach((candle) => {
    candle.addEventListener("click", () => {
      if (!candlesBlown) {
        candle.classList.toggle("lit");
      }
    });
  });

  const blowButton = $("#blowCandles");

  if (blowButton) {
    blowButton.addEventListener("click", blowOutCandles);
  }

  // =========================
  // CONFETTI
  // =========================

  function createConfetti() {
    const panel = $(".wish-panel");

    if (!panel) return;

    const symbols = ["♡", "✦", "✧", "♥", "✿"];

    for (let i = 0; i < 28; i++) {
      const bit = document.createElement("span");

      bit.textContent =
        symbols[Math.floor(Math.random() * symbols.length)];

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
        bit.style.transform =
          `translate(${Math.random() * 90 - 45}px, ` +
          `${100 + Math.random() * 180}px) ` +
          `rotate(${Math.random() * 220 - 110}deg)`;

        bit.style.opacity = "0";
      });

      setTimeout(() => {
        bit.remove();
      }, 1700);
    }
  }

  // =========================
  // SPARKLES
  // =========================

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
      sparkle.style.animationDelay = `${(i % 7) * -0.7}s`;

      layer.append(sparkle);
    }
  }

  // =========================
  // SCROLL REVEAL
  // =========================

  function initRevealObserver() {
    const items = $$(".reveal");

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => {
        item.classList.add("visible");
      });

      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((item) => {
      observer.observe(item);
    });
  }

  // =========================
  // BACKGROUND MUSIC
  // =========================

  async function toggleMusic() {
    if (!music || !musicToggle) return;

    if (!musicEnabled) {
      try {
        await music.play();

        musicEnabled = true;

        musicToggle.setAttribute(
          "aria-label",
          "Pause background music"
        );

        musicToggle.classList.add("music-playing");

        if (musicLabel) {
          musicLabel.textContent = "Music ON";
        }

        if (musicIcon) {
          musicIcon.textContent = "♫";
        }

        showToast("A little music for your moment ♫");
      } catch (error) {
        musicEnabled = false;
        showToast("Tap the music button to try playing music.");
      }
    } else {
      music.pause();
      musicEnabled = false;

      musicToggle.setAttribute(
        "aria-label",
        "Play background music"
      );

      musicToggle.classList.remove("music-playing");

      if (musicLabel) {
        musicLabel.textContent = "Music OFF";
      }

      if (musicIcon) {
        musicIcon.textContent = "🔇";
      }
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener("click", toggleMusic);
  }

  if (music) {
    music.addEventListener("error", () => {
      musicEnabled = false;

      if (musicToggle) {
        musicToggle.classList.remove("music-playing");
      }

      if (musicLabel) {
        musicLabel.textContent = "Music OFF";
      }

      if (musicIcon) {
        musicIcon.textContent = "🔇";
      }

      showToast("Check that audio/song2.mp3 exists.");
    });

    music.addEventListener("pause", () => {
      musicEnabled = false;
    });

    music.addEventListener("play", () => {
      musicEnabled = true;
    });
  }

  // =========================
  // FINAL MESSAGE
  // =========================

  const finalButton = $("#finalReveal");

  if (finalButton) {
    finalButton.addEventListener("click", () => {
      const hiddenMessage = $("#finalHiddenMessage");

      if (hiddenMessage) {
        hiddenMessage.classList.remove("hidden");
      }

      finalButton.classList.add("hidden");
      createConfetti();
    });
  }

  // =========================
  // RESTART
  // =========================

  const restartButton = $("#restartTop");

  if (restartButton) {
    restartButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Would you like to return to the beginning of your surprise?"
      );

      if (!confirmed) return;

      closeLightbox();

      openedSecrets.clear();
      makeSecrets();

      candlesBlown = false;

      $$(".candle").forEach((candle) => {
        candle.classList.add("lit");
      });

      const instruction = $("#candleInstruction");
      const blowButton = $("#blowCandles");
      const successMessage = $("#wishSuccess");
      const hiddenMessage = $("#finalHiddenMessage");

      if (instruction) {
        instruction.textContent =
          "Tap each little flame to make your wish.";
      }

      if (blowButton) {
        blowButton.classList.remove("hidden");
      }

      if (successMessage) {
        successMessage.classList.add("hidden");
      }

      if (hiddenMessage) {
        hiddenMessage.classList.add("hidden");
      }

      if (finalButton) {
        finalButton.classList.remove("hidden");
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  // =========================
  // START THE WEBSITE
  // =========================

  function init() {
    setPersonalContent();
    makeGallery();
    makeSecrets();

    if (passwordInput && gate &&
        !gate.classList.contains("hidden")) {
      passwordInput.focus({ preventScroll: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
