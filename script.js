const COURSE_PAGES = ["home", "course", "route", "modules", "practice", "testing"];
const STORAGE_KEY = "maniikabinet-progress";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { visited: [], quizScore: null };
  } catch {
    return { visited: [], quizScore: null };
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

function setupNav() {
  const page = document.body.dataset.page;
  document.querySelectorAll(".site-nav a").forEach((link) => {
    const href = link.getAttribute("href");
    const file = href.replace(".html", "").replace("index", "home");
    if (file === page) link.classList.add("is-active");
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
  setupQuiz();
  renderProgress();
});
