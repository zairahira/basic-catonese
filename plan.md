# Product Specification — "Baby Cantonese"

*A minimal static web app for learning a handful of everyday Cantonese words.*

---

## 1. Overview

A single-page, static web app that displays a small, curated list of basic Cantonese words. Each word shows its English meaning, the Chinese characters, the **Jyutping** romanization, and offers **audio pronunciation**. The experience is built mobile-first with large type, generous spacing, slow smooth transitions, a dark interface, and almost no required interaction.

The goal is calm, glanceable learning — not a full course. A user should be able to open it, scroll, tap to hear a word, and absorb a few phrases without friction.

---

## 2. Goals & Non-Goals

**Goals**
- Present 12 essential Cantonese words clearly and beautifully.
- Show Jyutping for every word.
- Let the user hear each word's pronunciation.
- Feel effortless on a phone: big text, smooth motion, dark by default.

**Non-Goals**
- No accounts, login, or saved progress.
- No quizzes, spaced repetition, or gamification.
- No backend, database, or server-side logic (fully static).
- No tone-mark drills or character-writing practice.

---

## 3. Target Platform

- **Primary:** mobile web (portrait), modern iOS Safari and Android Chrome.
- **Secondary:** desktop browsers (layout simply centers in a narrow column).
- **Delivery:** static files (HTML / CSS / JS) hostable on any static host (GitHub Pages, Netlify, Vercel, S3, etc.). No build step required, though a bundler is optional.

---

## 4. Content — Word List

The full data set the app ships with. Characters and Jyutping should be verified by a native speaker before launch; some English glosses map to more than one common expression, noted below.

| # | English | Chinese | Jyutping | Notes |
|---|---------|---------|----------|-------|
| 1 | Hello | 你好 | nei5 hou2 | Standard greeting |
| 2 | Good morning | 早晨 | zou2 san4 | Everyday morning greeting |
| 3 | Good evening | 晚上好 | maan5 soeng6 hou2 | Less colloquial; included per request |
| 4 | Thank you | 多謝 | do1 ze6 | For gifts/favors. (唔該 *m4 goi1* is used for service.) |
| 5 | Welcome | 歡迎 | fun1 jing4 | "Welcome" as a greeting. (You're welcome = 唔使客氣 *m4 sai2 haak3 hei3*.) |
| 6 | Sorry | 對唔住 | deoi3 m4 zyu6 | Apology |
| 7 | Beautiful | 靚 | leng3 | Common colloquial form |
| 8 | Delicious | 好食 | hou2 sik6 | Lit. "good to eat" |
| 9 | Good night | 晚安 | maan5 on1 | Bedtime |
| 10 | Goodbye | 再見 | zoi3 gin3 | Standard farewell |
| 11 | Yes | 係 | hai6 | Affirmative ("it is") |
| 12 | No | 唔係 | m4 hai6 | Negative ("it is not") |

**Data structure** (suggested — one JSON array, inline or as a small `words.json`):

```json
[
  {
    "id": "hello",
    "english": "Hello",
    "chinese": "你好",
    "jyutping": "nei5 hou2",
    "audio": "audio/hello.mp3"
  }
]
```

---

## 5. Pronunciation / Audio

Two acceptable approaches; the spec recommends **A** for quality, with **B** as a zero-asset fallback.

- **A. Pre-recorded clips (recommended).** Ship one short audio file per word (`audio/<id>.mp3` or `.m4a`). Best fidelity and tone accuracy. ~12 small files.
- **B. Web Speech API (`SpeechSynthesis`).** No audio assets; uses the device voice. Set `utterance.lang = "zh-HK"`. Quality and availability vary by device, and many devices lack a Cantonese voice — treat as a graceful fallback only.

**Behavior**
- Tapping a word card plays its pronunciation.
- A small speaker icon on each card signals tappability.
- Only one clip plays at a time; tapping a new word stops the previous.
- If audio is unavailable (no file, no voice), the card still works visually — failure is silent and never blocks the UI.

---

## 6. Interface & Interaction

**Layout**
- Single vertically scrolling column, content centered, comfortable max-width (~480px) on larger screens.
- One **card per word**, stacked. Generous vertical spacing between cards.
- Each card shows, top to bottom: **English** (label, smaller, muted) → **Chinese characters** (largest) → **Jyutping** (medium) → speaker icon.

**Typography**
- Big, readable type. Chinese characters are the visual hero (roughly 2.5–3rem on mobile).
- High contrast against the dark background; Jyutping slightly muted so characters lead.

**Interactions (kept minimal)**
- **Tap a card → play pronunciation.** This is the only required interaction.
- Optional subtle press/active state on tap.
- No menus, modals, settings panels, or navigation. The whole app is one scroll.

**Motion**
- Slow, smooth transitions throughout (suggested 400–600ms, gentle `ease`/`ease-out`).
- Cards fade/slide in softly as they enter the viewport on first load or scroll.
- A subtle scale or glow on the tapped card while audio plays.
- Respect `prefers-reduced-motion`: disable entrance animations and shorten transitions when set.

---

## 7. Visual Design

- **Theme:** dark mode only (no toggle needed).
- **Background:** deep neutral (near-black, e.g. `#0e0e10`), optionally a faint vertical gradient.
- **Text:** off-white primary (`#f2f2f2`), muted gray for secondary labels (`#9a9a9a`).
- **Accent:** one calm accent color for the speaker icon and active state (e.g. a soft teal or warm amber).
- **Cards:** subtly raised — slightly lighter surface, soft rounded corners, gentle shadow or thin border.
- **Whitespace:** airy; the design should feel quiet, not dense.

---

## 8. Technical Requirements

- Pure static front end. Plain HTML/CSS/JS is sufficient; a light framework is optional, not required.
- All data either inline in JS or in a single `words.json`.
- No external network calls at runtime (except loading bundled audio assets).
- Works offline once loaded; a small service worker for offline caching is a nice-to-have, not required.
- Total payload kept small (target well under a few MB including audio).

**Suggested file structure**
```
/index.html
/styles.css
/app.js
/words.json        (optional; can be inline)
/audio/
   hello.mp3
   good-morning.mp3
   ...
```

---

## 9. Accessibility

- Meets contrast guidance against the dark background.
- Cards are keyboard-focusable and activate audio on Enter/Space.
- Speaker control has an accessible label (e.g. `aria-label="Play pronunciation: Hello"`).
- Honors `prefers-reduced-motion`.
- Logical heading/reading order for screen readers.

---

## 10. Acceptance Criteria

1. All 12 words render, each showing English, Chinese, and Jyutping.
2. Tapping any card plays that word's pronunciation (or fails silently if audio is unavailable).
3. Layout is comfortable and legible on a typical phone in portrait with no horizontal scroll.
4. Interface is dark; text is large and high-contrast.
5. Transitions are slow and smooth, and are reduced/disabled under `prefers-reduced-motion`.
6. App loads as static files with no backend and no runtime API dependency (beyond bundled audio).

---

## 11. Future Enhancements (out of scope for v1)

- More words / categories.
- Optional tone-color coding on Jyutping.
- Favorite or "learned" marking.
- Search or filter.
- A light theme toggle.