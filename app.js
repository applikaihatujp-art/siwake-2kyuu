// app.js

let currentQuiz = {};
let lastQuizIndex = -1;
let score = 0;
let totalScore = 0;
let questionStartTime = 0;
let timeLeft = 60;
let maxTime = 60;
let timerInterval;

let inputStep = 0;
let selectedDr = "";

let wrongQuizzes = [];

let isProcessing = false; // 1. ファイル上部で定義

window.onload = function () {
  loadSettings();
  showHistoryUI();
};

function toggleSettingsMenu() {
  const group = document.getElementById("settings-group");
  group.classList.toggle("open");
}

function saveSettings() {
  const timeVal = document.getElementById("time-select").value;
  localStorage.setItem("time_setting", timeVal);
}

function loadSettings() {
  const savedTime = localStorage.getItem("time_setting");

  if (savedTime !== null)
    document.getElementById("time-select").value = savedTime;
}

function saveResultToHistory(finalScore, totalScore, settingTime) {
  let history = JSON.parse(localStorage.getItem("shiwake_history")) || [];
  history.unshift({
    score: finalScore,
    totalScore: totalScore,
    time: settingTime,
    date: new Date().toLocaleDateString("ja-JP"),
  });
  if (history.length > 5) history = history.slice(0, 5);
  localStorage.setItem("shiwake_history", JSON.stringify(history));
}

function showHistoryUI() {
  const historyList = document.getElementById("history-list");
  const history = JSON.parse(localStorage.getItem("shiwake_history")) || [];
  historyList.innerHTML = "";

  if (history.length === 0) {
    historyList.innerHTML =
      '<div class="history-empty">まだ履歴がありません</div>';
    return;
  }

  history.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "history-item";

    // 古いデータで総得点がない場合の安全対策
    const displayTotalScore =
      item.totalScore !== undefined ? item.totalScore : 0;

    itemEl.innerHTML = `
            <span>${index + 1}回前 (${item.time}秒)</span>
            <span style="color: #f1c40f; font-weight: bold; margin-right: 8px;">${displayTotalScore}点</span>
           <span>${item.score}問正解</span>

        `;
    historyList.appendChild(itemEl);
  });
}

