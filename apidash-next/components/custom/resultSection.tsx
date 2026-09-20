import { AppWindowIcon, CodeIcon, TrashIcon, PlusIcon } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Input } from "../ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { KeyValueRow, HistoryItem } from "./api-dash";

type BodyType = "json" | "text" | "form";
type EditorType = "params" | "headers";
type RowValue = string | boolean;

type ResultSectionProps = {
    className?: string;
    params: KeyValueRow[];
    headers: KeyValueRow[];
    onAddRow: (type: EditorType) => void;
    onUpdateRow: (type: EditorType, id: string, field: keyof Omit<KeyValueRow, "id">, value: RowValue) => void;
    onDeleteRow: (type: EditorType, id: string) => void;
    body: string;
    setBody: (v: string) => void;
    bodyType: BodyType;
    setBodyType: (v: BodyType) => void;
    onFormatBody: () => void;
    status: number | null;
    statusText: string;
    responseTime: number | null;
    responseText: string;
    responseHeaders: Record<string, string>;
    history: HistoryItem[];
    onClearHistory: () => void;
    onHistorySelect: (method: string, url: string) => void;
};

type KeyValueEditorProps = {
    rows: KeyValueRow[];
    type: EditorType;
    onAdd: (type: EditorType) => void;
    onUpdate: ResultSectionProps["onUpdateRow"];
    onDelete: ResultSectionProps["onDeleteRow"];
};

function KeyValueEditor({ rows, type, onAdd, onUpdate, onDelete }: KeyValueEditorProps) {
    return (
        <div className="flex flex-col space-y-2 p-4">
            {rows.map((row: KeyValueRow) => (
                <div key={row.id} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border"
                        checked={row.enabled}
                        onChange={(e) => onUpdate(type, row.id, "enabled", e.target.checked)}
                    />
                    <Input placeholder="Key" value={row.key} onChange={(e) => onUpdate(type, row.id, "key", e.target.value)} />
                    <Input placeholder="Value" value={row.value} onChange={(e) => onUpdate(type, row.id, "value", e.target.value)} />
                    <Button variant="ghost" size="icon-sm" onClick={() => onDelete(type, row.id)}>
                        <TrashIcon size={16} />
                    </Button>
                </div>
            ))}
            <Button variant="neutral" size="sm" className="mt-2 ml-5 w-fit" onClick={() => onAdd(type)}>
                <PlusIcon size={10} className="mr-4" /> Add Row
            </Button>
        </div>
    );
}

