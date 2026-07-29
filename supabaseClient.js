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

// 【ここに追加】スコアを保存する関数
export async function saveScoreToSupabase(finalScore, finalTotalScore) {
  try {
    // ← ここに try を追加するよ！
    const userId = getUserId();

    const { data, error } = await supabase.from("scores").insert([
      {
        user_id: userId,
        score: finalScore,
        total_score: finalTotalScore,
      },
    ]);

    if (error) {
      console.error("スコアの保存に失敗しました:", error);
    } else {
      console.log("スコアが正常に保存されました:", data);
    }
  } catch (err) {
    // ネットワークエラーなどで完全に通信できない場合もここで防ぐ
    console.warn(
      "通信エラーが発生しましたが、ゲームの動作には影響しません。",
      err,
    );
  }
}