function startGame() {
  maxTime = parseInt(document.getElementById("time-select").value, 10);

  document.getElementById("start-screen").classList.add("hide");
  document.getElementById("play-screen").classList.remove("hide");

  score = 0;
  timeLeft = maxTime;
  lastQuizIndex = -1;
  wrongQuizzes = [];

  document.getElementById("score").innerText = score;
  document.getElementById("timer").innerText = timeLeft;
  document.getElementById("timer").classList.remove("danger-time");
  document.getElementById("progress-bar").classList.remove("danger-bar");

  setupButtons();
  nextQuestion();
  updateTimerUI();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI();

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function setupButtons(index) {
  const container = document.getElementById("btn-container");
  container.innerHTML = "";

  const currentQuiz = quizData[index];

  // ここで安全確認！
  if (!currentQuiz || !currentQuiz.options) {
    console.error("エラー！データが見つかりません。インデックス: " + index);
    return;
  }

  container.className = "btn-container";

  // ここでシャッフル！
  const shuffledOptions = [...currentQuiz.options].sort(
    () => Math.random() - 0.5,
  );

  // 安定したデータを使って表示
  shuffledOptions.forEach((optText) => {
    const btn = document.createElement("button");
    btn.className = "opt-btn";
    btn.innerText = optText;
    btn.onclick = () => handleButtonClick(optText);
    container.appendChild(btn);
  });
}

function nextQuestion() {
  // データの総数を取得
  const totalQuizzes = quizData.length;

  // 5問正解するまで（0〜5点）は 0〜12番目、6問目以降（6点以上）は 13番目〜最後 から出題
  let minIndex, maxIndex;
  if (score < 5) {
    minIndex = 0;
    maxIndex = 13; // 13未満 = 12まで
  } else {
    minIndex = 13;
    maxIndex = totalQuizzes; // データの最大数まで
  }

  // 範囲内でランダムなインデックスを決定
  let newIndex = Math.floor(Math.random() * (maxIndex - minIndex)) + minIndex;

  // もし前回と同じ問題ならもう一度選び直す（簡易的な重複防止）
  if (totalQuizzes > 1) {
    while (newIndex === lastQuizIndex) {
      newIndex = Math.floor(Math.random() * (maxIndex - minIndex)) + minIndex;
    }
  }

  lastQuizIndex = newIndex;
  currentQuiz = quizData[newIndex];

  // ★【ここに追加】新しい問題が表示された瞬間の時間を記録する
  questionStartTime = Date.now();
  // --- ここにリセット処理を追加 ---
  selectedDr = "";
  selectedCr = "";
  inputStep = 0; // 入力ステップも最初の状態に戻す

  // 表示更新
  document.getElementById("question-box").innerText = currentQuiz.q;
  setupButtons(newIndex);
  updateNavUI(); // これを呼ぶことで画面の表示も「入力待ち」に更新されます
}

function handleButtonClick(selectedText) {
  // 2. 処理中なら即座にストップ
  if (isProcessing) return;

  if (inputStep === 0) {
    selectedDr = selectedText;
    inputStep = 1;
    updateNavUI();
  } else if (inputStep === 1) {
    // 3. ここで処理開始フラグを立てる
    isProcessing = true;

    const selectedCr = selectedText;

    if (selectedDr === currentQuiz.dr && selectedCr === currentQuiz.cr) {
      score++;
      document.getElementById("score").innerText = score;

      // --- ① 基礎点数の計算 ---
      // 5問目までの正解は10点、6問目以降の正解は15点
      // （※この正解でscoreが1〜5なら10点、6以上なら15点）
      const basePoints = score <= 5 ? 10 : 15;

      // --- ② スピードボーナスの計算 ---
      // 問題が表示されてからの経過秒数を計算する
      const elapsedSeconds = (Date.now() - questionStartTime) / 1000;
      const speedBonus = calculateSpeedBonus(elapsedSeconds);

      // 総合点数に加算
      totalScore += basePoints + speedBonus;
      console.log(
        `今回の獲得点数: 基礎${basePoints}点 + スピード${speedBonus}点 = 合計${basePoints + speedBonus}点 (累計: ${totalScore}点)`,
      );

      // ★【ここに追加】画面上の「score」の数字を更新する
      document.getElementById("totalScore").innerText = totalScore;

      // 正解数（score）に応じてボーナスタイムを切り替え
      // 5問正解までは1秒、6問目以降は2秒
      const rewardTime = score <= 5 ? 1 : 2;

      timeLeft += rewardTime;
      if (timeLeft > maxTime) timeLeft = maxTime;
      updateTimerUI();
      flashScreen("correct");
    } else {
      timeLeft -= 1;
      if (timeLeft < 0) timeLeft = 0;
      updateTimerUI();
      flashScreen("wrong");

      if (!wrongQuizzes.some((item) => item.q === currentQuiz.q)) {
        wrongQuizzes.push(currentQuiz);
      }
    }

    // 4. 次の問題への移動を少しだけ遅らせて、その後にフラグを解除
    setTimeout(() => {
      nextQuestion();
      inputStep = 0;
      isProcessing = false; // 処理完了
    }, 150); // 0.15秒の余韻
  }
}

function calculateSpeedBonus(elapsedSeconds) {
  if (elapsedSeconds <= 2) return 5;
  if (elapsedSeconds <= 4) return 4;
  if (elapsedSeconds <= 6) return 3;
  if (elapsedSeconds <= 8) return 2;
  if (elapsedSeconds <= 10) return 1;
  return 0; // 10秒オーバーなら追加点数なし
}

function updateTimerUI() {
  document.getElementById("timer").innerText = timeLeft;
  const percentage = (timeLeft / maxTime) * 100;
  document.getElementById("progress-bar").style.width = `${percentage}%`;
  if (timeLeft <= 10) {
    document.getElementById("timer").classList.add("danger-time");
    document.getElementById("progress-bar").classList.add("danger-bar");
  } else {
    document.getElementById("timer").classList.remove("danger-time");
    document.getElementById("progress-bar").classList.remove("danger-bar");
  }
}

function clearDrSelection() {
  inputStep = 0;
  selectedDr = "";
  updateNavUI();
}

function updateNavUI() {
  const slotDr = document.getElementById("slot-dr");
  const slotCr = document.getElementById("slot-cr");
  const clearBtn = document.getElementById("clear-btn");
  if (inputStep === 0) {
    slotDr.className = "nav-slot nav-active";
    slotDr.innerText = "借方(左): 入力待ち...";
    slotCr.className = "nav-slot";
    slotCr.innerText = "貸方(右): 待ち";
    clearBtn.classList.add("visibility-hidden");
  } else {
    slotDr.className = "nav-slot nav-filled";
    slotDr.innerText = `借方(左): 【${selectedDr}】`;
    slotCr.className = "nav-slot nav-active";
    slotCr.innerText = "貸方(右): 入力待ち...";
    clearBtn.classList.remove("visibility-hidden");
  }
}

function flashScreen(type) {
  const box = document.getElementById("question-box");
  const className = type === "correct" ? "flash-correct" : "flash-wrong";
  box.classList.add(className);
  setTimeout(() => box.classList.remove(className), 150);
}

function quitGame() {
  if (confirm("ゲームを中断してタイトル画面に戻りますか？")) {
    clearInterval(timerInterval);
    location.reload();
  }
}

function endGame() {
  clearInterval(timerInterval);
  saveResultToHistory(score, totalScore, maxTime);

  document.getElementById("play-screen").classList.add("hide");
  const resultScreen = document.getElementById("result-screen");
  if (resultScreen) {
    resultScreen.classList.remove("hide");
    document.getElementById("final-score").innerText = score;
    document.getElementById("final-totalScore").innerText = totalScore;
  }

  // 間違えた問題がある場合だけボタンを表示
  if (wrongQuizzes.length > 0) {
    document.getElementById("review-btn").style.display = "block";
  }
}

// 復習リストを表示する関数
function showReview() {
  const listDiv = document.getElementById("wrong-questions-list");
  listDiv.innerHTML = "";
  wrongQuizzes.forEach((quiz, index) => {
    const item = document.createElement("div");
    item.style.marginBottom = "15px";
    item.style.padding = "10px";
    item.style.background = "#3d3d3d";
    item.style.borderRadius = "8px";
    item.innerHTML = `
            <div style="color: #f1c40f;">Q${index + 1}: ${quiz.q}</div>
            <div style="margin-top: 5px;">借方: ${quiz.dr} / 貸方: ${quiz.cr}</div>
        `;
    listDiv.appendChild(item);
  });
  document.getElementById("review-modal").classList.remove("hide");
}

function hideReview() {
  document.getElementById("review-modal").classList.add("hide");
}
