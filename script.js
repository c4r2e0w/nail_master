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

  const scenes = [...document.querySelectorAll(".home-scene")];
  let currentFocus = Number(scenes[0]?.dataset.videoFocus || 16);
  let targetFocus = currentFocus;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");

  const ensurePlayback = () => {
    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  const applyScene = (scene) => {
    scenes.forEach((node) => node.classList.toggle("is-active", node === scene));
    targetFocus = Number(scene?.dataset.videoFocus || targetFocus);
  };

  const markReady = () => {
    video.defaultPlaybackRate = 1;
    video.playbackRate = 1;
    ensurePlayback();
  };

  video.addEventListener("loadedmetadata", markReady, { once: true });
  video.addEventListener("loadeddata", markReady, { once: true });
  video.addEventListener("canplay", markReady, { once: true });
  video.addEventListener("ended", () => {
    video.currentTime = 0;
    ensurePlayback();
  });
  video.addEventListener("pause", () => {
    if (!document.hidden) requestAnimationFrame(ensurePlayback);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      return;
    }
    ensurePlayback();
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (activeEntry) {
        applyScene(activeEntry.target);
      }
    },
    {
      threshold: [0.45, 0.6, 0.8],
      rootMargin: "-6% 0px -6% 0px"
    }
  );

  scenes.forEach((scene) => observer.observe(scene));
  if (scenes[0]) applyScene(scenes[0]);

  const animateFocus = () => {
    currentFocus += (targetFocus - currentFocus) * 0.08;
    video.style.setProperty("--video-focus-y", `${currentFocus.toFixed(2)}%`);
    requestAnimationFrame(animateFocus);
  };

  window.addEventListener("pageshow", ensurePlayback);
  window.addEventListener("scroll", ensurePlayback, { passive: true });
  window.addEventListener("touchstart", ensurePlayback, { passive: true });
  ensurePlayback();
  setInterval(() => {
    if (!document.hidden && video.paused) ensurePlayback();
  }, 1200);
  video.load();
  requestAnimationFrame(animateFocus);
}

function setupHomeHeaderRail() {
  if (document.body.dataset.page !== "home") return;

  const header = document.querySelector(".site-header");
  const rail = document.getElementById("scene-rail");
  const scenes = [...document.querySelectorAll(".home-scene[data-scene-title]")];
  if (!header || !rail || !scenes.length) return;

  rail.innerHTML = scenes
    .map((scene) => `<a href="#${scene.id || 'home-route'}" data-scene-link="${scene.id || 'home-route'}">${scene.dataset.sceneTitle}</a>`)
    .join("");

  const links = [...rail.querySelectorAll("[data-scene-link]")];
  let previousVisible = 0;
  let bloomTimer = null;
  let settleTimer = null;

  const updateHeader = () => {
    header.classList.toggle("is-condensed", window.scrollY > Math.max(80, window.innerHeight * 0.18));

    let currentScene = scenes[0];
    let visibleCount = 0;
    scenes.forEach((scene, index) => {
      const rect = scene.getBoundingClientRect();
      const isRead = rect.top <= window.innerHeight * 0.36;
      const link = links[index];
      if (!link) return;
      const wasVisible = link.classList.contains("is-visible");
      link.classList.toggle("is-visible", isRead);
      if (isRead) visibleCount += 1;

      if (!wasVisible && isRead) {
        link.scrollTop = 0;
      }

      if (rect.top <= window.innerHeight * 0.42 && rect.bottom >= window.innerHeight * 0.32) {
        currentScene = scene;
      }
    });

    if (visibleCount > previousVisible) {
      header.classList.add("is-blooming");
      header.classList.remove("is-settling");
      if (bloomTimer) clearTimeout(bloomTimer);
      bloomTimer = setTimeout(() => {
        header.classList.remove("is-blooming");
      }, 1100);
    } else if (visibleCount < previousVisible) {
      header.classList.add("is-settling");
      header.classList.remove("is-blooming");
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        header.classList.remove("is-settling");
      }, 1100);
    }
    previousVisible = visibleCount;

    links.forEach((link, index) => {
      link.classList.toggle("is-current", scenes[index] === currentScene);
    });

    const currentLink = links.find((link) => link.classList.contains("is-current"));
    if (currentLink && window.innerWidth <= 820) {
      const railRect = rail.getBoundingClientRect();
      const linkRect = currentLink.getBoundingClientRect();
      const isOutOfView = linkRect.left < railRect.left + 12 || linkRect.right > railRect.right - 12;
      if (isOutOfView) {
        currentLink.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
}

function setupRevealMotion() {
  if (document.body.dataset.page === "home") return;
  const revealNodes = [...document.querySelectorAll(".reveal")];
  if (!revealNodes.length) return;
  let ticking = false;

  const update = () => {
    ticking = false;
    const viewportHeight = window.innerHeight || 1;
    const focusLine = viewportHeight * 0.54;
    const travel = viewportHeight * 0.72;

    revealNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - focusLine);
      let progress = 1 - distance / travel;
      progress = Math.max(0, Math.min(1, progress));

      if (index === 0 && window.scrollY < viewportHeight * 0.15) {
        progress = 1;
      }

      node.style.setProperty("--reveal-progress", progress.toFixed(3));
      node.classList.toggle("is-visible", progress > 0.16);
    });
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  revealNodes.forEach((node, index) => {
    node.style.setProperty("--reveal-progress", index === 0 ? "1" : "0");
    if (index === 0) node.classList.add("is-visible");
  });

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
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
  setupHomeHeaderRail();
  setupRevealMotion();
  renderCourseHub();
  setupQuiz();
  renderProgress();
  renderCourseProgress();
});
