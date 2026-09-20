import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <header className="border-b-2 border-border bg-secondary-background">
            <nav
                aria-label="Main navigation"
                className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
            >
                <Link
                    href="/"
                    className="flex items-center gap-3 text-xl font-heading font-bold uppercase tracking-tight"
                >
                    <span className="grid size-9 place-items-center rounded-base border-2 border-border bg-main text-main-foreground shadow-shadow">
                        &gt;_
                    </span>
                    <span>API Dash</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Button render={<Link href="/docs" />} variant="neutral" size="sm">
                        <span className="hidden sm:inline">Documentation</span>
                        <ArrowUpRight />
                    </Button>
                </div>
            </nav>
        </header>
    )
}
