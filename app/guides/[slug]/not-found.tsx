import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function GuideNotFound() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start mb-8">
          <Link href="/guides">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Guides
            </Button>
          </Link>
        </div>

        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Guide Not Found</h1>
          <p className="text-muted-foreground mb-8">
            Sorry, the guide you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/guides">
            <Button>Browse All Guides</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
