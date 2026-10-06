/**
 * Canvas Quiz Assistant - Content Script
 * -------------------------------------------------------------
 * Parses Canvas quiz questions, queries the local FastAPI backend,
 * and renders subtle inline markers next to the identified answers.
 */

// Prevent duplicate processing across mutation events
const processedQuestions = new WeakSet();

/**
 * Sends extracted question prompt and choices to the local server.
 */
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

/**
 * Main quiz processing loop.
 */
async function solveCanvasQuiz() {
  // Matches question card containers across Classic and New Canvas Quizzes
  const rawQuestions = document.querySelectorAll(
    ".display_question, .quiz_sortable .question, .enhanced_question, [data-automation-id='quiz-item']"
  );

  for (const qEl of rawQuestions) {
    // 1. Guard against nested containers or already processed cards
    if (processedQuestions.has(qEl) || qEl.querySelector(".dot-status") || qEl.querySelector(".dot-choice")) {
      continue;
    }

    // 2. Locate the question prompt container
    const textContainer = qEl.querySelector(
      ".question_text, .text, .user_content, .question_prompt, [data-automation-id='question-prompt'], .item_body"
    );
    if (!textContainer) continue;

    let questionText = textContainer.innerText.trim();
    // Strip leading number headers (e.g. "Question 1") to leave only pure question text
    questionText = questionText.replace(/^Question\s+\d+[\s\S]*?(?=\b[A-Z가-힣]|\n)/i, "").trim();
    if (!questionText || questionText.length < 5) continue;

    // 3. Mark processed immediately to prevent concurrent triggers
    processedQuestions.add(qEl);

    // 4. Target the question title element strictly for the status dot
    const headerTitle = qEl.querySelector(".name.question_name, .question_header, .header .name, .header") || textContainer;

    // Clean up any stale loading dot
    const oldDot = qEl.querySelector(".dot-status");
    if (oldDot) oldDot.remove();

    // 5. Append single discreet grey loading dot next to question title
    const statusDot = document.createElement("span");
    statusDot.className = "dot-status";
    statusDot.style.cssText = `
      display: inline-block !important;
      width: 4px !important;
      height: 4px !important;
      border-radius: 50% !important;
      background-color: #9ca3af !important;
      margin-left: 6px !important;
      vertical-align: middle !important;
      opacity: 0.7 !important;
    `;
    headerTitle.appendChild(statusDot);

    // 6. Gather choice options
    const answerLabels = qEl.querySelectorAll(
      ".answer_label, .answer_text, .answer label, .select_answer label, [data-automation-id='answer-choice']"
    );
    const options = Array.from(answerLabels)
      .map((el) => el.innerText.trim())
      .filter((txt) => txt.length > 0);

    const answer = await fetchAnswer(questionText, options);

    if (answer && !answer.startsWith("Error:")) {
      // Remove grey loading dot once answer arrives
      statusDot.remove();

      const cleanAns = answer.toLowerCase().replace(/[^a-z0-9가-힣]/gi, "");
      let bestMatch = null;
      let highestOverlap = 0;

      for (const label of answerLabels) {
        const rawText = label.innerText.trim();
        const cleanLabel = rawText.toLowerCase().replace(/[^a-z0-9가-힣]/gi, "");
        if (!cleanLabel || !cleanAns) continue;

        // Exact or substring match
        if (cleanLabel === cleanAns || cleanLabel.includes(cleanAns) || cleanAns.includes(cleanLabel)) {
          bestMatch = label;
          break;
        }

        // Multilingual & Chrome-Translate True/False normalization
        const isTrueMatch =
          (cleanAns.startsWith("true") || cleanAns.includes("참") || cleanAns === "o" || cleanAns.includes("맞") || cleanAns.includes("really")) &&
          (cleanLabel.startsWith("true") || cleanLabel.includes("참") || cleanLabel === "o" || cleanLabel.includes("맞") || cleanLabel.includes("really"));

        const isFalseMatch =
          (cleanAns.startsWith("false") || cleanAns.includes("거짓") || cleanAns === "x" || cleanAns.includes("틀") || cleanAns.includes("아니") || cleanAns.includes("untruth")) &&
          (cleanLabel.startsWith("false") || cleanLabel.includes("거짓") || cleanLabel === "x" || cleanLabel.includes("틀") || cleanLabel.includes("아니") || cleanLabel.includes("untruth"));

        if (isTrueMatch || isFalseMatch) {
          bestMatch = label;
          break;
        }

        // Fuzzy character overlap match for slight phrasing changes
        let matches = 0;
        for (const char of cleanAns) {
          if (cleanLabel.includes(char)) matches++;
        }
        if (matches > highestOverlap && matches > cleanAns.length * 0.35) {
          highestOverlap = matches;
          bestMatch = label;
        }
      }

      // 7. Inject single green dot on the matching answer
      if (bestMatch && !bestMatch.querySelector(".dot-choice")) {
        const choiceDot = document.createElement("span");
        choiceDot.className = "dot-choice";
        choiceDot.style.cssText = `
          display: inline-block !important;
          width: 5px !important;
          height: 5px !important;
          border-radius: 50% !important;
          background-color: #10b981 !important;
          margin-left: 8px !important;
          vertical-align: middle !important;
          float: right !important;
        `;
        bestMatch.appendChild(choiceDot);
      }
    } else {
      // Turn red on failure
      statusDot.style.backgroundColor = "#ef4444";
    }

    // 13-second spacing to prevent hitting rate limits
    await new Promise((resolve) => setTimeout(resolve, 13000));
  }
}

// Initial run
solveCanvasQuiz();

// Re-run safely on dynamic question renders
let debounce;
const observer = new MutationObserver(() => {
  clearTimeout(debounce);
  debounce = setTimeout(solveCanvasQuiz, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });