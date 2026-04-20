{false && (
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", color: "#1a2533" }}>低評価フィードバック一覧</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input value={feedbackStoreId} onChange={e => setFeedbackStoreId(e.target.value)}
                    placeholder="店舗IDで絞り込み（任意）"
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid #E5E7EB", fontFamily: "inherit", fontSize: "12px", outline: "none", width: "200px" }} />
                  <button onClick={() => fetchFeedback(feedbackStoreId || undefined)}
                    style={{ background: "#F4F6F9", border: "none", color: "#555", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>🔄 取得</button>
                </div>
              </div>
              {feedbackList.length === 0 ? (
                <p style={{ color: "#aaa", textAlign: "center", padding: "32px" }}>「取得」ボタンを押してください</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {feedbackList.map((fb: any) => (
                    <div key={fb.id} style={{ border: "1.5px solid #FEE2E2", borderRadius: "12px", padding: "16px", background: "#FFF5F5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "20px" }}>{"⭐".repeat(fb.rating)}</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#991B1B", background: "#FEE2E2", padding: "2px 8px", borderRadius: "6px" }}>★{fb.rating}</span>
                          <span style={{ fontSize: "12px", color: "#888" }}>{fb.stores?.name || fb.store_id}</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>{new Date(fb.created_at).toLocaleString("ja-JP")}</span>
                      </div>
                      {fb.issues && fb.issues.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {fb.issues.map((issue: string) => (
                            <span key={issue} style={{ background: "#FEE2E2", color: "#991B1B", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{issue}</span>
                          ))}
                        </div>
                      )}
                      {fb.comment && <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.7 }}>{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
