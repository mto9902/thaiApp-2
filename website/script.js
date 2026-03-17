const demoData = {
  thai: {
    label: "Keystone Thai",
    stages: [
      {
        type: "study",
        badge: "Study",
        level: "A1",
        title: "Read the pattern",
        prompt: "กำลัง + VERB",
        blurb: "Use กำลัง before a verb to show an action happening right now.",
        sentence: "ฉันกำลังอ่านหนังสือ",
        roman: "chǎn kamlang àan nǎngsue",
        translation: "I am reading a book.",
        audioText: "ฉันกำลังอ่านหนังสือ",
        audioLang: "th-TH",
        breakdown: [
          { word: "ฉัน", meaning: "I" },
          { word: "กำลัง", meaning: "in progress" },
          { word: "อ่าน", meaning: "read" },
          { word: "หนังสือ", meaning: "book" },
        ],
      },
      {
        type: "choose",
        badge: "Choose",
        title: "Pick the sentence that matches",
        prompt: 'Which sentence means "We are eating rice now"?',
        audioText: "เรากำลังกินข้าวตอนนี้",
        audioLang: "th-TH",
        focus: "Look for the ongoing-action marker before the verb.",
        hint: "The correct sentence keeps 'we' as the subject and stays in the present, not the future.",
        options: [
          {
            thai: "เรากำลังกินข้าวตอนนี้",
            roman: "rao kamlang kin khâao ton níi",
            translation: "We are eating rice now.",
            note: "Ongoing action happening now",
            correct: true,
          },
          {
            thai: "เราจะกินข้าวตอนนี้",
            roman: "rao jà kin khâao ton níi",
            translation: "We will eat rice now.",
            note: "Future marker changes the meaning",
            correct: false,
          },
          {
            thai: "เขากำลังกินข้าวตอนนี้",
            roman: "khǎo kamlang kin khâao ton níi",
            translation: "He is eating rice now.",
            note: "The subject changes from we to he",
            correct: false,
          },
        ],
      },
      {
        type: "build",
        badge: "Build",
        title: "Arrange the words",
        prompt: "Build: They are studying Korean.",
        translation: "They are studying Korean.",
        audioText: "พวกเขากำลังเรียนภาษาเกาหลี",
        audioLang: "th-TH",
        answer: ["พวกเขา", "กำลัง", "เรียน", "ภาษาเกาหลี"],
        options: [
          { word: "กำลัง", meaning: "in progress" },
          { word: "ภาษาเกาหลี", meaning: "Korean language" },
          { word: "พวกเขา", meaning: "they" },
          { word: "เรียน", meaning: "study" },
        ],
      },
    ],
  },
  japanese: {
    label: "Keystone Japanese",
    stages: [
      {
        type: "study",
        badge: "Study",
        level: "N4",
        title: "Read the pattern",
        prompt: "〜てしまう",
        blurb: "Use 〜てしまう for completion or when something happens unfortunately.",
        sentence: "宿題を忘れてしまった",
        roman: "shukudai o wasurete shimatta",
        translation: "I ended up forgetting my homework.",
        audioText: "宿題を忘れてしまった",
        audioLang: "ja-JP",
        breakdown: [
          { word: "宿題", meaning: "homework" },
          { word: "忘れて", meaning: "forgetting" },
          { word: "しまった", meaning: "ended up" },
        ],
      },
      {
        type: "choose",
        badge: "Choose",
        title: "Pick the sentence that matches",
        prompt: 'Which sentence means "I accidentally missed my train stop"?',
        audioText: "電車を乗り過ごしてしまいました",
        audioLang: "ja-JP",
        focus: "Look for the ending that signals accidental completion.",
        hint: "The right sentence is about missing the stop by mistake, not planning to ride or waiting for the train.",
        options: [
          {
            thai: "電車を乗り過ごしてしまいました",
            roman: "densha o norisugoshite shimaimashita",
            translation: "I accidentally missed my train stop.",
            note: "Accidental completion matches the prompt",
            correct: true,
          },
          {
            thai: "電車に乗るつもりでした",
            roman: "densha ni noru tsumori deshita",
            translation: "I was planning to take the train.",
            note: "States intention, not the accident",
            correct: false,
          },
          {
            thai: "電車を待っていました",
            roman: "densha o matte imashita",
            translation: "I was waiting for the train.",
            note: "Different action and different outcome",
            correct: false,
          },
        ],
      },
      {
        type: "build",
        badge: "Build",
        title: "Arrange the words",
        prompt: "Build: I ate the whole cake.",
        translation: "I ate the whole cake.",
        audioText: "ケーキを全部食べてしまった",
        audioLang: "ja-JP",
        answer: ["ケーキを", "全部", "食べて", "しまった"],
        options: [
          { word: "食べて", meaning: "ate" },
          { word: "しまった", meaning: "ended up" },
          { word: "ケーキを", meaning: "cake" },
          { word: "全部", meaning: "all" },
        ],
      },
    ],
  },
  korean: {
    label: "Keystone Korean",
    stages: [
      {
        type: "study",
        badge: "Study",
        level: "TOPIK 2",
        title: "Read the pattern",
        prompt: "-(으)려고 하다",
        blurb: "Use -(으)려고 하다 to show intention or a plan to do something.",
        sentence: "한국어를 더 열심히 공부하려고 해요",
        roman: "hangugeoreul deo yeolsimhi gongbuharyeogo haeyo",
        translation: "I plan to study Korean more seriously.",
        audioText: "한국어를 더 열심히 공부하려고 해요",
        audioLang: "ko-KR",
        breakdown: [
          { word: "한국어를", meaning: "Korean" },
          { word: "공부하려고", meaning: "intend to study" },
          { word: "해요", meaning: "do" },
        ],
      },
      {
        type: "choose",
        badge: "Choose",
        title: "Pick the sentence that matches",
        prompt: 'Which sentence means "I am going to meet a friend tomorrow"?',
        audioText: "내일 친구를 만나려고 해요",
        audioLang: "ko-KR",
        focus: "Look for the form that shows a plan or intention.",
        hint: "The correct sentence keeps tomorrow in the sentence and talks about something that has not happened yet.",
        options: [
          {
            thai: "내일 친구를 만나려고 해요",
            roman: "naeil chingureul mannaryeogo haeyo",
            translation: "I am going to meet a friend tomorrow.",
            note: "Shows intention or plan",
            correct: true,
          },
          {
            thai: "내일 친구를 만났어요",
            roman: "naeil chingureul mannasseoyo",
            translation: "I met a friend tomorrow.",
            note: "Past tense breaks the meaning",
            correct: false,
          },
          {
            thai: "친구가 내일 만나요",
            roman: "chinguga naeil mannayo",
            translation: "A friend meets tomorrow.",
            note: "Changes the subject and structure",
            correct: false,
          },
        ],
      },
      {
        type: "build",
        badge: "Build",
        title: "Arrange the words",
        prompt: "Build: I was going to sleep early.",
        translation: "I was going to sleep early.",
        audioText: "일찍 자려고 했어요",
        audioLang: "ko-KR",
        answer: ["일찍", "자려고", "했어요"],
        options: [
          { word: "했어요", meaning: "was going to" },
          { word: "일찍", meaning: "early" },
          { word: "자려고", meaning: "intend to sleep" },
        ],
      },
    ],
  },
};

