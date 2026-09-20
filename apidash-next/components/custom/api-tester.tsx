// "use client";

// import React, { useState, useCallback, memo } from "react";

// type BodyType = "json" | "text" | "form";
// type AuthType = "none" | "bearer" | "basic" | "apikey";

// type KeyValueRow = {
//     id: string;
//     key: string;
//     value: string;
//     enabled: boolean;
// };

// type HistoryItem = {
//     method: string;
//     url: string;
//     status: number;
//     time: number;
//     ts: number;
// };

// // ─────────────────────────────────────────────
// // MEMOIZED SUB-COMPONENTS (Prevents whole-page re-renders)
// // ─────────────────────────────────────────────

// const KeyValueEditor = memo(function KeyValueEditor({
//     title,
//     rows,
//     onAdd,
//     onUpdate,
//     onDelete,
//     extraAction,
// }: {
//     title: string;
//     rows: KeyValueRow[];
//     onAdd: () => void;
//     onUpdate: (id: string, field: keyof Omit<KeyValueRow, "id">, value: string | boolean) => void;
//     onDelete: (id: string) => void;
//     extraAction?: React.ReactNode;
// }) {
//     return (
//         <section>
//             <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
//                 <h3>{title}</h3>
//                 {extraAction}
//             </div>

//             {rows.map((row) => (
//                 <div key={row.id} className="kv-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
//                     <input
//                         type="checkbox"
//                         checked={row.enabled}
//                         onChange={(e) => onUpdate(row.id, "enabled", e.target.checked)}
//                     />
//                     <input
//                         value={row.key}
//                         placeholder="Key"
//                         onChange={(e) => onUpdate(row.id, "key", e.target.value)}
//                     />
//                     <input
//                         value={row.value}
//                         placeholder="Value"
//                         onChange={(e) => onUpdate(row.id, "value", e.target.value)}
//                     />
//                     <button onClick={() => onDelete(row.id)}>×</button>
//                 </div>
//             ))}
//             <button onClick={onAdd}>+ Add {title.slice(0, -1)}</button>
//         </section>
//     );
// });

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────

// export default function ApiTester() {
//     // ─────────────────────────────────────────────
//     // STATE
//     // ─────────────────────────────────────────────

//     const [method, setMethod] = useState("GET");
//     const [url, setUrl] = useState("");

//     // OPTIMIZATION: Use lazy initialization () => to prevent randomUUID from firing on every render
//     const [params, setParams] = useState<KeyValueRow[]>(() => [
//         { id: crypto.randomUUID(), key: "", value: "", enabled: true },
//     ]);
//     const [headers, setHeaders] = useState<KeyValueRow[]>(() => [
//         { id: crypto.randomUUID(), key: "Content-Type", value: "application/json", enabled: true },
//     ]);

//     const [bodyType, setBodyType] = useState<BodyType>("json");
//     const [body, setBody] = useState("");

//     const [authType, setAuthType] = useState<AuthType>("none");
//     const [authToken, setAuthToken] = useState("");
//     const [authUser, setAuthUser] = useState("");
//     const [authPass, setAuthPass] = useState("");
//     const [authKeyName, setAuthKeyName] = useState("");
//     const [authKeyValue, setAuthKeyValue] = useState("");

//     const [loading, setLoading] = useState(false);
//     const [status, setStatus] = useState<number | null>(null);
//     const [statusText, setStatusText] = useState("");

//     const [responseText, setResponseText] = useState("");
//     const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
//     const [responseTime, setResponseTime] = useState<number | null>(null);
//     const [responseTab, setResponseTab] = useState<"pretty" | "raw" | "headers">("pretty");
//     const [history, setHistory] = useState<HistoryItem[]>([]);

//     // ─────────────────────────────────────────────
//     // ROW MANAGEMENT (Memoized to prevent child re-renders)
//     // ─────────────────────────────────────────────

//     const addRow = useCallback((type: "params" | "headers") => {
//         const newRow = { id: crypto.randomUUID(), key: "", value: "", enabled: true };
//         if (type === "params") setParams((prev) => [...prev, newRow]);
//         else setHeaders((prev) => [...prev, newRow]);
//     }, []);

//     const updateRow = useCallback(
//         (type: "params" | "headers", id: string, field: keyof Omit<KeyValueRow, "id">, value: string | boolean) => {
//             const setter = type === "params" ? setParams : setHeaders;
//             setter((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
//         },
//         []
//     );

//     const deleteRow = useCallback((type: "params" | "headers", id: string) => {
//         const setter = type === "params" ? setParams : setHeaders;
//         setter((prev) => prev.filter((row) => row.id !== id));
//     }, []);

//     // ─────────────────────────────────────────────
//     // ACTIONS
//     // ─────────────────────────────────────────────

//     // OPTIMIZATION: Actually wired this up (it was dead code previously)
//     const updateURL = useCallback(() => {
//         if (!url) return;
//         try {
//             const parsed = new URL(url);
//             parsed.search = "";
//             params
//                 .filter((p) => p.enabled && p.key.trim())
//                 .forEach((p) => parsed.searchParams.append(p.key.trim(), p.value));
//             setUrl(parsed.toString());
//         } catch {
//             alert("Invalid URL structure to sync params.");
//         }
//     }, [url, params]);

//     const formatBody = useCallback(() => {
//         try {
//             setBody((prev) => JSON.stringify(JSON.parse(prev), null, 2));
//         } catch {
//             alert("Invalid JSON");
//         }
//     }, []);

//     const getAuthHeader = useCallback(() => {
//         if (authType === "bearer" && authToken) return { Authorization: `Bearer ${authToken}` };
//         if (authType === "basic" && authUser) return { Authorization: "Basic " + btoa(`${authUser}:${authPass}`) };
//         if (authType === "apikey" && authKeyName && authKeyValue) return { [authKeyName]: authKeyValue };
//         return {};
//     }, [authType, authToken, authUser, authPass, authKeyName, authKeyValue]);

