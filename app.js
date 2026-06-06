const WORDS = [
  { id: "hello",        english: "Hello",        chinese: "你好",   jyutping: "nei5 hou2" },
  { id: "goodbye",      english: "Goodbye",      chinese: "再見",   jyutping: "zoi3 gin3" },
  { id: "good-morning", english: "Good morning", chinese: "早晨",   jyutping: "zou2 san4" },
  { id: "thank-you",    english: "Thank you",    chinese: "多謝",   jyutping: "do1 ze6" },
  { id: "sorry",        english: "Sorry",        chinese: "對唔住", jyutping: "deoi3 m4 zyu6" },
  { id: "beautiful",    english: "Very beautiful", chinese: "好靚", jyutping: "hou2 leng3" },
  { id: "good-evening", english: "Good evening", chinese: "晚上好", jyutping: "maan5 soeng6 hou2" },
  { id: "welcome",      english: "No problem",   chinese: "冇問題", jyutping: "mou5 man6 tai4" },
  { id: "delicious",    english: "Delicious",    chinese: "好食",   jyutping: "hou2 sik6" },
  { id: "good-night",   english: "Good night",   chinese: "晚安",   jyutping: "maan5 on1" },
  { id: "yes",          english: "Yes",          chinese: "係",     jyutping: "hai6" },
  { id: "no",           english: "No",           chinese: "唔係",   jyutping: "m4 hai6" },
  { id: "one",          english: "One",          chinese: "一",     jyutping: "jat1" },
  { id: "two",          english: "Two",          chinese: "二",     jyutping: "ji6" },
  { id: "three",        english: "Three",        chinese: "三",     jyutping: "saam1" },
  { id: "four",         english: "Four",         chinese: "四",     jyutping: "sei3" },
  { id: "five",         english: "Five",         chinese: "五",     jyutping: "ng5" },
  { id: "six",          english: "Six",          chinese: "六",     jyutping: "luk6" },
  { id: "seven",        english: "Seven",        chinese: "七",     jyutping: "cat1" },
  { id: "eight",        english: "Eight",        chinese: "八",     jyutping: "baat3" },
  { id: "nine",         english: "Nine",         chinese: "九",     jyutping: "gau2" },
  { id: "ten",          english: "Ten",          chinese: "十",     jyutping: "sap6" },
];

const GRIP_SVG = `<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" width="16" height="16">
  <circle cx="5" cy="3.5" r="1.5"/><circle cx="11" cy="3.5" r="1.5"/>
  <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
  <circle cx="5" cy="12.5" r="1.5"/><circle cx="11" cy="12.5" r="1.5"/>
</svg>`;

const SPEAKER_SVG = `<svg class="speaker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
</svg>`;

const CLOSE_SVG = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true" width="14" height="14">
  <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