const heroShowcaseData = {
  thai: {
    languageName: "Thai",
    pattern: "Ongoing action",
    sentence: "ฉันกำลังเรียนภาษาไทย",
    roman: "chǎn kamlang rian phaasǎa thai",
    translation: "I am studying Thai.",
    methodLabel: "Grammar lesson",
    audioText: "ฉันกำลังเรียนภาษาไทย",
    audioLang: "th-TH",
    words: [
      { word: "ฉัน", roman: "chǎn", meaning: "I" },
      { word: "กำลัง", roman: "kamlang", meaning: "in progress" },
      { word: "เรียน", roman: "rian", meaning: "study" },
      { word: "ภาษาไทย", roman: "phaasǎa thai", meaning: "Thai language" },
    ],
    choose: {
      prompt: "Which sentence means \"I am studying Thai\"?",
      options: [
        { text: "ฉันกำลังเรียนภาษาไทย", roman: "chǎn kamlang rian phaasǎa thai", correct: true },
        { text: "ฉันเรียนภาษาไทยแล้ว", roman: "chǎn rian phaasǎa thai láew", correct: false },
      ],
    },
    order: {
      prompt: "Build: \"I am studying Thai.\"",
      answer: ["ฉัน", "กำลัง", "เรียน", "ภาษาไทย"],
      chips: ["เรียน", "ภาษาไทย", "ฉัน", "กำลัง"],
    },
  },
  japanese: {
    languageName: "Japanese",
    pattern: "Accidental completion",
    sentence: "宿題を忘れてしまった",
    roman: "shukudai o wasurete shimatta",
    translation: "I ended up forgetting my homework.",
    methodLabel: "JLPT grammar",
    audioText: "宿題を忘れてしまった",
    audioLang: "ja-JP",
    words: [
      { word: "宿題を", roman: "shukudai o", meaning: "homework" },
      { word: "忘れて", roman: "wasurete", meaning: "forgetting" },
      { word: "しまった", roman: "shimatta", meaning: "ended up" },
    ],
    choose: {
      prompt: "Which sentence means \"I ended up forgetting my homework\"?",
      options: [
        { text: "宿題を忘れてしまった", roman: "shukudai o wasurete shimatta", correct: true },
        { text: "宿題を忘れていた", roman: "shukudai o wasurete ita", correct: false },
      ],
    },
    order: {
      prompt: "Build: \"I ended up forgetting my homework.\"",
      answer: ["宿題を", "忘れて", "しまった"],
      chips: ["しまった", "宿題を", "忘れて"],
    },
  },
  korean: {
    languageName: "Korean",
    pattern: "Intention / plan",
    sentence: "한국어를 더 열심히 공부하려고 해요",
    roman: "hangugeoreul deo yeolsimhi gongbuharyeogo haeyo",
    translation: "I plan to study Korean more seriously.",
    methodLabel: "TOPIK grammar",
    audioText: "한국어를 더 열심히 공부하려고 해요",
    audioLang: "ko-KR",
    words: [
      { word: "한국어를", roman: "hangugeoreul", meaning: "Korean" },
      { word: "더 열심히", roman: "deo yeolsimhi", meaning: "more seriously" },
      { word: "공부하려고", roman: "gongbuharyeogo", meaning: "intend to study" },
      { word: "해요", roman: "haeyo", meaning: "do" },
    ],
    choose: {
      prompt: "Which sentence means \"I plan to study Korean more seriously\"?",
      options: [
        { text: "한국어를 더 열심히 공부하려고 해요", roman: "hangugeoreul deo yeolsimhi gongbuharyeogo haeyo", correct: true },
        { text: "한국어를 열심히 공부했어요", roman: "hangugeoreul yeolsimhi gongbuhaesseoyo", correct: false },
      ],
    },
    order: {
      prompt: "Build: \"I plan to study Korean more seriously.\"",
      answer: ["한국어를", "더 열심히", "공부하려고", "해요"],
      chips: ["공부하려고", "해요", "한국어를", "더 열심히"],
    },
  },
};

