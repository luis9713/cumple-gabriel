const RSVP_ENDPOINT = "https://script.google.com/macros/s/AKfycbxLbdPzpYLzAKI4a6K6uJfRTzYG6VrjP_XOygw3eD7xWhPUntbM-o8dWWS51a4mEuCaiw/exec";

const eventDate = new Date("2026-07-18T15:00:00-05:00");

const introOverlay = document.getElementById("introOverlay");
const openInvitationBtn = document.getElementById("openInvitationBtn");
const bgMusic = document.getElementById("bgMusic");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");

const rsvpForm = document.getElementById("rsvpForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const confirmationModal = document.getElementById("confirmationModal");
const confirmationModalOkBtn = document.getElementById("confirmationModalOkBtn");

let rsvpConfirmedThisLoad = false;

// Ensure overlay is visible on page load/refresh
function resetOverlay() {
  if (introOverlay) {
    introOverlay.classList.remove("hidden");
    introOverlay.setAttribute("aria-hidden", "false");
    window.scrollTo(0, 0);
  }
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = eventDate.getTime() - now.getTime();

  if (diff <= 0) {
    daysEl.textContent = "00";
    hoursEl.textContent = "00";
    minutesEl.textContent = "00";
    secondsEl.textContent = "00";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  [daysEl, hoursEl, minutesEl, secondsEl].forEach((el) => {
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  });

  daysEl.textContent = pad(days);
  hoursEl.textContent = pad(hours);
  minutesEl.textContent = pad(minutes);
  secondsEl.textContent = pad(seconds);
}

function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          currentObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function startBackgroundMusic() {
  if (!bgMusic) {
    return;
  }

  bgMusic.volume = 0.45;
  bgMusic.muted = false;
  bgMusic.play().catch(() => {
    // Some browsers can still block playback; user can trigger it on next interaction.
  });
}

openInvitationBtn.addEventListener("click", () => {
  introOverlay.classList.add("hidden");
  introOverlay.setAttribute("aria-hidden", "true");
  startBackgroundMusic();
  
  // Scroll to greeting section after opening
  setTimeout(() => {
    const greetingElement = document.querySelector(".section-eyebrow");
    if (greetingElement) {
      greetingElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 300);
});

window.addEventListener("DOMContentLoaded", () => {
  if (bgMusic) {
    bgMusic.volume = 0.45;
    bgMusic.play().catch(() => {
      // Audio will play when user interacts with the page
    });
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    introOverlay.classList.add("hidden");
    introOverlay.setAttribute("aria-hidden", "true");
  }
});

async function sendRsvp(payload) {
  if (!RSVP_ENDPOINT) {
    return { ok: true, localOnly: true };
  }

  const response = await fetch(RSVP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar la confirmacion.");
  }

  return response.json().catch(() => ({ ok: true }));
}

function showConfirmationModal() {
  if (!confirmationModal) {
    return;
  }

  confirmationModal.classList.remove("hidden");
  confirmationModal.setAttribute("aria-hidden", "false");
}

function hideConfirmationModal() {
  if (!confirmationModal) {
    return;
  }

  confirmationModal.classList.add("hidden");
  confirmationModal.setAttribute("aria-hidden", "true");
}

function lockRsvpAfterConfirmation() {
  rsvpConfirmedThisLoad = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Asistencia confirmada";
  formMessage.textContent = "Gracias, asistencia confirmada.";
  formMessage.className = "form-message success";
}

if (confirmationModalOkBtn) {
  confirmationModalOkBtn.addEventListener("click", () => {
    hideConfirmationModal();
    lockRsvpAfterConfirmation();
  });
}

rsvpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (rsvpConfirmedThisLoad) {
    formMessage.textContent = "La asistencia ya fue confirmada en esta sesion.";
    formMessage.className = "form-message success";
    return;
  }

  const guestName = document.getElementById("guestName").value.trim();
  const adults = Number.parseInt(document.getElementById("adults").value, 10);
  const kids = Number.parseInt(document.getElementById("kids").value, 10);

  if (!guestName || Number.isNaN(adults) || Number.isNaN(kids) || adults < 0 || kids < 0) {
    formMessage.textContent = "Por favor revisa los datos antes de enviar.";
    formMessage.className = "form-message error";
    return;
  }

  if (adults + kids === 0) {
    formMessage.textContent = "Debes indicar al menos una persona asistente.";
    formMessage.className = "form-message error";
    return;
  }

  const payload = {
    nombre: guestName,
    adultos: adults,
    ninos: kids,
    total: adults + kids,
    fechaRegistro: new Date().toISOString(),
    evento: "Cumpleanos Gabriel Lopez Castillo",
  };

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    const result = await sendRsvp(payload);

    if (result.localOnly) {
      const key = "gabriel_rsvp_local";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      current.push(payload);
      localStorage.setItem(key, JSON.stringify(current));
    }

    rsvpForm.reset();
    document.getElementById("adults").value = "1";
    document.getElementById("kids").value = "0";

    showConfirmationModal();
  } catch (error) {
    formMessage.textContent = "No se pudo enviar en este momento. Intenta nuevamente.";
    formMessage.className = "form-message error";
  } finally {
    if (!rsvpConfirmedThisLoad) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar asistencia";
    }
  }
});

updateCountdown();
setInterval(updateCountdown, 1000);
revealOnScroll();
resetOverlay();
