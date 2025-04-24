// app.js
// Function to fetch flashcards from a text file for the given date
const fetchFlashcards = async (date) => {
    console.log(`fetchFlashcards called with date: ${date}`);
    try {
      // Normalize date to YYYY-MM-DD and extract components
      const normalizedDate = date.replace(/[^0-9-]/g, '');
      const [year, month, day] = normalizedDate.split('-');
      const yearMonth = `${year}${month}`; // e.g., 202504
      const fileDate = `${year}${month}${day}`; // e.g., 20250424
      const url = `data/${yearMonth}/${fileDate}.txt`; // Relative path
      console.log(`Fetching flashcards from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }
      const text = await response.text();
      console.log(`Fetched data: ${text.substring(0, 100)}...`); // Log first 100 chars
      if (!text.trim()) {
        throw new Error('File is empty');
      }
      const lines = text.split('\n').filter(line => line.trim());
      console.log(`Parsed ${lines.length} lines`);
      if (lines.length !== 24) {
        throw new Error(`Expected 24 lines, got ${lines.length}`);
      }
      const cards = [];
      for (let i = 0; i < lines.length; i += 6) {
        const cardLines = lines.slice(i, i + 6);
        const questions = cardLines.map((line, idx) => {
          const fields = line.split('\t');
          if (fields.length !== 7) {
            throw new Error(`Invalid line format at index ${i + idx}: ${line}`);
          }
          const [date, index, topic, subTopic, question, answer, image] = fields;
          return { date, index, topic, subTopic, question, answer, image };
        });
        cards.push(questions); // Each card is an array of 6 question objects
      }
      console.log(`Parsed ${cards.length} cards`);
      return cards;
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      throw error;
    }
  };
  
  // State management for the app
  const appState = {
    cards: [], // Array of 4 cards (each with 6 questions)
    currentCardIndex: 0, // Current card (0 to 3)
    currentQuestionIndex: 0, // Current question within card (0 to 5)
    showAnswer: false, // Whether the answer is visible
    currentDate: new Date().toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
  };
  
  // Function to render the current flashcard state
  const renderFlashcard = () => {
    console.log(`renderFlashcard called: card ${appState.currentCardIndex}, question ${appState.currentQuestionIndex}, showAnswer: ${appState.showAnswer}`);
    const container = document.getElementById('flashcard-container');
    if (!container) {
      console.error('flashcard-container not found in DOM');
      return;
    }
    if (!appState.cards.length) {
      container.innerHTML = '<p>No flashcards loaded. Check console for errors or verify data file.</p>';
      return;
    }
    const card = appState.cards[appState.currentCardIndex];
    const question = card[appState.currentQuestionIndex];
    const yearMonth = appState.currentDate.slice(0, 7).replace('-', ''); // e.g., 202504
    const imagePath = `images/${yearMonth}/${question.image}`;
  
    // Build HTML for the current question
    let html = `
      <input type="text" id="date-input" value="${appState.currentDate}" />
      <img src="${imagePath}" alt="Flashcard image" style="max-width: 100%; height: auto;" onerror="this.src='images/placeholder.png'" />
      <p><strong>Q${appState.currentQuestionIndex + 1}:</strong> ${question.question}</p>
    `;
    if (appState.showAnswer) {
      html += `<p><strong>A${appState.currentQuestionIndex + 1}:</strong> ${question.answer}</p>`;
    }
  
    container.innerHTML = html;
    console.log('Container updated with HTML:', html.substring(0, 100) + '...');
  
    // Update button states
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const nextBtn = document.getElementById('next-btn');
    const lastBtn = document.getElementById('last-btn');
    if (showAnswerBtn) showAnswerBtn.disabled = appState.showAnswer;
    if (nextBtn) nextBtn.disabled = !appState.showAnswer;
    if (lastBtn) lastBtn.disabled = appState.currentCardIndex === 0 && appState.currentQuestionIndex === 0;
  };
  
  // Event handlers for buttons
  const setupEventListeners = () => {
    console.log('Setting up event listeners');
    const dateInput = document.getElementById('date-input');
    const showAnswerBtn = document.getElementById('show-answer-btn');
    const nextBtn = document.getElementById('next-btn');
    const lastBtn = document.getElementById('last-btn');
  
    if (dateInput) {
      dateInput.addEventListener('change', async (e) => {
        console.log(`Date input changed to: ${e.target.value}`);
        appState.currentDate = e.target.value;
        appState.currentCardIndex = 0;
        appState.currentQuestionIndex = 0;
        appState.showAnswer = false;
        try {
          appState.cards = await fetchFlashcards(appState.currentDate);
          renderFlashcard();
        } catch (error) {
          document.getElementById('flashcard-container').innerHTML = `<p>Error loading flashcards: ${error.message}</p>`;
        }
      });
    }
  
    if (showAnswerBtn) {
      showAnswerBtn.addEventListener('click', () => {
        console.log('Show Answer clicked');
        appState.showAnswer = true;
        renderFlashcard();
      });
    }
  
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        console.log('Next clicked');
        if (appState.currentQuestionIndex < 5) {
          appState.currentQuestionIndex++;
        } else if (appState.currentCardIndex < appState.cards.length - 1) {
          appState.currentCardIndex++;
          appState.currentQuestionIndex = 0;
        }
        appState.showAnswer = false;
        renderFlashcard();
      });
    }
  
    if (lastBtn) {
      lastBtn.addEventListener('click', () => {
        console.log('Last clicked');
        if (appState.currentQuestionIndex > 0) {
          appState.currentQuestionIndex--;
        } else if (appState.currentCardIndex > 0) {
          appState.currentCardIndex--;
          appState.currentQuestionIndex = 5;
        }
        appState.showAnswer = false;
        renderFlashcard();
      });
    }
  };
  
  // Initialize the app
  const init = async () => {
    console.log('Initializing app');
    try {
      appState.cards = await fetchFlashcards(appState.currentDate);
      console.log('Flashcards loaded:', appState.cards);
      renderFlashcard();
      setupEventListeners();
    } catch (error) {
      console.error('Initialization failed:', error);
      const container = document.getElementById('flashcard-container');
      if (container) {
        container.innerHTML = `<p>Error initializing app: ${error.message}</p>`;
      }
    }
  };
  
  // Run the app when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');
    init();
  });