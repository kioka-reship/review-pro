export const STORE_STATUSES = ["契約中", "入金待ち", "停止中", "仮申込", "解約予約", "解約済"] as const;
export type StoreStatus = typeof STORE_STATUSES[number];