export default function ResultSection(props: ResultSectionProps) {
    const [responseView, setResponseView] = useState<"pretty" | "raw" | "headers">("pretty");

    const renderPrettyResponse = () => {
        try { return JSON.stringify(JSON.parse(props.responseText), null, 2); }
        catch { return props.responseText; }
    };

    return (
        <div className={cn("min-h-0 flex-1 px-5 pb-5", props.className)}>
            <ResizablePanelGroup
                orientation="horizontal"
                className="rounded-base h-full border-2 border-border text-foreground shadow-shadow"
            >
                {/* 1. CONFIG PANEL (Left) */}
                <ResizablePanel defaultSize={30}>
                    <div className="flex h-full flex-col">
                        <Tabs defaultValue="params" className="flex h-full flex-col">
                            <div className="flex justify-center bg-background p-3">
                                <TabsList>
                                    <TabsTrigger value="params"><AppWindowIcon size={14} className="mr-2" /> PARAMS</TabsTrigger>
                                    <TabsTrigger value="headers"><CodeIcon size={14} className="mr-2" /> HEADERS</TabsTrigger>
                                    <TabsTrigger value="body"><CodeIcon size={14} className="mr-2" /> BODY</TabsTrigger>
                                    <TabsTrigger value="auth"><CodeIcon size={14} className="mr-2" /> AUTH</TabsTrigger>
                                </TabsList>
                            </div>
                            <Separator className="border" />

                            <div className="flex-1 overflow-y-auto bg-muted/20">
                                <TabsContent value="params" className="m-0 h-full">
                                    <KeyValueEditor rows={props.params} type="params" onAdd={props.onAddRow} onUpdate={props.onUpdateRow} onDelete={props.onDeleteRow} />
                                </TabsContent>

                                <TabsContent value="headers" className="m-0 h-full">
                                    <KeyValueEditor rows={props.headers} type="headers" onAdd={props.onAddRow} onUpdate={props.onUpdateRow} onDelete={props.onDeleteRow} />
                                </TabsContent>

                                <TabsContent value="body" className="m-0 h-full p-4 flex flex-col space-y-2">
                                    <div className="flex space-x-2 mb-2">
                                        {(["json", "text", "form"] as BodyType[]).map((t) => (
                                            <Button key={t} size="sm" onClick={() => props.setBodyType(t)}>
                                                {t.toUpperCase()}
                                            </Button>
                                        ))}
                                        {props.bodyType === "json" && <Button size="sm" variant="default" onClick={props.onFormatBody}>Format JSON</Button>}
                                    </div>
                                    <textarea
                                        className="w-full flex-1 rounded-md border-2 border-border p-3 font-mono text-sm shadow-sm focus:outline-none"
                                        value={props.body}
                                        onChange={(e) => props.setBody(e.target.value)}
                                        placeholder="Request Body..."
                                    />
                                </TabsContent>

                                <TabsContent value="auth" className="m-0 p-4">
                                    <p className="text-sm text-muted-foreground">Auth settings go here.</p>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-border" />

                {/* 2. RESPONSE PANEL (Middle) */}
                <ResizablePanel defaultSize={35}>
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between bg-background p-4 py-3">
                            <span className="font-semibold text-sm">
                                STATUS: {props.status !== null ? (
                                    <span className={props.status >= 200 && props.status < 300 ? "text-green-600" : "text-red-600"}>
                                        {props.status} {props.statusText}
                                    </span>
                                ) : "Waiting..."}
                            </span>
                            {props.responseTime !== null && <span className="text-sm text-muted-foreground">{props.responseTime} ms</span>}
                        </div>
                        <Separator className="border" />

                        <div className="flex bg-muted/30 border-b border-border p-2 space-x-2">
                            <Button size="sm" onClick={() => setResponseView("pretty")}>Pretty</Button>
                            <Button size="sm" onClick={() => setResponseView("raw")}>Raw</Button>
                            <Button size="sm" onClick={() => setResponseView("headers")}>Headers</Button>
                        </div>

                        <div className="flex-1 overflow-auto bg-zinc-950 p-4 text-zinc-50 font-mono text-sm">
                            <pre className="whitespace-pre-wrap wrap-break-word">
                                {responseView === "pretty" && renderPrettyResponse()}
                                {responseView === "raw" && props.responseText}
                                {responseView === "headers" && JSON.stringify(props.responseHeaders, null, 2)}
                            </pre>
                        </div>
                    </div>
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-border" />

                {/* 3. HISTORY PANEL (Right) */}
                <ResizablePanel defaultSize={30}>
                    <div className="flex h-full flex-col">
                        <div className="flex items-center justify-between bg-background p-3 px-4">
                            <span className="font-semibold text-sm">HISTORY</span>
                            <Button size="sm" variant="default" onClick={props.onClearHistory}>Clear</Button>
                        </div>
                        <Separator className="border" />

                        <div className="flex-1 overflow-y-auto p-2 bg-muted/10 space-y-2">
                            {props.history.map((item) => (
                                <div
                                    key={item.ts}
                                    onClick={() => props.onHistorySelect(item.method, item.url)}
                                    className="cursor-pointer rounded border-2 border-border bg-background p-3 hover:bg-muted transition-colors shadow-sm"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-xs">{item.method}</span>
                                        <span className={`text-xs ${item.status >= 200 && item.status < 300 ? "text-green-600" : "text-red-600"}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground" title={item.url}>{item.url}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}