// Fetch flashcards from a text file for the given date
const fetchFlashcards = async (date) => {
    console.log(`fetchFlashcards called with date: ${date}`);
    try {
      const normalizedDate = date.replace(/[^0-9-]/g, '');
      const [year, month, day] = normalizedDate.split('-');
      const yearMonth = `${year}${month}`;
      const fileDate = `${year}${month}${day}`;
      const url = `data/${yearMonth}/${fileDate}.txt`;
      console.log(`Fetching flashcards from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const text = await response.text();
      console.log(`Fetched data: ${text.substring(0, 100)}...`);
      if (!text.trim()) throw new Error('File is empty');
      const lines = text.split('\n').filter(line => line.trim());
      console.log(`Parsed ${lines.length} lines`);
      if (lines.length !== 24) throw new Error(`Expected 24 lines, got ${lines.length}`);
      const cards = [];
      for (let i = 0; i < lines.length; i += 6) {
        const cardLines = lines.slice(i, i + 6);
        const questions = cardLines.map((line, idx) => {
          const fields = line.split('\t');
          if (fields.length !== 7) throw new Error(`Invalid line format at index ${i + idx}`);
          const [date, index, topic, subTopic, question, answer, image] = fields;
          return { date, index, topic, subTopic, question, answer, image };
        });
        cards.push(questions);
      }
      console.log(`Parsed ${cards.length} cards`);
      return cards;
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      throw error;
    }
};

// State management
const appState = {
  cards: [],
  currentCardIndex: 0,
  currentQuestionIndex: 0, // Tracks the current question being answered
  displayedQuestions: [], // Tracks questions/answers shown
  currentDate: new Date().toISOString().split('T')[0],
};

// Render the current flashcard state
const renderFlashcard = () => {
  console.log(`renderFlashcard: card ${appState.currentCardIndex}, question ${appState.currentQuestionIndex}, displayedQuestions:`, appState.displayedQuestions.map(q => ({ qIndex: q.qIndex, showAnswer: q.showAnswer })));
  const container = document.getElementById('flashcard-container');
  if (!container) {
    console.error('flashcard-container not found');
    return;
  }
  if (!appState.cards.length) {
    container.innerHTML = '<p>No flashcards loaded.</p>';
    return;
  }
  const card = appState.cards[appState.currentCardIndex];
  const yearMonth = appState.currentDate.slice(0, 7).replace('-', '');

  // Build HTML
  let html = `
    <input type="text" id="date-input" value="${appState.currentDate}" />
    <div class="button-group">
      <button id="next-btn" ${appState.currentCardIndex === appState.cards.length - 1 ? 'disabled' : ''}>Next</button>
      <button id="last-btn" ${appState.currentCardIndex === 0 ? 'disabled' : ''}>Last</button>
    </div>
    <div class="card-number">Card ${appState.currentCardIndex + 1} of ${appState.cards.length}</div>
    <img src="images/${yearMonth}/${card[0].image}" alt="Flashcard image" class="flashcard-image" onerror="this.src='images/placeholder.png'" />
    <div class="qa-container">
  `;
  // Show button if we haven't displayed A6 yet
  const lastQuestion = appState.displayedQuestions[appState.displayedQuestions.length - 1];
  if (appState.currentQuestionIndex < 6 || (appState.currentQuestionIndex === 6 && !lastQuestion?.showAnswer)) {
    html += '<span id="show-answer-btn" class="show-answer-btn"></span>';
  }
  html += '<div class="qa-content">';
  appState.displayedQuestions.forEach((item) => {
    html += `
      <p><strong>Q${item.qIndex + 1}:</strong> ${item.question}</p>
      ${item.showAnswer ? `<p><strong>A${item.qIndex + 1}:</strong> ${item.answer}</p>` : ''}
      ${item.showAnswer && item.qIndex < 5 ? '<div style="height: 8px;"></div>' : ''}
    `;
  });
  html += '</div></div>';
  container.innerHTML = html;

  // Date input event listener
  document.getElementById('date-input').addEventListener('change', async (e) => {
    console.log(`Date changed to: ${e.target.value}`);
    appState.currentDate = e.target.value;
    appState.currentCardIndex = 0;
    appState.currentQuestionIndex = 0;
    appState.displayedQuestions = [];
    try {
      appState.cards = await fetchFlashcards(appState.currentDate);
      if (appState.cards.length > 0) {
        appState.displayedQuestions.push({
          qIndex: 0,
          question: appState.cards[0][0].question,
          answer: appState.cards[0][0].answer,
          showAnswer: false,
        });
      }
      renderFlashcard();
    } catch (error) {
      container.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });

  // Show Answer button event listener
  const showAnswerBtn = document.getElementById('show-answer-btn');
  if (showAnswerBtn) {
    showAnswerBtn.addEventListener('click', () => {
      console.log('Show Answer clicked, currentQuestionIndex:', appState.currentQuestionIndex);
      if (appState.displayedQuestions.length > 0) {
        // Show answer for the current question
        appState.displayedQuestions[appState.displayedQuestions.length - 1].showAnswer = true;
      }
      // Append next question only if we haven't reached Q6
      if (appState.currentQuestionIndex < 5) {
        const nextQuestionIndex = appState.currentQuestionIndex + 1;
        appState.displayedQuestions.push({
          qIndex: nextQuestionIndex,
          question: card[nextQuestionIndex].question,
          answer: card[nextQuestionIndex].answer,
          showAnswer: false,
        });
        appState.currentQuestionIndex++;
      } else if (appState.currentQuestionIndex === 5) {
        // After showing A6, increment to 6 to hide the button
        appState.currentQuestionIndex++;
      }
      console.log('After update, state:', {
        currentQuestionIndex: appState.currentQuestionIndex,
        displayedQuestions: appState.displayedQuestions.map(q => ({ qIndex: q.qIndex, showAnswer: q.showAnswer }))
      });
      renderFlashcard();
      container.scrollTop = container.scrollHeight;
    });
  }

  // Next and Last button event listeners
  const nextBtn = document.getElementById('next-btn');
  const lastBtn = document.getElementById('last-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      console.log('Next card clicked, currentCardIndex:', appState.currentCardIndex);
      if (appState.currentCardIndex < appState.cards.length - 1) {
        appState.currentCardIndex++;
        appState.currentQuestionIndex = 0;
        appState.displayedQuestions = [{
          qIndex: 0,
          question: appState.cards[appState.currentCardIndex][0].question,
          answer: appState.cards[appState.currentCardIndex][0].answer,
          showAnswer: false,
        }];
        renderFlashcard();
      }
    });
  }
  if (lastBtn) {
    lastBtn.addEventListener('click', () => {
      console.log('Last card clicked, currentCardIndex:', appState.currentCardIndex);
      if (appState.currentCardIndex > 0) {
        appState.currentCardIndex--;
        appState.currentQuestionIndex = 0;
        appState.displayedQuestions = [{
          qIndex: 0,
          question: appState.cards[appState.currentCardIndex][0].question,
          answer: appState.cards[appState.currentCardIndex][0].answer,
          showAnswer: false,
        }];
        renderFlashcard();
      }
    });
  }
};

// Initialize the app
const init = async () => {
  console.log('Initializing app');
  try {
    appState.cards = await fetchFlashcards(appState.currentDate);
    console.log('Flashcards loaded:', appState.cards);
    if (appState.cards.length > 0) {
      appState.displayedQuestions.push({
        qIndex: 0,
        question: appState.cards[0][0].question,
        answer: appState.cards[0][0].answer,
        showAnswer: false,
      });
    }
    renderFlashcard();
  } catch (error) {
    console.error('Initialization failed:', error);
    const container = document.getElementById('flashcard-container');
    if (container) container.innerHTML = `<p>Error: ${error.message}</p>`;
  }
};

// Run the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  init();
});