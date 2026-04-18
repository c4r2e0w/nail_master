const COURSE_PAGES = ["home", "course", "route", "modules", "practice", "testing"];
const STORAGE_KEY = "maniikabinet-progress";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { visited: [], quizScore: null, chapterDone: [] };
  } catch {
    return { visited: [], quizScore: null, chapterDone: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function markVisited(page) {
  const state = loadState();
  if (!state.visited.includes(page)) {
    state.visited.push(page);
    saveState(state);
  }
  return state;
}

function renderProgress() {
  const state = loadState();
  const total = COURSE_PAGES.length;
  const completed = state.visited.length + (state.quizScore !== null ? 1 : 0);
  const effectiveTotal = total + 1;
  const percent = Math.round((completed / effectiveTotal) * 100);
  const degrees = Math.round((percent / 100) * 360);

  document.querySelectorAll("[data-progress-percent]").forEach((node) => {
    node.textContent = `${percent}%`;
    const ring = node.closest(".progress-widget__ring");
    if (ring) {
      ring.style.background = `radial-gradient(circle closest-side, rgba(255, 249, 245, 0.95) 76%, transparent 77% 100%), conic-gradient(var(--accent) 0deg, var(--accent-2) ${degrees}deg, rgba(255,255,255,0.45) ${degrees}deg)`;
    }
  });

  document.querySelectorAll("[data-progress-text]").forEach((node) => {
    node.textContent = `${completed} из ${effectiveTotal} шагов пройдено`;
  });

  document.querySelectorAll("[data-quiz-status]").forEach((node) => {
    node.textContent = state.quizScore === null ? "Тест еще не пройден" : "Тест пройден";
  });

  document.querySelectorAll("[data-quiz-score]").forEach((node) => {
    node.textContent = state.quizScore === null ? "Последний результат: нет данных" : `Последний результат: ${state.quizScore}%`;
  });
}

function renderCourseHub() {
  const toc = document.getElementById("course-toc");
  const chaptersRoot = document.getElementById("course-chapters");
  if (!toc || !chaptersRoot || !window.courseData) return;

  const state = loadState();
  const doneSet = new Set(state.chapterDone || []);

  toc.innerHTML = "";
  chaptersRoot.innerHTML = "";

  window.courseData.chapters.forEach((chapter) => {
    const tocLink = document.createElement("a");
    tocLink.href = `#${chapter.id}`;
    tocLink.innerHTML = `<strong>${chapter.number}</strong><span>${chapter.title}</span>`;
    toc.appendChild(tocLink);

    const article = document.createElement("article");
    article.className = "panel chapter-card";
    article.id = chapter.id;

    const theoryHtml = chapter.theory.length
      ? `<div class="chapter-block"><h3>Ключевые принципы</h3><ul class="clean-list">${chapter.theory.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
      : "";

    const stepsHtml = chapter.steps.length
      ? `<div class="chapter-block"><h3>Этапы</h3><ol>${chapter.steps.map((item) => `<li>${item}</li>`).join("")}</ol></div>`
      : "";

    const mediaHtml = chapter.media.length
      ? `<div class="media-grid">${chapter.media.map((item) => `
          <article class="media-slot">
            <span class="media-slot__type">${item.type}</span>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </article>
        `).join("")}</div>`
      : "";

    article.innerHTML = `
      <div class="chapter-card__head">
        <div class="chapter-card__index">${chapter.number}</div>
        <div class="chapter-card__title">
          <h2>${chapter.title}</h2>
          <p>${chapter.summary}</p>
        </div>
        <div class="chapter-status">
          <span class="chapter-status__pill ${doneSet.has(chapter.id) ? "is-done" : ""}">
            ${doneSet.has(chapter.id) ? "Пройдено" : "Не пройдено"}
          </span>
          <button type="button" data-chapter-toggle="${chapter.id}">
            ${doneSet.has(chapter.id) ? "Снять отметку" : "Отметить пройденным"}
          </button>
        </div>
      </div>
      <div class="chapter-body">
        <div class="chapter-block">
          <h3>Смысл главы</h3>
          <p>${chapter.note}</p>
        </div>
        <div class="chapter-body__grid">
          ${theoryHtml}
          ${stepsHtml}
        </div>
        <div class="chapter-block">
          <h3>Мультимедиа материалы</h3>
          <p>Ниже предусмотрены слоты под фото, видео, схемы и дополнительные материалы.</p>
          ${mediaHtml}
        </div>
      </div>
    `;

    chaptersRoot.appendChild(article);
  });

  chaptersRoot.querySelectorAll("[data-chapter-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const chapterId = button.getAttribute("data-chapter-toggle");
      const nextState = loadState();
      const current = new Set(nextState.chapterDone || []);
      if (current.has(chapterId)) current.delete(chapterId);
      else current.add(chapterId);
      nextState.chapterDone = [...current];
      saveState(nextState);
      renderCourseHub();
      renderProgress();
      renderCourseProgress();
    });
  });

  const chapterLinks = [...toc.querySelectorAll("a")];
  const chapterCards = [...chaptersRoot.querySelectorAll(".chapter-card")];
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      chapterLinks.forEach((link) => {
        link.classList.toggle("is-current", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    { threshold: [0.2, 0.5, 0.8], rootMargin: "-20% 0px -55% 0px" }
  );

  chapterCards.forEach((card) => observer.observe(card));
}

function renderCourseProgress() {
  if (!window.courseData) return;
  const state = loadState();
  const completed = (state.chapterDone || []).length;
  const total = window.courseData.chapters.length;
  const percent = Math.round((completed / total) * 100);
  const degrees = Math.round((percent / 100) * 360);

  document.querySelectorAll("[data-course-percent]").forEach((node) => {
    node.textContent = `${percent}%`;
    const ring = node.closest(".progress-widget__ring");
    if (ring) {
      ring.style.background = `radial-gradient(circle closest-side, rgba(255, 249, 245, 0.95) 76%, transparent 77% 100%), conic-gradient(var(--accent) 0deg, var(--accent-2) ${degrees}deg, rgba(255,255,255,0.45) ${degrees}deg)`;
    }
  });

  document.querySelectorAll("[data-course-progress-text]").forEach((node) => {
    node.textContent = `${completed} из ${total} глав пройдено`;
  });
}

function setupNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    const [rawFile] = href.split("#");
    const file = (rawFile || "index.html").replace(".html", "").replace("index", "home");
    if ((page === "home" && href.startsWith("index.html#hero")) || file === page) {
      link.classList.add("is-active");
    }
  });

  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  if (!menuToggle || !siteNav) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("menu-open", isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });
}

function setupScrollProgress() {
  const bar = document.getElementById("scroll-progress-bar");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = `${progress}%`;
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function setupHomeVideoTimeline() {
  if (document.body.dataset.page !== "home") return;
  const video = document.getElementById("home-scroll-video");
  if (!video) return;

  let currentRate = 0.62;
  let targetRate = 0.62;
  let lastTick = 0;
  let lastScrollY = window.scrollY;
  let lastScrollTime = performance.now();
  let lastInteractionTime = lastScrollTime;
  let rafId = 0;
  let isReady = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const ensurePlayback = () => {
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  const syncFromScroll = () => {
    const now = performance.now();
    const deltaY = window.scrollY - lastScrollY;
    const deltaTime = Math.max(16, now - lastScrollTime);
    const screensPerSecond = Math.abs(deltaY) / Math.max(window.innerHeight, 1) / (deltaTime / 1000);

    if (Math.abs(deltaY) > 0.5) {
      lastInteractionTime = now;
    }

    targetRate = clamp(0.62 + screensPerSecond * 0.9, 0.62, 2.1);
    lastScrollY = window.scrollY;
    lastScrollTime = now;
  };

  const tick = (timestamp) => {
    rafId = requestAnimationFrame(tick);
    if (!isReady) return;

    if (!lastTick) lastTick = timestamp;
    const deltaTime = Math.min(0.05, (timestamp - lastTick) / 1000);
    lastTick = timestamp;

    const idleFor = timestamp - lastInteractionTime;
    const desiredRate = idleFor > 220 ? 0.62 : targetRate;
    const easing = 1 - Math.exp(-deltaTime * 5.4);
    currentRate += (desiredRate - currentRate) * easing;

    if (Math.abs(video.playbackRate - currentRate) > 0.02) {
      video.playbackRate = currentRate;
    }
  };

  const markReady = () => {
    isReady = true;
    video.defaultPlaybackRate = 0.62;
    video.playbackRate = currentRate;
    ensurePlayback();
  };

  video.addEventListener("loadedmetadata", markReady, { once: true });
  video.addEventListener("canplay", markReady, { once: true });
  video.addEventListener("ended", () => {
    video.currentTime = 0;
    ensurePlayback();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      return;
    }
    ensurePlayback();
    if (!rafId) {
      lastScrollY = window.scrollY;
      lastScrollTime = performance.now();
      lastTick = 0;
      rafId = requestAnimationFrame(tick);
    }
  });

  window.addEventListener("pageshow", ensurePlayback);
  window.addEventListener("touchstart", ensurePlayback, { passive: true });
  window.addEventListener("scroll", syncFromScroll, { passive: true });
  window.addEventListener("resize", syncFromScroll);
  syncFromScroll();
  ensurePlayback();
  rafId = requestAnimationFrame(tick);
}

function setupRevealMotion() {
  const revealNodes = [...document.querySelectorAll(".reveal")];
  if (!revealNodes.length) return;

  const thresholds = [0, 0.12, 0.24, 0.4, 0.6, 0.8, 1];
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const progress = Math.max(0, Math.min(1, entry.intersectionRatio * 1.08));
        entry.target.style.setProperty("--reveal-progress", progress.toFixed(3));
        entry.target.classList.toggle("is-visible", progress > 0.14);
      });
    },
    {
      threshold: thresholds,
      rootMargin: "-4% 0px -6% 0px"
    }
  );

  revealNodes.forEach((node, index) => {
    node.style.setProperty("--reveal-progress", index === 0 ? "1" : "0");
    if (index === 0) node.classList.add("is-visible");
    observer.observe(node);
  });
}

function setupQuiz() {
  const quizForm = document.getElementById("quiz-form");
  const result = document.getElementById("quiz-result");
  const resetButton = document.getElementById("reset-progress");
  if (!quizForm || !result) return;

  quizForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = new FormData(quizForm);
    const required = ["q1", "q2", "q3", "q4", "q5"];
    if (required.some((key) => !answers.get(key))) {
      result.textContent = "Ответьте на все вопросы, чтобы получить результат.";
      return;
    }

    let points = 0;
    required.forEach((key) => {
      points += Number(answers.get(key));
    });

    const score = Math.round((points / required.length) * 100);
    const state = loadState();
    state.quizScore = score;
    saveState(state);
    result.textContent = score >= 75
      ? `Отлично. Ваш результат: ${score}%. База усвоена уверенно.`
      : `Ваш результат: ${score}%. Стоит еще раз пройти сложные блоки и повторить практику.`;
    renderProgress();
  });

  resetButton?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    quizForm.reset();
    result.textContent = "Прогресс и результат теста сброшены.";
    const currentPage = document.body.dataset.page;
    markVisited(currentPage);
    renderProgress();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = document.body.dataset.page;
  markVisited(currentPage);
  setupNav();
  setupScrollProgress();
  setupHomeVideoTimeline();
  setupRevealMotion();
  renderCourseHub();
  setupQuiz();
  renderProgress();
  renderCourseProgress();
});
