// Initialize variables
let data = [];
let currentQuestionIndex = 0;
let missedQuestions = [];
let reviewingMissedQuestions = false;
let reviewIndex = 0;

function retrieveDataFile(date) {
    const [month, day, year] = date.split('/');
    const yearMonth = `20${year}${month}`;
    const fileName = `data/${yearMonth}/${yearMonth}${day}.txt`;

    fetch(fileName)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No data file found for the entered date: ${date}`);
            }
            return response.text();
        })
        .then(text => {
            if (!text.trim()) {
                throw new Error(`The data file for ${date} exists but is empty.`);
            }
            data = text.trim().split('\n').map((line, index) => {
                const fields = line.split('\t');
                console.log(`Line ${index + 1}:`, line); // Log raw line
                if (fields.length < 4) {
                    console.warn("Malformed line:", line);
                    return { key: "", category: "", question: line, answer: "", image: null };
                }
                const [key, category, question, answer, ...rest] = fields;
                const image = rest.length > 0 ? rest.join('\t').trim() : null;
                return { key, category, question, answer, image };
            });

            currentQuestionIndex = 0;
            missedQuestions = [];
            reviewingMissedQuestions = false;
            document.getElementById('error-message').textContent = '';
            displayQuestion();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('error-message').textContent = error.message;
        });
}

// Display today's date in the input field as default
const today = new Date();
const smallerFormattedDate = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
document.getElementById('date-input').value = smallerFormattedDate;
retrieveDataFile(smallerFormattedDate);

document.getElementById('date-input').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const enteredDate = document.getElementById('date-input').value.trim();
        const datePattern = /^\d{2}\/\d{2}\/\d{2}$/;
        if (!datePattern.test(enteredDate)) {
            document.getElementById('error-message').textContent = 'Invalid date format. Use MM/DD/YY.';
            return;
        }

        const [month, day, year] = enteredDate.split('/').map(Number);
        const parsedDate = new Date(`20${year}`, month - 1, day);
        if (
            parsedDate.getFullYear() !== 2000 + year ||
            parsedDate.getMonth() !== month - 1 ||
            parsedDate.getDate() !== day
        ) {
            document.getElementById('error-message').textContent = 'Invalid date. Please enter a real calendar date.';
            return;
        }

        document.getElementById('error-message').textContent = '';
        retrieveDataFile(enteredDate);
    }
});

function displayQuestion() {
    const currentQuestion = reviewingMissedQuestions ? missedQuestions[reviewIndex] : data[currentQuestionIndex];
    console.log("Current Question:", currentQuestion);
    
    document.getElementById("title").textContent = "Roger That: Picture Trivia";
    document.getElementById('category').textContent = currentQuestion.category || "";
    // Escape HTML to debug raw string, then set innerHTML
    const questionText = `${currentQuestion.key || ""}. ${currentQuestion.question || ""}`;
    console.log("Question Text:", questionText);
    document.getElementById('question').innerHTML = questionText;
    document.getElementById('answer').innerHTML = currentQuestion.answer || "";
    document.getElementById('answer').style.display = 'none';

    const showAnswerButton = document.getElementById('show-answer');
    showAnswerButton.innerHTML = "Show Answer";
    showAnswerButton.disabled = false;
    showAnswerButton.style.backgroundColor = "#4caf50";
    showAnswerButton.style.color = "white";

    const imageElement = document.getElementById('flashcard-image');
    if (currentQuestion.image) {
        imageElement.src = `images/202504/${currentQuestion.image}`;
        imageElement.style.display = "block";
    } else {
        imageElement.style.display = "none";
    }

    document.getElementById('response-buttons').style.display = reviewingMissedQuestions ? 'none' : 'block';
    document.getElementById('next-review').style.display = reviewingMissedQuestions ? 'block' : 'none';
    document.getElementById('review-button').style.display = 'none';
}

function showAnswer() {
    const showAnswerButton = document.getElementById('show-answer');
    showAnswerButton.innerHTML = document.getElementById('answer').innerHTML || "No answer available";
    showAnswerButton.disabled = true;
    showAnswerButton.style.backgroundColor = "white";
    showAnswerButton.style.color = "black";
}

function recordAnswer(knewIt) {
    if (!knewIt) {
        missedQuestions.push(data[currentQuestionIndex]);
    }

    currentQuestionIndex++;

    if (currentQuestionIndex >= data.length) {
        if (missedQuestions.length > 0) {
            document.getElementById('review-button').style.display = 'block';
            document.getElementById('category').style.display = 'none';
            document.getElementById('question').style.display = 'none';
            document.getElementById('response-buttons').style.display = 'none';
        } else {
            showExerciseDone();
        }
    } else {
        displayQuestion();
    }
}

function goToLastQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    } else {
        console.log('Already at the first question.');
    }
}

function startReview() {
    reviewingMissedQuestions = true;
    reviewIndex = 0;
    document.getElementById('category').style.display = 'block';
    document.getElementById('question').style.display = 'block';
    document.getElementById('response-buttons').style.display = 'none';
    document.getElementById('next-review').style.display = 'block';
    document.getElementById('review-button').style.display = 'none';
    displayQuestion();
}

function nextReviewQuestion() {
    reviewIndex++;
    if (reviewIndex >= missedQuestions.length) {
        showExerciseDone();
    } else {
        displayQuestion();
    }
}

function showExerciseDone() {
    document.getElementById('next-review').style.display = 'none';
    const flashcardDiv = document.querySelector('.flashcard');

    const doneBox = document.createElement('div');
    doneBox.textContent = `Exercise Done! You had ${missedQuestions.length} review questions.`;
    doneBox.style.fontSize = "1.2em";
    doneBox.style.marginTop = "20px";
    doneBox.style.padding = "10px";
    doneBox.style.border = "1px solid #ccc";
    doneBox.style.borderRadius = "8px";
    doneBox.style.backgroundColor = "#e0f7fa";
    doneBox.style.color = "#00796b";
    
    flashcardDiv.appendChild(doneBox);
}
