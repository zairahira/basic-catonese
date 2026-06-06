const WORDS = [
  { id: "hello",        english: "Hello",        chinese: "你好",   jyutping: "nei5 hou2" },
  { id: "good-morning", english: "Good morning", chinese: "早晨",   jyutping: "zou2 san4" },
  { id: "good-evening", english: "Good evening", chinese: "晚上好", jyutping: "maan5 soeng6 hou2" },
  { id: "thank-you",    english: "Thank you",    chinese: "多謝",   jyutping: "do1 ze6" },
  { id: "welcome",      english: "No problem",   chinese: "冇問題", jyutping: "mou5 man6 tai4" },
  { id: "sorry",        english: "Sorry",        chinese: "對唔住", jyutping: "deoi3 m4 zyu6" },
  { id: "beautiful",    english: "Very beautiful", chinese: "好靚",   jyutping: "hou2 leng3" },
  { id: "delicious",    english: "Delicious",    chinese: "好食",   jyutping: "hou2 sik6" },
  { id: "good-night",   english: "Good night",   chinese: "晚安",   jyutping: "maan5 on1" },
  { id: "goodbye",      english: "Goodbye",      chinese: "再見",   jyutping: "zoi3 gin3" },
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

// Speaker SVG icon
const SPEAKER_SVG = `<svg class="speaker-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
</svg>`;

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
  if (isSame) return; // second tap on same card stops it

  card.classList.add("playing");
  currentCard = card;

  // Try pre-recorded audio first
  const audio = new Audio(`audio/${word.id}.mp3`);
  audio.addEventListener("canplaythrough", () => {
    currentAudio = audio;
    audio.play().catch(() => fallbackSpeech(word, card));
  });
  audio.addEventListener("ended", () => {
    card.classList.remove("playing");
    if (currentCard === card) currentCard = null;
    currentAudio = null;
  });
  audio.addEventListener("error", () => {
    if (currentCard === card) fallbackSpeech(word, card);
  });

  // If canplaythrough doesn't fire quickly, treat as unavailable
  const timeout = setTimeout(() => {
    if (currentCard === card && !currentAudio) {
      fallbackSpeech(word, card);
    }
  }, 800);

  audio.addEventListener("canplaythrough", () => clearTimeout(timeout));
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

function buildCard(word) {
  const article = document.createElement("article");
  article.className = "card";
  article.tabIndex = 0;
  article.setAttribute("role", "button");
  article.setAttribute("aria-label", `Play pronunciation: ${word.english}`);

  article.innerHTML = `
    <div class="card-english">${word.english}</div>
    <div class="card-chinese" lang="zh-Hant">${word.chinese}</div>
    <div class="card-jyutping">${word.jyutping}</div>
    <div class="card-speaker" aria-hidden="true">
      ${SPEAKER_SVG}
    </div>
  `;

  const activate = () => playWord(word, article);
  article.addEventListener("click", activate);
  article.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  });

  return article;
}

function init() {
  const list = document.getElementById("word-list");
  const cards = WORDS.map(buildCard);
  cards.forEach((card) => list.appendChild(card));

  // Entrance animations via IntersectionObserver
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    cards.forEach((c) => c.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Stagger by DOM index
          const idx = cards.indexOf(entry.target);
          setTimeout(() => entry.target.classList.add("visible"), idx * 60);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  cards.forEach((card) => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", init);
