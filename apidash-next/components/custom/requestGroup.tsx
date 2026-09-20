import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, SendIcon } from "lucide-react"

type RequestOption = {
    value: string
    label: string
}

type RequestBarProps = {
    request: RequestOption[]
    method?: string
    url?: string
    loading?: boolean
    onMethodChange?: (method: string) => void
    onUrlChange: (url: string) => void
    onSend: () => void
}

export default function RequestBar({
    request,
    method = "GET",
    url = "",
    loading = false,
    onMethodChange,
    onUrlChange,
    onSend,
}: RequestBarProps) {
    return (
        <section className="bg-background px-4 py-4 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-10xl flex-col gap-3 sm:flex-row">
                <div className="flex gap-2 sm:w-auto">
                    <Select value={method} onValueChange={(value) => value && onMethodChange?.(value)}>
                        <SelectTrigger aria-label="HTTP method" className="w-full sm:w-28">
                            <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {request.map((req) => (
                                    <SelectItem key={req.value} value={req.value}>
                                        {req.label}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <Input
                    aria-label="Request URL"
                    type="url"
                    placeholder="https://api.example.com"
                    value={url}
                    onChange={(event) => onUrlChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" && !loading) onSend()
                    }}
                    className="min-w-0 flex-1 bg-secondary-background"
                />
                <Button
                    type="button"
                    onClick={onSend}
                    disabled={loading}
                    className="sm:min-w-28"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <SendIcon />}
                    {loading ? "Sending" : "Send"}
                </Button>
            </div>
        </section>
    )
}