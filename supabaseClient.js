import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://szrcwwgzvcjgripkocte.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qqp9CYedhxurYyy_Up8Epg_6iWX6uSf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true, // ブラウザにセッションを保持させる
    autoRefreshToken: true, // トークンを自動更新する
    detectSessionInUrl: true,
  },
});

/**
 * 匿名認証を行い、SupabaseのユーザーID（UUID）を取得する関数
 * 初回は匿名ログインを行い、2回目以降は既存のセッションからIDを返します。
 * @returns {Promise<string>} SupabaseのユーザーUUID
 */
export async function getUserId() {
  // 1. 現在のセッション（ログイン状態）を確認
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("セッション取得エラー:", sessionError);
    throw sessionError;
  }

  // 2. すでにセッションがあれば、そのユーザーのUUIDを返す
  if (session && session.user) {
    return session.user.id;
  }

  // 3. セッションがない（初回など）場合は、匿名認証を実行する
  const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

  if (authError) {
    console.error("匿名認証エラー:", authError);
    throw authError;
  }

  return authData.user.id;
}

export async function saveScoreToSupabase(finalScore, finalTotalScore) {
  try {
    // 1. セレクトボックスから現在選択されている時間を取得する
    const timeSelect = document.getElementById("time-select");
    const selectedTime = timeSelect ? timeSelect.value : "60"; // 万が一要素がない場合の保険

    // 2. 「60秒」のときだけ保存する条件分岐
    if (selectedTime !== "60") {
      console.log("60秒モード以外のため、スコアの保存をスキップしました（選択時間: " + selectedTime + "秒）");
      return; // ここで処理を終了
    }

    // ★ 非同期関数になったため await を追加します
    const userId = await getUserId();

    // 3. データベースに送るデータに play_time（または time_limit）を含める
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
    console.warn("通信エラーが発生しましたが、ゲームの動作には影響しません。", err);
  }
}
