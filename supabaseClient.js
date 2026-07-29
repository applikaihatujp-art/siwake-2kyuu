import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://szrcwwgzvcjgripkocte.supabase.co";
const supabaseKey = "sb_publishable_qqp9CYedhxurYyy_Up8Epg_6iWX6uSf";

export const supabase = createClient(supabaseUrl, supabaseKey);

// 端末ごとの固有IDを取得（なければ新しく作って保存する）
export function getUserId() {
  let userId = localStorage.getItem("boki_app_user_id");
  if (!userId) {
    // 簡易的なUUID生成
    userId =
      "user_" +
      Math.random().toString(36).substring(2) +
      Date.now().toString(36);
    localStorage.setItem("boki_app_user_id", userId);
  }
  return userId;
}
