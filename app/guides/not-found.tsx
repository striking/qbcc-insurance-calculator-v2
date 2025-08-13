import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export default function GuideNotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 px-4 text-center">
      <h1 className="text-5xl sm:text-6xl font-bold mb-4">404</h1>
      <h2 className="text-xl sm:text-2xl font-semibold mb-6">Guide Not Found</h2>
      <p className="text-muted-foreground mb-8 max-w-md text-sm sm:text-base">
        The guide you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/guides">
        <Button className="min-w-[200px]">
          <BookOpen className="mr-2 h-4 w-4" />
          Browse All Guides
        </Button>
      </Link>
    </div>
  )
}