function setupHeroShowcase() {
  const tabs = Array.from(document.querySelectorAll("[data-hero-language]"));
  const exerciseCards = Array.from(document.querySelectorAll("[data-hero-exercise]"));
  const exerciseEl = document.getElementById("hero-exercise");
  const heroInteractiveEl = document.querySelector(".hero-interactive");
  const heroInteractiveWrapEl = document.querySelector(".hero-interactive-wrap");

  if (!exerciseEl || !heroInteractiveEl || !heroInteractiveWrapEl || tabs.length === 0) return;

  let currentLanguage = "thai";
  let exerciseType = "order";
  let hasStarted = false;
  let revealedSet = new Set();
  let orderSelected = [];
  let locked = false;

  function playHeroAudio(text, lang) {
    const el = document.createElement("span");
    el.setAttribute("data-audio-text", text);
    el.setAttribute("data-audio-lang", lang);
    el.classList.add("audio-demo");
    el.style.display = "none";
    document.body.appendChild(el);
    // playAudioFromElement is in the global audio setup scope — trigger via click
    el.click();
    setTimeout(() => el.remove(), 5000);
  }

  function hideHeroAppPrompt() {
    const prompt = document.getElementById("hero-app-prompt");
    if (prompt) prompt.remove();
  }

  function showHeroAppPrompt(mode = "success") {
    hideHeroAppPrompt();

    const isRetry = mode === "retry";
    const kicker = isRetry ? "Not quite" : "Nice work";
    const title = isRetry
      ? "Keep practicing in the app"
      : "Continue learning in the app";
    const body = isRetry
      ? "Open Keystone to keep practicing with the full lesson flow."
      : "Open Keystone to keep going with the full lesson flow.";

    const prompt = document.createElement("div");
    prompt.id = "hero-app-prompt";
    prompt.className = "hero-app-prompt";
    prompt.innerHTML = `
      <div class="hero-app-prompt-card${isRetry ? " is-retry" : ""}">
        <div class="card-kicker">${kicker}</div>
        <strong>${title}</strong>
        <p>${body}</p>
        <div class="hero-app-prompt-actions">
          <a class="button" href="http://localhost:8081">Continue learning in app</a>
          <button class="button-secondary hero-app-dismiss" type="button">Close</button>
        </div>
      </div>
    `;

    heroInteractiveEl.appendChild(prompt);
  }

  function updateExerciseCards() {
    exerciseCards.forEach((card) => {
      card.classList.toggle("active", card.getAttribute("data-hero-exercise") === exerciseType);
    });
  }

  function updateLanguageTabs() {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-hero-language") === currentLanguage);
    });
  }

  function renderStart() {
    const nativeLabels = {
      thai: "ไทย",
      japanese: "日本語",
      korean: "한국어",
    };
    const previewLabels = {
      thai: "ฉันกำลังเรียน...",
      japanese: "勉強しています...",
      korean: "공부하고 있어요...",
    };

    exerciseEl.innerHTML = `
      <div class="hero-start-card">
        <div class="hero-start-question">What language are you learning?</div>
        <div class="hero-start-options">
          ${Object.entries(heroShowcaseData)
            .map(
              ([key, sample]) => `
              <button class="hero-start-option${key === currentLanguage ? " is-default" : ""}" type="button" data-start-language="${key}">
                <span class="hero-start-option-title">${sample.languageName}</span>
                <span class="hero-start-option-native">${nativeLabels[key] || ""}</span>
              </button>`,
            )
            .join("")}
        </div>
        <div class="hero-start-hint">Click a language to begin</div>
      </div>
    `;
  }

  // --- BREAKDOWN ---
  function renderBreakdown() {
    const sample = heroShowcaseData[currentLanguage];
    if (!sample) return;
    revealedSet = new Set();

    exerciseEl.innerHTML = `
      <div class="hero-words">${sample.words
        .map(
          (w, i) => `
          <button class="hero-word" type="button" data-word-index="${i}">
            <span class="hero-word-text">${w.word}</span>
            <div class="hero-word-reveal">
              <span class="hero-word-roman">${w.roman}</span>
              <span class="hero-word-meaning">${w.meaning}</span>
            </div>
          </button>`,
        )
        .join("")}</div>
      <div class="hero-translation-row">
        <span class="hero-translation-text" id="hero-translation">${sample.translation}</span>
        <button class="audio-demo audio-icon-button" type="button"
          aria-label="Play sample audio" title="Play sample audio"
          data-audio-text="${sample.audioText}" data-audio-lang="${sample.audioLang}">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 14h4l5 4V6L8 10H4z"></path>
            <path d="M16 9a5 5 0 0 1 0 6"></path>
            <path d="M18.5 6.5a8.5 8.5 0 0 1 0 11"></path>
          </svg>
        </button>
      </div>
      <div class="hero-progress-row">
        <div class="hero-progress-bar" id="hero-progress"></div>
        <span class="hero-progress-label" id="hero-progress-label">0 / ${sample.words.length} words</span>
      </div>
      <button class="hero-next-btn" type="button" id="hero-breakdown-next">Next →</button>
    `;
  }

  function handleBreakdownClick(e) {
    const nextBtn = e.target.closest("#hero-breakdown-next");
    if (nextBtn) {
      exerciseType = "choose";
      render();
      return;
    }

    const wordBtn = e.target.closest("[data-word-index]");
    if (!wordBtn) return;
    const index = Number(wordBtn.getAttribute("data-word-index"));
    wordBtn.classList.add("revealed");
    revealedSet.add(index);

    const sample = heroShowcaseData[currentLanguage];
    const word = sample.words[index];
    if (word) playHeroAudio(word.word, sample.audioLang);

    const total = sample.words.length;
    const done = revealedSet.size;
    const bar = document.getElementById("hero-progress");
    const label = document.getElementById("hero-progress-label");
    const trans = document.getElementById("hero-translation");

    if (bar) bar.style.setProperty("--progress", done / total);
    if (label) label.textContent = `${done} / ${total} words`;
    if (done === total && trans) trans.classList.add("revealed");
  }

  // --- CHOOSE ---
  function renderChoose() {
    const sample = heroShowcaseData[currentLanguage];
    if (!sample || !sample.choose) return;
    locked = false;

    exerciseEl.innerHTML = `
      <div class="hero-choose-prompt">${sample.choose.prompt}</div>
      <div class="hero-choose-options">${sample.choose.options
        .map(
          (opt, i) => `
          <button class="hero-choose-option" type="button" data-choose-index="${i}">
            <span class="hero-choose-option-text">${opt.text}</span>
            <span class="hero-choose-option-roman">${opt.roman}</span>
          </button>`,
        )
        .join("")}</div>
      <div class="hero-choose-feedback" id="hero-choose-feedback"></div>
    `;
  }

  function handleChooseClick(e) {
    const optBtn = e.target.closest("[data-choose-index]");
    if (!optBtn || locked) return;

    const sample = heroShowcaseData[currentLanguage];
    const index = Number(optBtn.getAttribute("data-choose-index"));
    const opt = sample.choose.options[index];
    const feedback = document.getElementById("hero-choose-feedback");

    playHeroAudio(opt.text, sample.audioLang);

    locked = true;
    const allOptions = exerciseEl.querySelectorAll("[data-choose-index]");
    allOptions.forEach((btn, i) => {
      const o = sample.choose.options[i];
      if (o.correct) btn.classList.add("is-correct");
      else if (i === index) btn.classList.add("is-wrong");
    });

    if (feedback) {
      if (opt.correct) {
        feedback.textContent = "Correct!";
        feedback.className = "hero-choose-feedback is-correct";
        showHeroAppPrompt();
      } else {
        feedback.textContent = "Not quite — try again.";
        feedback.className = "hero-choose-feedback is-wrong";
        locked = false;
        showHeroAppPrompt("retry");
      }
    }
  }

  // --- ORDER ---
  function renderOrder() {
    const sample = heroShowcaseData[currentLanguage];
    if (!sample || !sample.order) return;
    orderSelected = [];
    locked = false;

    exerciseEl.innerHTML = `
      <div class="hero-order-prompt">${sample.order.prompt}</div>
      <div class="hero-order-slots" id="hero-order-slots"></div>
      <div class="hero-order-chips" id="hero-order-chips">${sample.order.chips
        .map(
          (word, i) => `
          <button class="hero-order-chip" type="button" data-chip-index="${i}">${word}</button>`,
        )
        .join("")}</div>
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="hero-order-check" type="button" id="hero-order-check">Check</button>
        <div class="hero-order-feedback" id="hero-order-feedback"></div>
      </div>
    `;
  }

  function handleOrderClick(e) {
    const sample = heroShowcaseData[currentLanguage];
    if (!sample || !sample.order) return;

    const chip = e.target.closest("[data-chip-index]");
    const slot = e.target.closest(".hero-order-slot");
    const checkBtn = e.target.closest("#hero-order-check");

    if (locked) return;

    if (chip && !chip.classList.contains("used")) {
      const word = sample.order.chips[Number(chip.getAttribute("data-chip-index"))];
      orderSelected.push({ word, chipIndex: Number(chip.getAttribute("data-chip-index")) });
      chip.classList.add("used");
      playHeroAudio(word, sample.audioLang);
      refreshOrderSlots();
    }

    if (slot) {
      const slotIndex = Number(slot.getAttribute("data-slot-index"));
      const removed = orderSelected[slotIndex];
      orderSelected.splice(slotIndex, 1);
      const chips = exerciseEl.querySelectorAll("[data-chip-index]");
      if (removed && chips[removed.chipIndex]) {
        chips[removed.chipIndex].classList.remove("used");
      }
      refreshOrderSlots();
    }

    if (checkBtn) {
      const userAnswer = orderSelected.map((s) => s.word);
      const correct = JSON.stringify(userAnswer) === JSON.stringify(sample.order.answer);
      const feedback = document.getElementById("hero-order-feedback");
      const slotsEl = document.getElementById("hero-order-slots");

      if (correct) {
        if (feedback) {
          feedback.textContent = "Correct!";
          feedback.className = "hero-order-feedback is-correct";
        }
        if (slotsEl) slotsEl.classList.add("is-correct");
        locked = true;
        playHeroAudio(sample.audioText, sample.audioLang);
        showHeroAppPrompt();
      } else {
        if (feedback) {
          feedback.textContent = "Not quite — try again.";
          feedback.className = "hero-order-feedback is-wrong";
        }
        if (slotsEl) slotsEl.classList.add("is-wrong");
        showHeroAppPrompt("retry");
        setTimeout(() => {
          if (slotsEl) slotsEl.classList.remove("is-wrong");
        }, 600);
      }
    }
  }

  function refreshOrderSlots() {
    const slotsEl = document.getElementById("hero-order-slots");
    if (!slotsEl) return;
    slotsEl.innerHTML = orderSelected
      .map(
        (s, i) =>
          `<button class="hero-order-slot" type="button" data-slot-index="${i}">${s.word}</button>`,
      )
      .join("");
  }

  // --- DISPATCH ---
  const kickerText = {
    breakdown: "Tap each word to reveal its meaning",
    choose: "Pick the sentence that matches",
    order: "Put the words into the right order",
  };

  function render() {
    hideHeroAppPrompt();
    heroInteractiveWrapEl.classList.toggle("is-start", !hasStarted);

    if (!hasStarted) {
      tabs.forEach((tab) => tab.classList.remove("active"));
      exerciseCards.forEach((card) => card.classList.remove("active"));
      const kicker = document.getElementById("hero-kicker");
      if (kicker) kicker.textContent = "";
      renderStart();
      return;
    }

    updateLanguageTabs();
    updateExerciseCards();

    const kicker = document.getElementById("hero-kicker");
    if (kicker) kicker.textContent = kickerText[exerciseType] || "";

    if (exerciseType === "breakdown") renderBreakdown();
    else if (exerciseType === "choose") renderChoose();
    else if (exerciseType === "order") renderOrder();
  }

  exerciseEl.addEventListener("click", (e) => {
    const startBtn = e.target.closest("[data-start-language]");
    if (startBtn) {
      const language = startBtn.getAttribute("data-start-language");
      if (!language) return;
      currentLanguage = language;
      hasStarted = true;
      render();
      return;
    }

    if (exerciseType === "breakdown") handleBreakdownClick(e);
    else if (exerciseType === "choose") handleChooseClick(e);
    else if (exerciseType === "order") handleOrderClick(e);
  });

  heroInteractiveEl.addEventListener("click", (e) => {
    if (e.target.closest(".hero-app-dismiss")) {
      hideHeroAppPrompt();
    }
  });

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => {
      const language = tab.getAttribute("data-hero-language");
      if (!language) return;
      currentLanguage = language;
      hasStarted = true;
      render();
    });
  });

  exerciseCards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.getAttribute("data-hero-exercise");
      if (!type) return;
      exerciseType = type;
      hasStarted = true;
      render();
    });
  });

  render();
}

