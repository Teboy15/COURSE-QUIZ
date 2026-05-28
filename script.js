/* =========================
   GLOBAL VARIABLES
========================= */

let courseData = {};

let courseKey =
    localStorage.getItem("selectedCourse");

let chapterKey =
    localStorage.getItem("selectedChapter");


/* =========================
   START QUIZ
========================= */

function startQuiz(course) {

    localStorage.setItem(
        "selectedCourse",
        course
    );

    localStorage.removeItem("selectedChapter");
    localStorage.removeItem("answers");
    localStorage.removeItem("endTime");

    window.location.href = "quiz.html";
}


/* =========================
   LOAD JSON
========================= */

if (document.getElementById("quizForm")) {

    fetch(`Data/${courseKey}.json`)
        .then(res => res.json())

        .then(data => {

            courseData = data;

            showChapterOrQuiz();

        })

        .catch(err => {

            console.error(err);

            document.getElementById("quizForm").innerHTML =
                "<h3>Error loading course data</h3>";
        });
}


/* =========================
   SHOW CHAPTER OR QUIZ
========================= */

function showChapterOrQuiz() {

    if (!chapterKey) {

        let html = `

            <h2>Select Chapter</h2>

            <div class="time-select">

                <label>Select Quiz Time:</label>

                <select id="quizTime">

                    <option value="5">
                        5 Minutes
                    </option>

                    <option value="10" selected>
                        10 Minutes
                    </option>

                    <option value="20">
                        20 Minutes
                    </option>

                    <option value="30">
                        30 Minutes
                    </option>

                    <option value="60">
                        1 Hour
                    </option>

                </select>

            </div>

        `;

        Object.keys(courseData)

            .sort((a, b) =>
                a.localeCompare(
                    b,
                    undefined,
                    { numeric: true }
                )
            )

            .forEach(key => {

                /* HIDE CHAPTER */
                if (courseData[key].active === false) {
                    return;
                }

                html += `
                    <button onclick="selectChapter('${key}')">

                        ${courseData[key].title}

                    </button>
                `;
            });

        document.getElementById("quizForm").innerHTML =
            html;

        return;
    }

    initQuiz();
}


/* =========================
   SELECT CHAPTER
========================= */

function selectChapter(chapter) {

    let selectedTime =
        document.getElementById("quizTime").value;

    localStorage.setItem(
        "quizDuration",
        selectedTime
    );

    localStorage.setItem(
        "selectedChapter",
        chapter
    );

    location.reload();
}


/* =========================
   QUIZ ENGINE
========================= */

