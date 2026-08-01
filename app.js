// app.js
import { getUserId, saveScoreToSupabase, supabase } from "./supabaseClient.js"; // getUserIdもインポートする
let currentQuiz = {};
// 正解の科目（drとcr）を必ず含める
let displayOptions = [currentQuiz.dr, currentQuiz.cr];

let lastQuizIndex = -1;
let score = 0;
let totalScore = 0;
let questionStartTime = 0;
let timeLeft = 60;
let maxTime = 60;
let timerInterval;

let inputStep = 0;
let selectedDr = "";
let selectedCr = "";
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

// お気に入り一覧を表示するモーダルを開く関数
window.showFavoritesModal = async function () {
  const currentUserId = getUserId();

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("question_id")
    .eq("user_id", currentUserId);

  if (error) {
    console.error("お気に入りリストの取得に失敗しました:", error);
    alert("お気に入りデータの取得に失敗しました。");
    return;
  }

  // ★ ここで取得できたお気に入りIDを確認
  console.log("Supabaseから取得したfavoritesデータ:", favorites);

  const favoritedIds = favorites ? favorites.map((fav) => fav.question_id) : [];
  console.log("変換されたfavoritedIds配列:", favoritedIds);

  if (favoritedIds.length === 0) {
    alert("お気に入り登録された問題はまだありません！");
    return;
  }

  // ★ quizData2 の中のデータの型を確認（例として最初の要素をチェック）
  if (quizData2 && quizData2.length > 0) {
    console.log(
      "quizData2の先頭のid:",
      quizData2[0].id,
      "型:",
      typeof quizData2[0].id,
    );
  }

  const favoriteQuizzes = quizData2.filter((quiz) =>
    favoritedIds.includes(quiz.id),
  );

  // ★ 絞り込み結果を確認
  console.log("一致したfavoriteQuizzes:", favoriteQuizzes);

  const listDiv = document.getElementById("favorite-questions-list");
  if (!listDiv) return;

  listDiv.innerHTML = "";

  favoriteQuizzes.forEach((quiz) => {
    const item = document.createElement("div");
    item.style.marginBottom = "15px";
    item.style.padding = "10px";
    item.style.background = "#3d3d3d";
    item.style.borderRadius = "8px";

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f1c40f;">問題ID: ${quiz.id}</span>
      </div>
      <div style="margin-top: 5px;">Q. ${quiz.q}</div>
      <div style="margin-top: 5px; color: #2ecc71;">借方: ${quiz.dr} / 貸方: ${quiz.cr}</div>
    `;
    listDiv.appendChild(item);
  });

  document.getElementById("favorite-modal").classList.remove("hide");
};

window.closeFavoritesModal = function () {
  const modal = document.getElementById("favorite-modal");
  if (modal) {
    modal.classList.add("hide");
  }
};

function setupButtons(index) {
  const container = document.getElementById("btn-container");
  container.innerHTML = "";

  // 1. 変数名を zuizData2 に変更
  const currentQuiz = quizData2[index];

  // 安全確認
  if (
    !currentQuiz ||
    !currentQuiz.options ||
    !currentQuiz.dr ||
    !currentQuiz.cr
  ) {
    console.error(
      "エラー！データが見つからないか、必要データが不足しています。インデックス: " +
        index,
    );
    return;
  }

  container.className = "btn-container";

  // 2. 毎回新しく正解（dr, cr）を入れた状態からスタートするように初期化
  let displayOptions = [currentQuiz.dr, currentQuiz.cr];

  // scoreが5未満（前半）か、5以上（後半）かでダミーの数を変更
  if (score < 5) {
    const availableDummies = currentQuiz.options.filter(
      (opt) => opt !== currentQuiz.dr && opt !== currentQuiz.cr,
    );

    const shuffledDummies = [...availableDummies].sort(
      () => Math.random() - 0.5,
    );
    const selectedDummies = shuffledDummies.slice(0, 6);

    displayOptions = displayOptions.concat(selectedDummies);
  } else {
    displayOptions = displayOptions.concat(currentQuiz.options);
  }

  // 最終的な選択肢全体をシャッフルする
  const shuffledOptions = displayOptions.sort(() => Math.random() - 0.5);

  // ボタンを生成して配置
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
  const totalQuizzes = quizData2.length;

  if (totalQuizzes === 0) return;

  // 全データの中からランダムなインデックスを決定
  let newIndex = Math.floor(Math.random() * totalQuizzes);

  // もし前回と同じ問題ならもう一度選び直す（簡易的な重複防止）
  if (totalQuizzes > 1) {
    while (newIndex === lastQuizIndex) {
      newIndex = Math.floor(Math.random() * totalQuizzes);
    }
  }

  lastQuizIndex = newIndex;
  currentQuiz = quizData2[newIndex];

  // 新しい問題が表示された瞬間の時間を記録する
  questionStartTime = Date.now();

  // リセット処理
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

  // ★ ここでSupabaseにスコアを保存する！
  saveScoreToSupabase(score, totalScore);

  // 👑 追加：保存した後に自己ベストのランキングを最新に更新する
  loadBestScores();

  document.getElementById("play-screen").classList.add("hide");
  const resultScreen = document.getElementById("result-screen");
  if (resultScreen) {
    resultScreen.classList.remove("hide");
    document.getElementById("final-score").innerText = score;
    document.getElementById("final-totalScore").innerText = totalScore;

    // 👇 ここに選択された秒数を画面に反映する処理を追加！
    document.getElementById("final-time").innerText = maxTime;
  }

  // 間違えた問題がある場合だけボタンを表示
  if (wrongQuizzes.length > 0) {
    document.getElementById("review-btn").style.display = "block";
  }
}

async function loadBestScores() {
  try {
    const userId = getUserId(); // 自身の固有IDを取得

    const { data, error } = await supabase
      .from("scores")
      .select("score, total_score, play_time")
      .eq("user_id", userId) // ★ 自分自身のデータに絞り込む
      .eq("play_time", 60) // 60秒モード
      .order("score", { ascending: false })
      .order("total_score", { ascending: false })
      .limit(3);

    const bestListEl = document.getElementById("best-score-list");
    if (!bestListEl) return;

    if (error || !data || data.length === 0) {
      bestListEl.innerHTML =
        '<div class="history-empty">データがありません</div>';
      return;
    }

    let html = "";
    data.forEach((item, index) => {
      const rankIcon = index === 0 ? "👑" : index === 1 ? "🥈" : "🥉";
      const timeText = item.play_time ? `${item.play_time}秒` : "-";

      html += `
        <div class="history-item">
          <span>${rankIcon} ${item.score}問 (${item.total_score}点)</span>
          <span style="color: #888; font-size: 11px;">${timeText}</span>
        </div>
      `;
    });
    bestListEl.innerHTML = html;
  } catch (err) {
    console.error("自己ベストの取得に失敗しました:", err);
  }
}

async function loadDailyRanking() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from("scores")
      .select("score, total_score, play_time")
      .eq("play_time", 60) // 60秒モード
      .gte("created_at", todayISO) // 今日のデータ
      .order("score", { ascending: false }) // スコアが高い順
      .order("total_score", { ascending: false }) // 同点ならトータル点数順
      .limit(3); // 上位3件

    if (error) throw error;

    const container = document.getElementById("daily-ranking-list");
    if (container) {
      container.innerHTML = "";

      if (data.length === 0) {
        container.innerHTML = `<div style="color: #888; font-size: 0.9rem; padding: 10px;">今日の記録はまだありません</div>`;
        return;
      }

      data.forEach((row, index) => {
        const item = document.createElement("div");
        // 自己ベストと同じようなデザインのクラスを流用すると綺麗に馴染みます
        item.className = "ranking-item";
        item.innerHTML = `<span>👑 ${index + 1}位</span> <span>${row.score}問 (${row.total_score}点)</span>`;
        container.appendChild(item);
      });
    }
  } catch (error) {
    console.error("本日のランキング取得エラー:", error.message);
  }
}

// ページ読み込み時やゲーム終了時に呼ぶ
window.addEventListener("DOMContentLoaded", () => {
  // 既存の自分のベスト表示と一緒に呼び出す
  loadDailyRanking();
});

// 復習リストを表示する関数
async function showReview() {
  const currentUserId = getUserId();

  const listDiv = document.getElementById("wrong-questions-list");
  listDiv.innerHTML = "";

  // 1. ユーザーがすでに登録しているお気に入りリストをSupabaseから取得
  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("question_id")
    .eq("user_id", currentUserId);

  if (error) {
    console.error("お気に入りの取得に失敗しました:", error);
  }

  // お気に入り登録されているquestion_idの配列（例: [14, 59]）
  const favoritedIds = favorites ? favorites.map((fav) => fav.question_id) : [];

  wrongQuizzes.forEach((quiz) => {
    const item = document.createElement("div");
    item.style.marginBottom = "15px";
    item.style.padding = "10px";
    item.style.background = "#3d3d3d";
    item.style.borderRadius = "8px";

    // 既に登録されている場合は星を塗りつぶし（★）、未登録なら「☆」にする
    const isFavorited = favoritedIds.includes(quiz.id);
    const starChar = isFavorited ? "★" : "☆";
    const starColor = isFavorited ? "#f1c40f" : "#ccc";

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #f1c40f;">問題ID: ${quiz.id}</span>
        <button class="favorite-btn" data-id="${quiz.id}" style="background: none; border: none; font-size: 20px; cursor: pointer; color: ${starColor};">${starChar}</button>
      </div>
      <div style="margin-top: 5px;">Q. ${quiz.q}</div>
      <div style="margin-top: 5px; color: #2ecc71;">借方: ${quiz.dr} / 貸方: ${quiz.cr}</div>
    `;
    listDiv.appendChild(item);
  });

  document.getElementById("review-modal").classList.remove("hide");

  // 2. 生成された☆ボタンにクリックイベントを設定
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const quizId = parseInt(e.target.getAttribute("data-id"), 10);
      await toggleFavorite(quizId, e.target);
    });
  });
}

