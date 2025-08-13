import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, BookOpen } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
      <h1 className="text-5xl sm:text-6xl font-bold mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-sm sm:text-base">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/">
          <Button className="w-full sm:w-auto min-w-[180px]">
            <Home className="mr-2 h-4 w-4" />
            Return to Calculator
          </Button>
        </Link>
        <Link href="/guides">
          <Button variant="outline" className="w-full sm:w-auto min-w-[180px]">
            <BookOpen className="mr-2 h-4 w-4" />
            Browse Guides
          </Button>
        </Link>
      </div>
    </div>
  )
}