//     async function sendRequest() {
//         const requestUrl = url.trim();
//         if (!requestUrl || !requestUrl.startsWith("http")) {
//             alert("Please enter a valid URL starting with http(s)://");
//             return;
//         }

//         setLoading(true);
//         const startTime = Date.now();

//         try {
//             const headersObj: Record<string, string> = { ...getAuthHeader() };
//             headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
//                 headersObj[h.key.trim()] = h.value;
//             });

//             let bodyPayload: string | undefined;
//             if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
//                 bodyPayload = body;
//                 if (bodyType === "json") headersObj["Content-Type"] ||= "application/json";
//                 if (bodyType === "form") headersObj["Content-Type"] = "application/x-www-form-urlencoded";
//                 if (bodyType === "text") headersObj["Content-Type"] = "text/plain";
//             }

//             const response = await fetch(requestUrl, { method, headers: headersObj, body: bodyPayload });
//             const elapsed = Date.now() - startTime;
//             const text = await response.text();

//             setResponseText(text);
//             setStatus(response.status);
//             setStatusText(response.statusText);
//             setResponseTime(elapsed);

//             const headerObject: Record<string, string> = {};
//             response.headers.forEach((value, key) => (headerObject[key] = value));
//             setResponseHeaders(headerObject);

//             setHistory((prev) => [
//                 { method, url: requestUrl, status: response.status, time: elapsed, ts: Date.now() },
//                 ...prev,
//             ].slice(0, 30));
//         } catch (error) {
//             setResponseText(`${error instanceof Error ? error.message : "Unknown error"}\n\nThis may be a CORS issue or network error.`);
//             setStatus(0);
//             setStatusText("ERROR");
//             setResponseTime(Date.now() - startTime);
//         } finally {
//             setLoading(false);
//         }
//     }

//     return (
//         <div className="api-tester">
//             {/* URL BAR */}
//             <div className="request-bar" style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
//                 <select value={method} onChange={(e) => setMethod(e.target.value)}>
//                     {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((m) => (
//                         <option key={m}>{m}</option>
//                     ))}
//                 </select>
//                 <input style={{ flex: 1 }} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com/users" />
//                 <button onClick={sendRequest} disabled={loading}>{loading ? "SENDING..." : "▶ SEND"}</button>
//             </div>

//             {/* PARAMS & HEADERS */}
//             <KeyValueEditor
//                 title="Params"
//                 rows={params}
//                 onAdd={() => addRow("params")}
//                 onUpdate={(id, field, val) => updateRow("params", id, field, val)}
//                 onDelete={(id) => deleteRow("params", id)}
//                 extraAction={<button onClick={updateURL} style={{ fontSize: "0.8rem" }}>Sync to URL</button>}
//             />

//             <KeyValueEditor
//                 title="Headers"
//                 rows={headers}
//                 onAdd={() => addRow("headers")}
//                 onUpdate={(id, field, val) => updateRow("headers", id, field, val)}
//                 onDelete={(id) => deleteRow("headers", id)}
//             />

//             {/* BODY */}
//             <section>
//                 <h3>Body</h3>
//                 <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
//                     {["json", "text", "form"].map((type) => (
//                         <button key={type} onClick={() => setBodyType(type as BodyType)} style={{ fontWeight: bodyType === type ? "bold" : "normal" }}>
//                             {type.toUpperCase()}
//                         </button>
//                     ))}
//                     {bodyType === "json" && <button onClick={formatBody}>Format JSON</button>}
//                 </div>
//                 <textarea
//                     style={{ width: "100%", minHeight: "100px" }}
//                     value={body}
//                     onChange={(e) => setBody(e.target.value)}
//                     placeholder={bodyType === "json" ? '{\n  "key": "value"\n}' : bodyType === "text" ? "Plain text body..." : "key=value&key2=value2"}
//                 />
//             </section>

//             {/* RESPONSE */}
//             <section>
//                 <h3>Response {status !== null && <span>({status} {statusText})</span>}</h3>
//                 {responseTime !== null && <div>Time: {responseTime}ms</div>}

//                 <div style={{ display: "flex", gap: "0.5rem", margin: "0.5rem 0" }}>
//                     {["pretty", "raw", "headers"].map((tab) => (
//                         <button key={tab} onClick={() => setResponseTab(tab as any)} style={{ fontWeight: responseTab === tab ? "bold" : "normal" }}>
//                             {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                         </button>
//                     ))}
//                 </div>

//                 <pre style={{ background: "#f4f4f4", padding: "1rem", overflowX: "auto" }}>
//                     {responseTab === "pretty" ? (
//                         (() => {
//                             try { return JSON.stringify(JSON.parse(responseText), null, 2); }
//                             catch { return responseText; }
//                         })()
//                     ) : responseTab === "raw" ? (
//                         responseText
//                     ) : (
//                         JSON.stringify(responseHeaders, null, 2)
//                     )}
//                 </pre>
//             </section>

//             {/* HISTORY */}
//             {history.length > 0 && (
//                 <section>
//                     <h3>History</h3>
//                     <button onClick={() => setHistory([])} style={{ marginBottom: "0.5rem" }}>Clear History</button>
//                     <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
//                         {history.map((item) => (
//                             <button key={item.ts} onClick={() => { setMethod(item.method); setUrl(item.url); }} style={{ textAlign: "left" }}>
//                                 <strong>{item.method}</strong> {item.url} — {item.status} · {item.time}ms
//                             </button>
//                         ))}
//                     </div>
//                 </section>
//             )}
//         </div>
//     );
// }