</svg>`;

// Audio state
let currentAudio = null;
let currentCard = null;
let currentUtterance = null;

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentUtterance) {
    speechSynthesis.cancel();
    currentUtterance = null;
  }
  if (currentCard) {
    currentCard.classList.remove("playing");
    currentCard = null;
  }
}

function playWord(word, card) {
  const isSame = currentCard === card;
  stopCurrent();
  if (isSame) return;

  card.classList.add("playing");
  currentCard = card;

  let fellBack = false;
  const doFallback = () => {
    if (fellBack) return;
    fellBack = true;
    clearTimeout(timeout);
    if (currentCard === card) fallbackSpeech(word, card);
  };

  const audio = new Audio(`audio/${word.id}.mp3`);
  audio.addEventListener("canplaythrough", () => {
    clearTimeout(timeout);
    currentAudio = audio;
    audio.play().catch(doFallback);
  });
  audio.addEventListener("ended", () => {
    card.classList.remove("playing");
    if (currentCard === card) currentCard = null;
    currentAudio = null;
  });
  audio.addEventListener("error", doFallback);
  const timeout = setTimeout(doFallback, 800);
}

function fallbackSpeech(word, card) {
  if (!window.speechSynthesis) {
    card.classList.remove("playing");
    if (currentCard === card) currentCard = null;
    return;
  }
  const utterance = new SpeechSynthesisUtterance(word.chinese);
  utterance.lang = "zh-HK";
  utterance.rate = 0.85;
  utterance.onend = () => {
    card.classList.remove("playing");
    if (currentCard === card) currentCard = null;
    currentUtterance = null;
  };
  utterance.onerror = () => {
    card.classList.remove("playing");
    if (currentCard === card) currentCard = null;
    currentUtterance = null;
  };
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

// Persistence
function saveState(list) {
  const ids = [...list.querySelectorAll(".card")].map(c => c.dataset.id);
  const hidden = [...list.querySelectorAll(".card[hidden]")].map(c => c.dataset.id);
  localStorage.setItem("bc-order", JSON.stringify(ids));
  localStorage.setItem("bc-hidden", JSON.stringify(hidden));
}

function loadState() {
  try {
    return {
      order: JSON.parse(localStorage.getItem("bc-order") || "[]"),
      hidden: new Set(JSON.parse(localStorage.getItem("bc-hidden") || "[]")),
    };
  } catch {
    return { order: [], hidden: new Set() };
  }
}

function updateShowBtn(btn, list) {
  const count = list.querySelectorAll(".card[hidden]").length;
  btn.hidden = count === 0;
  btn.textContent = `Show ${count} hidden word${count === 1 ? "" : "s"}`;
}

// Card builder
function buildCard(word) {
  const article = document.createElement("article");
  article.className = "card";
  article.dataset.id = word.id;
  article.tabIndex = 0;
  article.setAttribute("aria-label", `Play pronunciation: ${word.english}`);

  article.innerHTML = `
    <div class="drag-handle" aria-hidden="true" title="Drag to reorder">${GRIP_SVG}</div>
    <div class="card-body">
      <div class="card-english">${word.english}</div>
      <div class="card-chinese" lang="zh-Hant">${word.chinese}</div>
      <div class="card-jyutping">${word.jyutping}</div>
      <div class="card-speaker" aria-hidden="true">${SPEAKER_SVG}</div>
    </div>
    <button class="hide-btn" aria-label="Hide ${word.english}" title="Hide">${CLOSE_SVG}</button>
  `;

  article.addEventListener("click", e => {
    if (e.target.closest(".drag-handle") || e.target.closest(".hide-btn")) return;
    playWord(word, article);
  });
  article.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      playWord(word, article);
    }
  });

  return article;
}

// Drag-to-reorder (pointer events - works on both mouse and touch)
function initDragSort(list) {
  list.addEventListener("pointerdown", e => {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return;
    const card = handle.closest(".card");
    if (!card) return;
    e.preventDefault();

    const rect = card.getBoundingClientRect();

    const ph = document.createElement("div");
    ph.className = "drag-placeholder";
    ph.style.height = rect.height + "px";
    card.after(ph);

    card.classList.add("is-dragging");
    card.style.cssText = `position:fixed;top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;z-index:1000;pointer-events:none;margin:0;`;

    const drag = { card, ph, offsetY: e.clientY - rect.top };

    const onMove = e => {
      drag.card.style.top = (e.clientY - drag.offsetY) + "px";

      const items = [...list.querySelectorAll(".card:not([hidden])")].filter(c => c !== drag.card);
      let before = null;
      for (const item of items) {
        const r = item.getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { before = item; break; }
      }
      before ? list.insertBefore(drag.ph, before) : list.appendChild(drag.ph);
    };

    const onUp = () => {
      drag.card.classList.remove("is-dragging");
      drag.card.style.cssText = "";
      drag.ph.replaceWith(drag.card);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      saveState(list);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });
}

// Init
function init() {
  const list = document.getElementById("word-list");
  const { order, hidden } = loadState();

  const wordMap = Object.fromEntries(WORDS.map(w => [w.id, w]));
  const allIds = [...new Set([...order, ...WORDS.map(w => w.id)])];
  const sorted = allIds.map(id => wordMap[id]).filter(Boolean);

  const showBtn = document.createElement("button");
  showBtn.className = "show-hidden-btn";
  showBtn.hidden = true;

  const cards = sorted.map(word => {
    const card = buildCard(word);

    card.querySelector(".hide-btn").addEventListener("click", e => {
      e.stopPropagation();
      card.hidden = true;
      saveState(list);
      updateShowBtn(showBtn, list);
    });

    if (hidden.has(word.id)) card.hidden = true;
    list.appendChild(card);
    return card;
  });

  const resetBtn = document.createElement("button");
  resetBtn.className = "reset-btn";
  resetBtn.textContent = "Reset view";

  list.after(resetBtn);
  list.after(showBtn);

  updateShowBtn(showBtn, list);

  showBtn.addEventListener("click", () => {
    list.querySelectorAll(".card[hidden]").forEach(c => c.hidden = false);
    saveState(list);
    updateShowBtn(showBtn, list);
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("bc-order");
    localStorage.removeItem("bc-hidden");
    list.querySelectorAll(".card[hidden]").forEach(c => c.hidden = false);
    const defaultOrder = WORDS.map(w => w.id);
    defaultOrder.forEach(id => {
      const card = list.querySelector(`.card[data-id="${id}"]`);
      if (card) list.appendChild(card);
    });
    updateShowBtn(showBtn, list);
  });

  initDragSort(list);

  // Entrance animations
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    cards.forEach(c => c.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = cards.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add("visible"), idx * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  cards.forEach(card => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", init);
