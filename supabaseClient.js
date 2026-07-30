import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://szrcwwgzvcjgripkocte.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qqp9CYedhxurYyy_Up8Epg_6iWX6uSf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 端末ごとの固有IDを取得
export function getUserId() {
  let userId = localStorage.getItem("boki_app_user_id");
  if (!userId) {
    userId =
      "user_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36);
    localStorage.setItem("boki_app_user_id", userId);
  }
  return userId;
}

export async function saveScoreToSupabase(finalScore, finalTotalScore) {
  try {
    // 1. セレクトボックスから現在選択されている時間を取得する
    const timeSelect = document.getElementById("time-select");
    const selectedTime = timeSelect ? timeSelect.value : "60"; // 万が一要素がない場合の保険

    // 2. 「60秒」のときだけ保存する条件分岐
    if (selectedTime !== "60") {
      console.log(
        "60秒モード以外のため、スコアの保存をスキップしました（選択時間: " +
          selectedTime +
          "秒）",
      );
      return; // ここで処理を終了
    }

    const userId = getUserId();

    // 3. データベースに送るデータに play_time（または time_limit）を含める
    // ※ Supabase側にも play_time カラムを追加しておくとスムーズです
    const { data, error } = await supabase.from("scores").insert([
      {
        user_id: userId,
        score: finalScore,
        total_score: finalTotalScore,
        play_time: parseInt(selectedTime, 10), // 数値として保存
      },
    ]);

    if (error) {
      console.error("スコアの保存に失敗しました:", error);
    } else {
      console.log("スコアが正常に保存されました:", data);
    }
  } catch (err) {
    console.warn(
      "通信エラーが発生しましたが、ゲームの動作には影響しません。",
      err,
    );
  }
}