function initQuiz() {

    let quizData =
        [...courseData[chapterKey].questions];

    /* =========================
       RANDOMIZE QUESTIONS
    ========================= */

    quizData =
        quizData.sort(() => Math.random() - 0.5);

    let currentQuestion = 0;

    let answers =
        JSON.parse(
            localStorage.getItem("answers")
        ) || {};

    /* =========================
       TIMER
    ========================= */

    let duration =
        Number(
            localStorage.getItem("quizDuration")
        ) || 10;

    let endTime =
        localStorage.getItem("endTime");

    if (!endTime) {

        endTime =
            Date.now() + duration * 60000;

        localStorage.setItem(
            "endTime",
            endTime
        );
    }

    function startTimer() {

        const timerInterval =
            setInterval(() => {

                let remaining =
                    endTime - Date.now();

                if (remaining <= 0) {

                    clearInterval(timerInterval);

                    alert("⏱️ Time is up!");

                    window.location.href =
                        "result.html";

                    return;
                }

                let m =
                    Math.floor(
                        remaining / 60000
                    );

                let s =
                    Math.floor(
                        (remaining % 60000) / 1000
                    );

                let timer =
                    document.getElementById("timer");

                if (timer) {

                    timer.innerHTML =
                        `⏱️ ${m}:${s < 10 ? "0" : ""}${s}`;
                }

            }, 1000);
    }

    startTimer();


    /* =========================
       QUESTION PANEL
    ========================= */

    function renderQuestionPanel() {

        let html =
            `<div class="question-panel">`;

        for (let i = 0; i < quizData.length; i++) {

            let answered =
                answers[`q${i}`]
                    ? "answered"
                    : "";

            let active =
                i === currentQuestion
                    ? "active"
                    : "";

            html += `
                <button
                    class="q-btn ${answered} ${active}"
                    data-index="${i}"
                >

                    ${i + 1}

                </button>
            `;
        }

        html += `</div>`;

        return html;
    }


    /* =========================
       LOAD QUESTION
    ========================= */

    function loadQuestion() {

        let q =
            quizData[currentQuestion];

        let html = `

            <div class="top-bar">

                <div id="timer"></div>

            </div>

            ${renderQuestionPanel()}

            <div class="progress">

                Question ${currentQuestion + 1}
                of ${quizData.length}

            </div>

            <div class="question">

                <p>${q.question}</p>

                ${q.image ? `
                    <img
                        src="${q.image}"
                        class="question-image"
                    >
                ` : ""}

        `;


        /* =========================
           MCQ QUESTIONS
        ========================= */

        if (q.type === "mcq") {

            for (let key in q.options) {

                html += `
                    <label class="option">

                        <input
                            type="radio"
                            name="answer"
                            value="${key}"

                            ${answers[`q${currentQuestion}`] === key
                                ? "checked"
                                : ""}

                        >

                        ${q.options[key]}

                    </label>
                `;
            }
        }


        /* =========================
           WRITTEN QUESTIONS
        ========================= */

        else if (q.type === "written") {

            html += `
                <textarea
                    name="writtenAnswer"
                    class="written-box"
                    placeholder="Write your answer here..."
                    rows="6"
                >${answers[`q${currentQuestion}`] || ""}</textarea>
            `;
        }

        html += `</div>`;


        /* =========================
           NAV BUTTONS
        ========================= */

        html += `
            <div class="nav-buttons">
        `;

        if (currentQuestion > 0) {

            html += `
                <button
                    type="button"
                    id="prevBtn"
                >
                    ⬅ Previous
                </button>
            `;
        }

        html += `
            <button
                type="button"
                id="nextBtn"
            >

                ${currentQuestion === quizData.length - 1
                    ? "Submit"
                    : "Next ➡"}

            </button>
        `;

        html += `</div>`;


        document.getElementById("quizForm").innerHTML =
            html;


        /* =========================
           QUESTION PANEL CLICK
        ========================= */

        document.querySelectorAll(".q-btn")

            .forEach(btn => {

                btn.onclick = function () {

                    currentQuestion =
                        parseInt(this.dataset.index);

                    loadQuestion();
                };
            });


        /* =========================
           NEXT BUTTON
        ========================= */

        document.getElementById("nextBtn").onclick =
            function () {

                /* MCQ */

                if (q.type === "mcq") {

                    let selected =
                        document.querySelector(
                            'input[name="answer"]:checked'
                        );

                    if (!selected) {

                        alert(
                            "Please select an answer"
                        );

                        return;
                    }

                    answers[`q${currentQuestion}`] =
                        selected.value;
                }


                /* WRITTEN */

                else if (q.type === "written") {

                    let text =
                        document.querySelector(
                            'textarea[name="writtenAnswer"]'
                        ).value;

                    if (!text.trim()) {

                        alert(
                            "Please write your answer"
                        );

                        return;
                    }

                    answers[`q${currentQuestion}`] =
                        text;
                }

                localStorage.setItem(
                    "answers",
                    JSON.stringify(answers)
                );

                currentQuestion++;

                if (
                    currentQuestion < quizData.length
                ) {

                    loadQuestion();
                }

                else {

                    window.location.href =
                        "result.html";
                }
            };


        /* =========================
           PREVIOUS BUTTON
        ========================= */

        if (currentQuestion > 0) {

            document.getElementById("prevBtn").onclick =
                function () {

                    currentQuestion--;

                    loadQuestion();
                };
        }
    }

    loadQuestion();
}