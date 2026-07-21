export const accountBalances = {
  // --- 資産：流動資産 (1001〜) ---
  1001: { name: "現金", type: "asset", initialBalance: 10000 },
  1002: { name: "当座預金", type: "asset", initialBalance: 10000 },
  1003: { name: "普通預金", type: "asset", initialBalance: 10000 },
  1004: { name: "売掛金", type: "asset", initialBalance: 10000 },
  1005: { name: "受取手形", type: "asset", initialBalance: 10000 },
  1007: { name: "繰越商品", type: "asset", initialBalance: 10000 },
  1008: { name: "前払費用", type: "asset", initialBalance: 10000 },
  1009: { name: "未収収益", type: "asset", initialBalance: 10000 },

  // --- 資産：固定資産 (1101〜) ---
  1101: { name: "備品", type: "asset", initialBalance: 10000 },
  1102: { name: "車両運搬具", type: "asset", initialBalance: 10000 },
  1103: { name: "長期貸付金", type: "asset", initialBalance: 10000 },

  // --- 負債：流動負債 (2001〜) ---
  2001: { name: "買掛金", type: "liability", initialBalance: 10000 },
  2002: { name: "支払手形", type: "liability", initialBalance: 10000 },
  2003: { name: "未払金", type: "liability", initialBalance: 10000 },
  2004: { name: "未払費用", type: "liability", initialBalance: 10000 },
  2005: { name: "前受収益", type: "liability", initialBalance: 10000 },
  2006: { name: "未払法人税等", type: "liability", initialBalance: 10000 },
  2007: { name: "貸倒引当金", type: "liability", initialBalance: 10000 },

  // --- 負債：固定負債 (2101〜) ---
  2101: { name: "長期借入金", type: "liability", initialBalance: 10000 },
  2102: { name: "減価償却累計額", type: "liability", initialBalance: 10000 },

  // --- 純資産 (3001〜) ---
  3001: { name: "資本金", type: "equity", initialBalance: 10000 },
  3002: { name: "繰越利益剰余金", type: "equity", initialBalance: 10000 },

  // --- 収益 (4001〜) ---
  4001: { name: "売上", type: "revenue", initialBalance: 0 },
  4002: { name: "受取利息", type: "revenue", initialBalance: 10000 },
  4003: { name: "受取家賃", type: "revenue", initialBalance: 0 },

  // --- 費用 (5001〜) ---
  5001: { name: "仕入", type: "expense", initialBalance: 0 },
  5002: { name: "給料手当", type: "expense", initialBalance: 0 },
  5003: { name: "法定福利費", type: "expense", initialBalance: 0 },
  5004: { name: "地代家賃", type: "expense", initialBalance: 0 },
  5005: { name: "水道光熱費", type: "expense", initialBalance: 0 },
  5006: { name: "旅費交通費", type: "expense", initialBalance: 0 },
  5007: { name: "通信費", type: "expense", initialBalance: 0 },
  5008: { name: "広告宣伝費", type: "expense", initialBalance: 0 },
  5009: { name: "消耗品費", type: "expense", initialBalance: 0 },
  5010: { name: "減価償却費", type: "expense", initialBalance: 0 },
  5011: { name: "支払利息", type: "expense", initialBalance: 0 },
  5012: { name: "租税公課", type: "expense", initialBalance: 0 },
  5013: { name: "支払手数料", type: "expense", initialBalance: 0 },
  5014: { name: "修繕費", type: "expense", initialBalance: 0 },
  5015: { name: "現金過不足", type: "asset", initialBalance: 0 },
  // --- 発送費・貸倒など（費用） ---
  5016: { name: "発送費", type: "expense", initialBalance: 0 },
  5017: { name: "貸倒引当金繰入", type: "expense", initialBalance: 0 },
  5018: { name: "雑損失", type: "expense", initialBalance: 0 },
  5019: { name: "法人税等", type: "expense", initialBalance: 0 },
  5020: { name: "支払保険料", type: "expense", initialBalance: 10000 },
  5022: { name: "貸倒損失", type: "expense", initialBalance: 0 },
  5023: { name: "損益", type: "temporary", initialBalance: 0 }, // 利益振替用仮勘定
};