function setupPracticeDemo() {
  const root = document.querySelector("#exercise-demo");
  const tabs = Array.from(document.querySelectorAll("[data-demo-language]"));
  const demoCard = root?.closest(".demo-card");
  if (!root || tabs.length === 0) return;

  const state = {
    language: "thai",
    stageIndex: 0,
    selectedChoice: null,
    feedback: "",
    feedbackType: "",
    buildSelected: [],
    locked: false,
    timer: null,
  };

  function resetStageState() {
    state.selectedChoice = null;
    state.feedback = "";
    state.feedbackType = "";
    state.buildSelected = [];
    state.locked = false;
    if (state.timer) {
      window.clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function setLanguage(language) {
    state.language = language;
    state.stageIndex = 0;
    resetStageState();
    render();

    if (window.matchMedia("(max-width: 820px)").matches) {
      window.requestAnimationFrame(() => {
        (demoCard || root).scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  function advanceStage() {
    state.stageIndex =
      (state.stageIndex + 1) % demoData[state.language].stages.length;
    resetStageState();
    render();
  }

  function queueAdvance() {
    if (state.timer) {
      window.clearTimeout(state.timer);
    }
    state.timer = window.setTimeout(() => {
      advanceStage();
    }, 850);
  }

  function getStage() {
    return demoData[state.language].stages[state.stageIndex];
  }

  function renderAudioIconButton(text, lang, extraClass = "", label = "Play audio") {
    return `
      <button
        class="audio-demo audio-icon-button${extraClass ? ` ${extraClass}` : ""}"
        type="button"
        aria-label="${label}"
        title="${label}"
        data-audio-text="${text}"
        data-audio-lang="${lang}"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 9v6h4l5 4V5L8 9H4"></path>
          <path d="M16 8a5 5 0 0 1 0 8"></path>
          <path d="M18.5 5.5a8.5 8.5 0 0 1 0 13"></path>
        </svg>
      </button>
    `;
  }

  function renderStudyStage(stage) {
    return `
      <div class="demo-stage">
        <div class="demo-stage-header">
          <div>
            <div class="card-kicker">${stage.badge}</div>
            <h3>${stage.title}</h3>
            <p>${stage.blurb}</p>
          </div>
          <div class="demo-stage-tools">
            <div class="demo-counter">${state.stageIndex + 1} / ${demoData[state.language].stages.length}</div>
          </div>
        </div>

        <div class="demo-point-row">
          <div class="demo-level-badge" aria-label="Difficulty ${stage.level}">
            ${stage.level}
          </div>
          <div class="demo-info-bar">
            <div class="demo-info-copy">
              <span class="demo-label">Grammar point</span>
              <strong>${stage.prompt}</strong>
            </div>
          </div>
        </div>

        <div
          class="sentence-card demo-sentence-card audio-card"
          data-audio-text="${stage.audioText}"
          data-audio-lang="${stage.audioLang}"
        >
          <div class="sentence-card-top">
            <span class="demo-label">Sentence</span>
            ${renderAudioIconButton(stage.audioText, stage.audioLang, "sentence-audio-button", "Play sentence audio")}
          </div>
          <div class="thai">${stage.sentence}</div>
          <div class="roman">${stage.roman}</div>
          <div class="translation">${stage.translation}</div>
        </div>

        <div class="word-chip-row">
          ${stage.breakdown
            .map(
              (item) => `
                <button
                  class="word-chip audio-chip"
                  type="button"
                  data-audio-text="${item.word}"
                  data-audio-lang="${stage.audioLang}"
                >
                  <strong>${item.word}</strong>
                  <span>${item.meaning}</span>
                </button>
              `,
            )
            .join("")}
        </div>

        <div class="demo-actions">
          <button class="button demo-continue" type="button">Got It</button>
          <button class="button-secondary demo-next" type="button">Next exercise</button>
        </div>
      </div>
    `;
  }

  function renderChooseStage(stage) {
    return `
      <div class="demo-stage demo-stage--choose">
        <div class="demo-stage-header">
          <div>
            <div class="card-kicker">${stage.badge}</div>
            <h3>${stage.title}</h3>
            <p>${stage.prompt}</p>
          </div>
          <div class="demo-stage-tools">
            <div class="demo-counter">${state.stageIndex + 1} / ${demoData[state.language].stages.length}</div>
          </div>
        </div>

        <div class="choice-list">
          ${stage.options
            .map((option, index) => {
              const classes = ["choice-card"];
              if (state.selectedChoice === index && option.correct) {
                classes.push("is-correct");
              } else if (state.selectedChoice === index && !option.correct) {
                classes.push("is-wrong");
              }

              return `
                <div
                  class="${classes.join(" ")}"
                  data-choice-index="${index}"
                  role="button"
                  tabindex="0"
                >
                  <div class="choice-card-top">
                    <div class="choice-marker">${String.fromCharCode(65 + index)}</div>
                    ${renderAudioIconButton(option.thai, stage.audioLang, "choice-audio-button", "Play choice audio")}
                  </div>
                  <div class="choice-copy">
                    <strong>${option.thai}</strong>
                    <span class="choice-roman">${option.roman}</span>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>

        <div class="demo-support-grid">
          <div class="demo-support-card">
            <span class="demo-label">Focus</span>
            <strong>${stage.focus}</strong>
            <p>Use the pattern itself to narrow down the correct sentence.</p>
          </div>
          <div class="demo-support-card">
            <span class="demo-label">Hint</span>
            <strong>${stage.hint}</strong>
            <p>Match the subject, tense, and sentence meaning together.</p>
          </div>
        </div>

        <div class="demo-feedback ${state.feedbackType}">
          ${state.feedback || "Choose the sentence that matches the translation."}
        </div>

        <div class="demo-actions">
          <button class="button-secondary demo-next" type="button">Next exercise</button>
        </div>
      </div>
    `;
  }

  function renderBuildStage(stage) {
    return `
      <div class="demo-stage">
        <div class="demo-stage-header">
          <div>
            <div class="card-kicker">${stage.badge}</div>
            <h3>${stage.title}</h3>
            <p>${stage.prompt}</p>
          </div>
          <div class="demo-stage-tools">
            <div class="demo-counter">${state.stageIndex + 1} / ${demoData[state.language].stages.length}</div>
          </div>
        </div>

        <div class="demo-info-bar demo-info-bar--with-action">
          <div>
            <span class="demo-label">Translation</span>
            <strong>${stage.translation}</strong>
          </div>
          ${renderAudioIconButton(stage.audioText, stage.audioLang, "build-audio-button", "Play sentence audio")}
        </div>

        <div class="build-answer">
          ${stage.answer
            .map((slot, index) => {
              const selectedWord = state.buildSelected[index];
              return `
                <button
                  class="build-slot ${selectedWord ? "filled" : ""}"
                  type="button"
                  data-remove-build-index="${index}"
                >
                  ${selectedWord || "?"}
                </button>
              `;
            })
            .join("")}
        </div>

        <div class="build-chip-row">
          ${stage.options
            .map((option, index) => {
              const isUsed = state.buildSelected.includes(option.word);
              return `
                <button
                  class="build-chip ${isUsed ? "used" : ""}"
                  type="button"
                  data-build-index="${index}"
                  ${isUsed ? "disabled" : ""}
                >
                  <strong>${option.word}</strong>
                  <span>${option.meaning}</span>
                </button>
              `;
            })
            .join("")}
        </div>

        <div class="demo-feedback ${state.feedbackType}">
          ${state.feedback || "Build the sentence in the correct order."}
        </div>

        <div class="demo-actions">
          <button class="button demo-check" type="button">Check answer</button>
          <button class="button-secondary demo-next" type="button">Next exercise</button>
        </div>
      </div>
    `;
  }

  function render() {
    tabs.forEach((tab) => {
      tab.classList.toggle(
        "active",
        tab.getAttribute("data-demo-language") === state.language,
      );
    });

    const stage = getStage();

    if (stage.type === "study") {
      root.innerHTML = renderStudyStage(stage);
      return;
    }

    if (stage.type === "choose") {
      root.innerHTML = renderChooseStage(stage);
      return;
    }

    root.innerHTML = renderBuildStage(stage);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const language = tab.getAttribute("data-demo-language");
      if (!language || language === state.language) return;
      setLanguage(language);
    });
  });

  root.addEventListener("click", (event) => {
    if (event.target.closest(".audio-demo, .audio-card, .audio-chip")) {
      return;
    }

    const nextButton = event.target.closest(".demo-next");
    if (nextButton) {
      advanceStage();
      return;
    }

    const continueButton = event.target.closest(".demo-continue");
    if (continueButton) {
      advanceStage();
      return;
    }

    const stage = getStage();

    const choiceTarget =
      stage.type === "choose" ? event.target.closest("[data-choice-index]") : null;

    if (stage.type === "choose" && choiceTarget) {
      if (state.locked) return;
      const index = Number(choiceTarget.getAttribute("data-choice-index"));
      const choice = stage.options[index];
      state.selectedChoice = index;
      state.locked = true;

      if (choice.correct) {
        state.feedback = "Correct. Moving to the next exercise.";
        state.feedbackType = "is-correct";
        render();
        queueAdvance();
      } else {
        state.feedback = "Not quite. You can try again or move to the next exercise.";
        state.feedbackType = "is-wrong";
        state.locked = false;
        render();
      }

      return;
    }

    const buildAddTarget =
      stage.type === "build" ? event.target.closest("[data-build-index]") : null;

    if (stage.type === "build" && buildAddTarget) {
      if (state.locked) return;
      const index = Number(buildAddTarget.getAttribute("data-build-index"));
      const option = stage.options[index];
      if (!option || state.buildSelected.includes(option.word)) return;
      if (state.buildSelected.length >= stage.answer.length) return;
      state.buildSelected = [...state.buildSelected, option.word];
      render();
      return;
    }

    if (
      stage.type === "build" &&
      event.target.closest("[data-remove-build-index]")
    ) {
      if (state.locked) return;
      const removeTarget = event.target.closest("[data-remove-build-index]");
      const index = Number(removeTarget.getAttribute("data-remove-build-index"));
      if (!state.buildSelected[index]) return;
      state.buildSelected = state.buildSelected.filter((_, item) => item !== index);
      render();
      return;
    }

    const checkButton = event.target.closest(".demo-check");

    if (stage.type === "build" && checkButton) {
      if (state.locked) return;

      const isCorrect =
        stage.answer.length === state.buildSelected.length &&
        stage.answer.every((word, index) => state.buildSelected[index] === word);

      if (isCorrect) {
        state.locked = true;
        state.feedback = "Correct. Moving to the next exercise.";
        state.feedbackType = "is-correct";
        render();
        queueAdvance();
      } else {
        state.feedback = "The order is not right yet. Adjust the words or skip ahead.";
        state.feedbackType = "is-wrong";
        render();
      }
    }
  });

  render();
}

function setupFaq() {
  const items = Array.from(document.querySelectorAll(".faq-item"));

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;

    item.classList.remove("active");
    trigger.setAttribute("aria-expanded", "false");

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      items.forEach((other) => {
        other.classList.remove("active");
        const otherTrigger = other.querySelector(".faq-trigger");
        if (otherTrigger) {
          otherTrigger.setAttribute("aria-expanded", "false");
        }
      });

      if (!isOpen) {
        item.classList.add("active");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });
}

function setupAudioDemo() {
  const apiBase =
    document
      .querySelector('meta[name="keystone-api-base"]')
      ?.getAttribute("content")
      ?.trim() || "http://3.0.214.108:3000";
  const canUseSpeechSynthesis = "speechSynthesis" in window;
  const sharedAudio = new Audio();

  function clearPlaying() {
    document
      .querySelectorAll(".audio-demo.playing, .audio-card.playing, .audio-chip.playing")
      .forEach((item) => item.classList.remove("playing"));
  }

  async function playAudioFromElement(element) {
    const text = element.getAttribute("data-audio-text");
    const lang = element.getAttribute("data-audio-lang") || "en-US";
    if (!text) return;

    clearPlaying();
    element.classList.add("playing");

    try {
      if (canUseSpeechSynthesis) {
        window.speechSynthesis.cancel();
      }

      sharedAudio.pause();
      sharedAudio.currentTime = 0;

      const response = await fetch(`${apiBase}/tts/sentence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          languageCode: lang,
          speakingRate: 0.92,
          text,
        }),
      });

      if (!response.ok) {
        let detail = "";

        try {
          const errorData = await response.json();
          if (errorData && typeof errorData.error === "string") {
            detail = errorData.error;
          }
        } catch {
          try {
            detail = await response.text();
          } catch {
            detail = "";
          }
        }

        throw new Error(
          detail
            ? `Website sentence audio failed: ${response.status} - ${detail}`
            : `Website sentence audio failed: ${response.status}`,
        );
      }

      const data = await response.json();

      if (!data || typeof data.path !== "string") {
        throw new Error("Website sentence audio response was missing a file path");
      }

      sharedAudio.src = `${apiBase}${data.path}`;
      sharedAudio.onended = () => element.classList.remove("playing");
      sharedAudio.onerror = () => element.classList.remove("playing");
      await sharedAudio.play();
    } catch (err) {
      console.warn("[WebsiteAudio] Falling back to speech synthesis:", err);

      if (!canUseSpeechSynthesis) {
        element.classList.remove("playing");
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.92;
      utterance.onend = () => element.classList.remove("playing");
      utterance.onerror = () => element.classList.remove("playing");

      window.speechSynthesis.speak(utterance);
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".audio-demo, .audio-card, .audio-chip");
    if (!button) return;
    playAudioFromElement(button);
  });
}

function setupNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (!header || !toggle) return;

  toggle.addEventListener("click", () => {
    header.classList.toggle("open");
  });
}

