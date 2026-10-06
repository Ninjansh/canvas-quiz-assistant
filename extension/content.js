const processedQuestions = new WeakSet();

async function fetchAnswer(questionText, options = []) {
  try {
    const res = await fetch("http://127.0.0.1:8000/solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: questionText, options: options }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.answer;
  } catch (err) {
    return null;
  }
}

async function solveCanvasQuiz() {
  // Select only the innermost actual question card
  const rawQuestions = document.querySelectorAll(
    ".display_question, .quiz_sortable .question, .enhanced_question, [data-automation-id='quiz-item']"
  );

  for (const qEl of rawQuestions) {
    // 1. Guard against nested duplicates & re-runs
    if (processedQuestions.has(qEl) || qEl.querySelector(".dot-status") || qEl.querySelector(".dot-choice")) {
      continue;
    }

    // 2. Find the question text body
    const textContainer = qEl.querySelector(
      ".question_text, .text, .user_content, .question_prompt, [data-automation-id='question-prompt'], .item_body"
    );
    if (!textContainer) continue;

    let questionText = textContainer.innerText.trim();
    questionText = questionText.replace(/^Question\s+\d+[\s\S]*?(?=\b[A-Z가-힣]|\n)/i, "").trim();
    if (!questionText || questionText.length < 5) continue;

    // 3. Mark processed immediately BEFORE any async work
    processedQuestions.add(qEl);

    // 4. Target ONLY the top title element (never answers or inner divs)
    const headerTitle = qEl.querySelector(".name.question_name, .question_header, .header .name, .header") || textContainer;

    // Remove any accidental pre-existing status dot
    const oldDot = qEl.querySelector(".dot-status");
    if (oldDot) oldDot.remove();

    // 5. Create EXACTLY ONE subtle grey loading dot
    const statusDot = document.createElement("span");
    statusDot.className = "dot-status";
    const choiceDot = document.createElement("span");
    choiceDot.className = "dot-choice";
    choiceDot.style.cssText = `
    display: inline-block !important;
    width: 5px !important;
    height: 5px !important;
    border-radius: 50% !important;
    background-color: #10b981 !important;
    margin-left: 8px !important;
    position: relative !important;
    top: -1px !important;
    vertical-align: middle !important;
    float: right !important; /* Kept discreetly at the right edge of the answer card */
    `;
    headerTitle.appendChild(statusDot);

    // 6. Gather answer options
    const answerLabels = qEl.querySelectorAll(
      ".answer_label, .answer_text, .answer label, .select_answer label, [data-automation-id='answer-choice']"
    );
    const options = Array.from(answerLabels)
      .map((el) => el.innerText.trim())
      .filter((txt) => txt.length > 0);

    const answer = await fetchAnswer(questionText, options);

    if (answer && !answer.startsWith("Error:")) {
      // Remove loading dot
      statusDot.remove();

      const cleanAns = answer.toLowerCase().replace(/[^a-z0-9가-힣]/gi, "");
      let bestMatch = null;
      let highestOverlap = 0;

      for (const label of answerLabels) {
        const rawText = label.innerText.trim();
        const cleanLabel = rawText.toLowerCase().replace(/[^a-z0-9가-힣]/gi, "");
        if (!cleanLabel || !cleanAns) continue;

        if (cleanLabel === cleanAns || cleanLabel.includes(cleanAns) || cleanAns.includes(cleanLabel)) {
          bestMatch = label;
          break;
        }

        const isTrueMatch =
          (cleanAns.startsWith("true") || cleanAns.includes("참") || cleanAns === "o" || cleanAns.includes("맞")) &&
          (cleanLabel.startsWith("true") || cleanLabel.includes("참") || cleanLabel === "o" || cleanLabel.includes("맞"));

        const isFalseMatch =
          (cleanAns.startsWith("false") || cleanAns.includes("거짓") || cleanAns === "x" || cleanAns.includes("틀") || cleanAns.includes("아니")) &&
          (cleanLabel.startsWith("false") || cleanLabel.includes("거짓") || cleanLabel === "x" || cleanLabel.includes("틀") || cleanLabel.includes("아니"));

        if (isTrueMatch || isFalseMatch) {
          bestMatch = label;
          break;
        }

        let matches = 0;
        for (const char of cleanAns) {
          if (cleanLabel.includes(char)) matches++;
        }
        if (matches > highestOverlap && matches > cleanAns.length * 0.35) {
          highestOverlap = matches;
          bestMatch = label;
        }
      }

      // Place single green dot next to the correct choice
      if (bestMatch && !bestMatch.querySelector(".dot-choice")) {
        const choiceDot = document.createElement("span");
        choiceDot.className = "dot-choice";
        choiceDot.style.cssText = `
          display: inline-block !important;
          width: 5px !important;
          height: 5px !important;
          border-radius: 50% !important;
          background-color: #10b981 !important;
          margin-left: 6px !important;
          vertical-align: middle !important;
        `;
        bestMatch.appendChild(choiceDot);
      }
    } else {
      statusDot.style.backgroundColor = "#ef4444";
    }

    // 13s pacing delay between questions
    await new Promise((resolve) => setTimeout(resolve, 13000));
  }
}

solveCanvasQuiz();

let debounce;
const observer = new MutationObserver(() => {
  clearTimeout(debounce);
  debounce = setTimeout(solveCanvasQuiz, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });