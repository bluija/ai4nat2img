import {
    finalizeBlockRandomization,
    firebaseUserId,
    writeRealtimeDatabase,
    writeURLParameters,
} from "./firebasepsych.js";

console.log(firebaseUserId);

/*
data saved as FirebaseID /
1. pid: Prolific URL parameters
2. exp: experiment-wide data
3. trial: trial data
*/

// constants
const cat1Sup = "Plants";
const cat2Sup = "Fungi";

const cat1Emj = "🌱";
const cat2Emj = "🍄";

const cat1Clr = "success";
const cat2Clr = "secondary";

const redirectURL = "https://app.prolific.com/submissions/complete?cc=C1P1YP97";
const numTrial = 60;

const studyId = "ai4nat2img";
const dbPath = studyId + "/participantData/" + firebaseUserId + "/";

const expData = {};

// variables
let isIntro;
let aiData;
let trialData;

let curTrial = 1;
let curScore = 0;

// consent
const consent = document.querySelector(".consent");
const consentCheckbox = document.querySelector(".consentCheckbox");
const startButton = document.querySelector(".startButton");

// experiment
const experiment = document.querySelector(".experiment");
const trial = document.querySelector(".trial");
const score = document.querySelector(".score");
const question = document.querySelector(".question");

const aiForm = document.querySelector(".aiForm");

const humanForm = document.querySelector(".humanForm");
const humanSubmit = document.querySelector(".humanSubmit");

const imageDisplay = document.querySelector(".imageDisplay");
const questionCat = document.querySelector(".questionCat");
const questionCnf = document.querySelector(".questionCnf");

// complete
const complete = document.querySelector(".complete");

const commentDisplay = document.querySelector(".commentDisplay");
const commentField = document.getElementById("commentField");
const commentSubmit = document.querySelector(".commentSubmit");

const redirectDisplay = document.querySelector(".redirectDisplay");
const redirectButton = document.querySelector(".redirectButton");

const catEmj = document.querySelectorAll(".catEmj");
const mainDisplay = document.querySelector(".mainDisplay");

// helpers
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const timePassed = () => Math.round(performance.now());

const getData = async (dataPath) => {
    try {
        const response = await fetch(dataPath);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(error.message);
    }
};

const displayTrial = (cat) => {
    if (cat === "Plants") {
        catEmj.forEach((emj) => (emj.textContent = cat1Emj));
        mainDisplay.classList.replace(`text-bg-${cat2Clr}`, `text-bg-${cat1Clr}`);

        imageDisplay.src =
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/330px-Rosa_rubiginosa_1.jpg";
        questionCat.textContent = `Rosa rubiginosa`;
    } else {
        console.assert(cat === "Fungi");

        catEmj.forEach((emj) => (emj.textContent = cat2Emj));
        mainDisplay.classList.replace(`text-bg-${cat1Clr}`, `text-bg-${cat2Clr}`);

        imageDisplay.src =
            "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Boletus_edulis_IT.jpg/500px-Boletus_edulis_IT.jpg";
        questionCat.textContent = `Boletus edulis`;
    }

    document.getElementById(`ai50`).checked = true;
};

const resetTrial = async () => {
    trialData = structuredClone(aiData[curTrial - 1]);
    trialData.startTime = timePassed();

    trialData.trial = curTrial;
    trialData.aiCnf = Math.round(trialData.aiCnf * 10) * 10;

    aiForm.reset();
    humanForm.reset();

    humanSubmit.disabled = true;

    if (trialData.cat === cat1Sup) {
        catEmj.forEach((emj) => (emj.textContent = cat1Emj));
        mainDisplay.classList.replace(`text-bg-${cat2Clr}`, `text-bg-${cat1Clr}`);
    } else {
        console.assert(trialData.cat === cat2Sup);

        catEmj.forEach((emj) => (emj.textContent = cat2Emj));
        mainDisplay.classList.replace(`text-bg-${cat1Clr}`, `text-bg-${cat2Clr}`);
    }

    questionCat.textContent = "Thinking...";
    imageDisplay.src = trialData.path;

    await sleep(1000);
    questionCat.textContent = trialData.aiAns;
    document.getElementById(`ai${trialData.aiCnf}`).checked = true;
};

// events
consentCheckbox.onchange = () => {
    startButton.disabled = !consentCheckbox.checked;
};

// onboarding
startButton.onclick = async () => {
    expData.startTime = Date.now();
    await writeRealtimeDatabase(dbPath + "/exp", expData);

    consent.classList.add("d-none");
    experiment.classList.remove("d-none");

    isIntro = true;
    displayTrial("Plants");

    const intro = introJs();

    intro
        .setOptions({
            exitOnEsc: false,
            exitOnOverlayClick: false,
            showBullets: false,
            keyboardNavigation: false,
            steps: [
                {
                    title: "Welcome",
                    intro:
                        "<p>We aim to study the way humans verify artificial intelligence (AI).</p>" +
                        "<p>Your results will help us design safer AI.</p>",
                },
                {
                    title: "Alert",
                    intro:
                        "<p><strong>Do not use any external AI</strong> in the experiment.</p>" +
                        "<p>Use only the provided AI.</p>",
                },
                {
                    title: "Objective",
                    element: question,
                    intro:
                        "<p>The AI will identify the species in the image.</p>" +
                        "<p>Your aim is to judge whether the AI is correct or wrong.</p>",
                },
                {
                    title: "Stimulus",
                    element: imageDisplay,
                    intro:
                        "<p>The image shown is photographed in the wild.</p>" +
                        "<p>It depicts a naturally occurring species.</p>",
                },
                {
                    title: "Organisms",
                    element: mainDisplay,
                    intro:
                        `<p>You'll verify the AI on 2 organisms: Plants 🌱 and Fungi 🍄.</p>` +
                        "<p>The interface will change to match the active category as you go.</p>",
                },
                {
                    title: "Plants 🌱",
                    element: mainDisplay,
                    intro: `<p>When the image is a Plant, 🌱 will be shown and the background will turn 🟩.</p>`,
                },
                {
                    title: "Fungi 🍄",
                    element: mainDisplay,
                    intro: `<p>When the image is a Fungus, 🍄 will be shown and the background will turn 🟫.</p>`,
                },
                {
                    title: "AI",
                    intro:
                        "<p>Note that the AI is trained on images taken in the lab rather than in the wild.</p>" +
                        "<p>Therefore, it may often be wrong.</p>",
                },
                {
                    title: "AI's Answer",
                    element: aiForm,
                    intro:
                        "<p>The AI will give you its answer and confidence.</p>" +
                        "<p>The AI's certainty is indicated by its confidence (between 0% and 100%).</p>",
                },
                {
                    title: "AI's Prediction",
                    element: questionCat,
                    intro:
                        "<p>The AI's species prediction is displayed as a scientific name.</p>",
                },
                {
                    title: "AI's Confidence",
                    element: questionCnf,
                    intro:
                        "<p>0% confidence means the AI is purely guessing; 100% means it is totally certain in its prediction.</p>",
                },
                {
                    title: "AI",
                    intro:
                        `<p>The AI is not equally trained on ${cat1Emj} and ${cat2Emj} images.</p>` +
                        "<p>Its accuracy and confidence may <strong>not</strong> be the same across the 2 categories.</p>",
                },
                {
                    title: "Judge",
                    element: humanForm,
                    intro:
                        "<p>Judge whether the AI's answer is correct or wrong.</p>" +
                        "<p>Then click Submit.</p>",
                },
                {
                    title: "Feedback",
                    intro:
                        "<p>Judge the AI correctly, and you will gain 1 point.</p>" +
                        "<p>If you are wrong, no points will be deducted.</p>",
                },
                {
                    title: "Bonus",
                    intro:
                        "<p>Every point earns you a $0.01 bonus.</p>" +
                        `<p>Get all ${numTrial} trials correct, and you will earn a total bonus of $${(numTrial * 0.01).toFixed(2)}!</p>`,
                },
                {
                    title: "Trial",
                    element: trial,
                    intro:
                        "<p>The progress will be shown on the top left.</p>" +
                        "<p>It shows the current trial / total trials.</p>",
                },
                {
                    title: "Score",
                    element: score,
                    intro:
                        "<p>Your score will be shown on the top right.</p>" +
                        "<p>It shows the correct trials / completed trials.</p>",
                },
                {
                    title: "Start",
                    intro: `<p>Let's begin the experiment. Earn up to $${(numTrial * 0.01).toFixed(2)} bonus!</p>`,
                },
                {
                    title: "Reminder",
                    intro:
                        "<p>Do not use any external AI.</p>" +
                        "<p>Use the provided <strong>AI's answer and its confidence level</strong> to decide if the AI is correct or wrong.</p>",
                },
                {
                    title: "Reminder",
                    intro: `<p>The AI's accuracy or confidence may <strong>not</strong> be the same on ${cat1Emj} and ${cat2Emj} images.</p>`,
                },
            ],
        })
        .onchange(() => {
            let step = intro.currentStep();

            if (step === 5) {
                displayTrial("Plants");
            } else if (step === 6) {
                displayTrial("Fungi");
            } else if (step === 7) {
                displayTrial("Plants");
            }
        })
        .oncomplete(() => {
            isIntro = false;
            resetTrial();
        })
        .start();
};