function setupHomepageLoadPosition() {
  if (!document.querySelector(".hero")) return;

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }

  if (window.location.hash === "#sample-practice") {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", cleanUrl);
  }

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

function setupScreenshotLightbox() {
  const cards = Array.from(document.querySelectorAll(".screenshot-card"));
  const backdrop = document.getElementById("screenshot-lightbox");
  const image = document.getElementById("lightbox-image");
  const title = document.getElementById("lightbox-title");
  const description = document.getElementById("lightbox-description");
  const closeBtn = backdrop?.querySelector(".lightbox-close");

  if (!cards.length || !backdrop || !image || !title || !description || !closeBtn) return;

  function openFromCard(card) {
    const img = card.querySelector(".shot-image");
    const heading = card.querySelector("h3");
    const body = card.querySelector("p");
    if (!img || !heading || !body) return;

    image.src = img.getAttribute("src") || "";
    image.alt = img.getAttribute("alt") || heading.textContent || "";
    title.textContent = heading.textContent || "";
    description.textContent = body.textContent || "";
    backdrop.classList.add("is-open");
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    backdrop.classList.remove("is-open");
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => openFromCard(card));
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openFromCard(card);
    });
  });

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && backdrop.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupHomepageLoadPosition();
  setupHeroShowcase();
  setupPracticeDemo();
  setupFaq();
  setupAudioDemo();
  setupNav();
  setupScreenshotLightbox();
});
