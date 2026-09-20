"use client"

import { useState, useCallback } from "react";
import RequestBar from "./requestGroup";
import ResultSection from "./resultSection";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type KeyValueRow = {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
};

export type HistoryItem = {
    method: string;
    url: string;
    status: number;
    time: number;
    ts: number;
};

const requestMethods = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "PATCH", label: "PATCH" },
    { value: "DELETE", label: "DELETE" },
    { value: "HEAD", label: "HEAD" },
    { value: "OPTIONS", label: "OPTIONS" },
];

export default function ApiDash() {
    const [method, setMethod] = useState("GET");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const [params, setParams] = useState<KeyValueRow[]>(() => [
        { id: crypto.randomUUID(), key: "", value: "", enabled: true },
    ]);
    const [headers, setHeaders] = useState<KeyValueRow[]>(() => [
        { id: crypto.randomUUID(), key: "Content-Type", value: "application/json", enabled: true },
    ]);

    const [bodyType, setBodyType] = useState<"json" | "text" | "form">("json");
    const [body, setBody] = useState("");

    const [status, setStatus] = useState<number | null>(null);
    const [statusText, setStatusText] = useState("");
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [responseText, setResponseText] = useState("");
    const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

    const [history, setHistory] = useState<HistoryItem[]>([]);

    const addRow = useCallback((type: "params" | "headers") => {
        const newRow = { id: crypto.randomUUID(), key: "", value: "", enabled: true };
        if (type === "params") setParams((prev) => [...prev, newRow]);
        else setHeaders((prev) => [...prev, newRow]);
    }, []);

    const updateRow = useCallback((type: "params" | "headers", id: string, field: keyof Omit<KeyValueRow, "id">, value: string | boolean) => {
        const setter = type === "params" ? setParams : setHeaders;
        setter((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    }, []);

    const deleteRow = useCallback((type: "params" | "headers", id: string) => {
        const setter = type === "params" ? setParams : setHeaders;
        setter((prev) => prev.filter((row) => row.id !== id));
    }, []);

    const formatBody = useCallback(() => {
        const value = body.trim();

        if (!value) {
            toast.add({
                title: "Nothing to format",
                description: "Enter a JSON request body first.",
                type: "warning",
            });
            return;
        }

        try {
            setBody(JSON.stringify(JSON.parse(value), null, 2));
            toast.add({
                title: "Body formatted",
                description: "The request body is valid JSON.",
                type: "success",
            });
        } catch {
            toast.add({
                title: "Invalid JSON",
                description: "Fix the request body before formatting it.",
                type: "error",
            });
        }
    }, [body]);

    const sendRequest = async () => {
        const requestUrl = url.trim();
        if (!requestUrl || !/^https?:\/\//i.test(requestUrl)) {
            toast.add({
                title: "Invalid URL",
                description: "Enter a URL beginning with http:// or https://.",
                type: "error",
            });
            return;
        }

        setLoading(true);
        const startTime = Date.now();

        try {
            const headersObj: Record<string, string> = {};
            headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => {
                headersObj[h.key.trim()] = h.value;
            });

            let bodyPayload: string | undefined;
            if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
                bodyPayload = body;
                if (bodyType === "json") headersObj["Content-Type"] = headersObj["Content-Type"] || "application/json";
                if (bodyType === "form") headersObj["Content-Type"] = "application/x-www-form-urlencoded";
                if (bodyType === "text") headersObj["Content-Type"] = "text/plain";
            }

            const parsedUrl = new URL(requestUrl);
            params.filter((p) => p.enabled && p.key.trim()).forEach((p) => {
                parsedUrl.searchParams.append(p.key.trim(), p.value);
            });

            const response = await fetch("/api/proxy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: parsedUrl.toString(),
                    method,
                    headers: headersObj,
                    body: bodyPayload,
                }),
            });
            const elapsed = Date.now() - startTime;
            const result = await response.json() as {
                status?: number;
                statusText?: string;
                headers?: Record<string, string>;
                body?: string;
                time?: number;
                error?: string;
            };

            if (!response.ok) {
                throw new Error(result.error || `Proxy request failed (${response.status})`);
            }

            const responseStatus = result.status ?? response.status;
            const responseStatusText = result.statusText || response.statusText;
            const responseBody = result.body ?? "";

            setResponseText(responseBody);
            setStatus(responseStatus);
            setStatusText(responseStatusText);
            setResponseTime(result.time ?? elapsed);
            setResponseHeaders(result.headers ?? {});

            setHistory((prev) => [
                { method, url: parsedUrl.toString(), status: responseStatus, time: result.time ?? elapsed, ts: Date.now() },
                ...prev,
            ].slice(0, 30));

            toast.add({
                title: `${method} request completed`,
                description: `${responseStatus} ${responseStatusText} · ${result.time ?? elapsed} ms`,
                type: responseStatus >= 400 ? "warning" : "success",
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            setResponseText(`${message}\n\nCheck the URL, proxy route, and network connection.`);
            setStatus(0);
            setStatusText("ERROR");
            setResponseTime(Date.now() - startTime);
            toast.add({
                title: "Request failed",
                description: message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <RequestBar
                request={requestMethods}
                method={method}
                url={url}
                loading={loading}
                onMethodChange={setMethod}
                onUrlChange={setUrl}
                onSend={sendRequest}
            />
            <ResultSection
                className={cn("flex-1", loading ? "opacity-50 pointer-events-none" : "")}
                params={params}
                headers={headers}
                onAddRow={addRow}
                onUpdateRow={updateRow}
                onDeleteRow={deleteRow}
                body={body}
                setBody={setBody}
                bodyType={bodyType}
                setBodyType={setBodyType}
                onFormatBody={formatBody}
                status={status}
                statusText={statusText}
                responseTime={responseTime}
                responseText={responseText}
                responseHeaders={responseHeaders}
                history={history}
                onClearHistory={() => setHistory([])}
                onHistorySelect={(hMethod, hUrl) => {
                    setMethod(hMethod);
                    setUrl(hUrl);
                }}
            />
        </div>
    );
}