humanForm.oninput = () => {
    if (!isIntro) {
        humanSubmit.disabled = !humanForm.checkValidity();
    }
};

humanForm.onsubmit = async (event) => {
    trialData.humanTime = timePassed();
    event.preventDefault();


    let humanAns = document.querySelector(
        'input[name="humanAns"]:checked',
    ).value;
    trialData.humanAns = humanAns;

    let title;
    let descr;

    let aiCor = trialData.aiCor;
    let aiCorTxt = aiCor ? "correct" : "wrong";

    if ((aiCor && humanAns === "yes") || (!aiCor && humanAns === "no")) {
        curScore++;
        trialData.correct = true;

        title = "&#x2714; You're Correct!";
        descr =
            `<p>Yes, the AI was ${aiCorTxt}. Your score increased by 1!</p>` +
            `<p>Total bonus is $${(curScore / 100).toFixed(2)} &#127881;</p>`;
    } else {
        trialData.correct = false;

        title = "&#x2718; You're Wrong";
        descr = `<p>No, the AI was ${aiCorTxt}.</p>`;
    }

    score.textContent = `Score: ${curScore}/${curTrial} (${Math.round((curScore / curTrial) * 100)}%)`;
    trialData.endTime = timePassed();

    // console.log(trialData);
    await writeRealtimeDatabase(dbPath + "/trial/" + curTrial, trialData);

    introJs()
        .setOptions({
            exitOnEsc: false,
            exitOnOverlayClick: false,
            showBullets: false,
            keyboardNavigation: false,
            steps: [
                {
                    title: title,
                    intro: descr,
                },
            ],
        })
        .oncomplete(async () => {
            curTrial++;
            trial.textContent = `Trial: ${curTrial}/${numTrial} (${Math.round((curTrial / numTrial) * 100)}%)`;

            if (curTrial <= numTrial) {
                resetTrial();
            } else {
                expData.score = curScore;

                experiment.classList.add("d-none");
                complete.classList.remove("d-none");
            }
        })
        .start();

};

commentSubmit.onclick = async () => {
    expData.comment = commentField.value;
    expData.endTime = Date.now();

    await writeRealtimeDatabase(dbPath + "/exp", expData);
    console.log("Wrote to database");

    await finalizeBlockRandomization(studyId, "ai");

    commentDisplay.classList.add("d-none");
    redirectDisplay.classList.remove("d-none");

    await sleep(2000);
    window.location.replace(redirectURL);
};

redirectButton.onclick = () => {
    window.location.replace(redirectURL);
};

// initialize
writeURLParameters(dbPath + "/pid");

trial.textContent = `Trial: 1/${numTrial} (${Math.round((1 / numTrial) * 100)}%)`;
score.textContent = `Score: 0/0 (0%)`;

const data1Path = `data1.json`;
const data2Path = `data2.json`;

let data1 = await getData(data1Path);
let data2 = await getData(data2Path);

data1 = _.sampleSize(data1, numTrial / 2);
data2 = _.sampleSize(data2, numTrial / 2);

aiData = [...data1, ...data2];
console.log(aiData);