// 3. お気に入りの追加・削除を切り替える（トグル）関数
async function toggleFavorite(quizId, buttonElement) {
  // すでに星が黄色（★）かどうかで追加・削除を判定
  const currentUserId = getUserId();
  const isCurrentlyFavorited = buttonElement.textContent === "★";

  if (isCurrentlyFavorited) {
    // 削除処理
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", currentUserId)
      .eq("question_id", quizId);

    if (!error) {
      buttonElement.textContent = "☆";
      buttonElement.style.color = "#ccc";
    } else {
      console.error("お気に入りの削除に失敗しました:", error);
    }
  } else {
    // 追加処理
    const { error } = await supabase
      .from("favorites")
      .insert([{ user_id: currentUserId, question_id: quizId }]);

    if (!error) {
      buttonElement.textContent = "★";
      buttonElement.style.color = "#f1c40f";
    } else {
      console.error("お気に入りの追加に失敗しました:", error);
    }
  }
}

function hideReview() {
  document.getElementById("review-modal").classList.add("hide");
}

window.startGame = startGame;
window.showReview = showReview;
window.hideReview = hideReview;
window.toggleSettingsMenu = toggleSettingsMenu;
window.quitGame = quitGame;
window.clearDrSelection = clearDrSelection;
window.loadBestScores = loadBestScores;
window.addEventListener("DOMContentLoaded", () => {
  loadBestScores(); // 画面を開いたときにランキングを読み込む
});
window.getUserId = getUserId;
