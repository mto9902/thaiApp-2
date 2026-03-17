const demoData = {
  thai: {
    label: "Keystone Thai",
    stages: [
      {
        type: "study",
        badge: "Study",
        title: "Read the pattern",
        prompt: "กำลัง + VERB",
        blurb: "Use กำลัง before a verb to show an action happening right now.",
        sentence: "ฉันกำลังอ่านหนังสือ",
        roman: "chan kamlang an nangsue",
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
        options: [
          {
            thai: "เรากำลังกินข้าวตอนนี้",
            roman: "rao kamlang kin khao tonni",
            translation: "We are eating rice now.",
            note: "Ongoing action happening now",
            correct: true,
          },
          {
            thai: "เราจะกินข้าวตอนนี้",
            roman: "rao ja kin khao tonni",
            translation: "We will eat rice now.",
            note: "Future marker changes the meaning",
            correct: false,
          },
          {
            thai: "เขากำลังกินข้าวตอนนี้",
            roman: "khao kamlang kin khao tonni",
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

function setupPracticeDemo() {
  const root = document.querySelector("#exercise-demo");
  const tabs = Array.from(document.querySelectorAll("[data-demo-language]"));
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
            <button
              class="audio-demo button-ghost"
              type="button"
              data-audio-text="${stage.audioText}"
              data-audio-lang="${stage.audioLang}"
            >
              Play audio
            </button>
          </div>
        </div>

        <div class="demo-info-bar">
          <div>
            <span class="demo-label">Grammar point</span>
            <strong>${stage.prompt}</strong>
          </div>
        </div>

        <div class="sentence-card demo-sentence-card">
          <div class="thai">${stage.sentence}</div>
          <div class="roman">${stage.roman}</div>
          <div class="translation">${stage.translation}</div>
        </div>

        <div class="word-chip-row">
          ${stage.breakdown
            .map(
              (item) => `
                <div class="word-chip">
                  <strong>${item.word}</strong>
                  <span>${item.meaning}</span>
                </div>
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
            <button
              class="audio-demo button-ghost"
              type="button"
              data-audio-text="${stage.audioText}"
              data-audio-lang="${stage.audioLang}"
            >
              Play audio
            </button>
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
                <button
                  class="${classes.join(" ")}"
                  type="button"
                  data-choice-index="${index}"
                >
                  <div class="choice-marker">${String.fromCharCode(65 + index)}</div>
                  <div class="choice-copy">
                    <strong>${option.thai}</strong>
                    <span class="choice-roman">${option.roman}</span>
                    <span class="choice-translation">${option.translation}</span>
                  </div>
                  <div class="choice-note">${option.note || "Compare the structure carefully."}</div>
                </button>
              `;
            })
            .join("")}
        </div>

        <div class="demo-support-grid">
          <div class="demo-support-card">
            <span class="demo-label">Focus</span>
            <strong>Look for the grammar cue, not just shared vocabulary.</strong>
            <p>Check tense, subject, and pattern before you commit to a sentence.</p>
          </div>
          <div class="demo-support-card">
            <span class="demo-label">Hint</span>
            <strong>Only one sentence matches the translation exactly.</strong>
            <p>The distractors stay close on purpose so the real structure stands out.</p>
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
            <button
              class="audio-demo button-ghost"
              type="button"
              data-audio-text="${stage.audioText}"
              data-audio-lang="${stage.audioLang}"
            >
              Play audio
            </button>
          </div>
        </div>

        <div class="demo-info-bar">
          <div>
            <span class="demo-label">Translation</span>
            <strong>${stage.translation}</strong>
          </div>
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
    const target = event.target.closest("button");
    if (!target) return;

    if (target.classList.contains("demo-next")) {
      advanceStage();
      return;
    }

    if (target.classList.contains("demo-continue")) {
      advanceStage();
      return;
    }

    const stage = getStage();

    if (stage.type === "choose" && target.hasAttribute("data-choice-index")) {
      if (state.locked) return;
      const index = Number(target.getAttribute("data-choice-index"));
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

    if (stage.type === "build" && target.hasAttribute("data-build-index")) {
      if (state.locked) return;
      const index = Number(target.getAttribute("data-build-index"));
      const option = stage.options[index];
      if (!option || state.buildSelected.includes(option.word)) return;
      if (state.buildSelected.length >= stage.answer.length) return;
      state.buildSelected = [...state.buildSelected, option.word];
      render();
      return;
    }

    if (
      stage.type === "build" &&
      target.hasAttribute("data-remove-build-index")
    ) {
      if (state.locked) return;
      const index = Number(target.getAttribute("data-remove-build-index"));
      if (!state.buildSelected[index]) return;
      state.buildSelected = state.buildSelected.filter((_, item) => item !== index);
      render();
      return;
    }

    if (stage.type === "build" && target.classList.contains("demo-check")) {
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
    const panel = item.querySelector(".faq-panel");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");

      items.forEach((other) => {
        other.classList.remove("active");
        const otherPanel = other.querySelector(".faq-panel");
        if (otherPanel) {
          otherPanel.style.maxHeight = "0px";
        }
      });

      if (!isOpen) {
        item.classList.add("active");
        panel.style.maxHeight = `${panel.scrollHeight}px`;
      }
    });
  });
}

function setupAudioDemo() {
  if (!("speechSynthesis" in window)) return;

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".audio-demo");
    if (!button) return;

    const text = button.getAttribute("data-audio-text");
    const lang = button.getAttribute("data-audio-lang") || "en-US";
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.92;

    document
      .querySelectorAll(".audio-demo.playing")
      .forEach((item) => item.classList.remove("playing"));

    button.classList.add("playing");
    utterance.onend = () => button.classList.remove("playing");
    utterance.onerror = () => button.classList.remove("playing");

    window.speechSynthesis.speak(utterance);
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

document.addEventListener("DOMContentLoaded", () => {
  setupPracticeDemo();
  setupFaq();
  setupAudioDemo();
  setupNav();
});
