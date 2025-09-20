import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import HelpFAB from "@/components/HelpFAB"
import { ThemeToggleButton } from "@/components/ThemeToggleButton"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/')
  }

  return (
    <>
      {/* Top Right Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>

      {/* Dashboard Header */}
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user?.name}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here&apos;s your personalized workspace. Start creating and organizing your thoughts.
          </p>
        </div>
      </div>

      <div className="space-y-6">

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Recent Notes Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Notes</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Project Ideas</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Meeting Notes</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Daily Journal</p>
                <p className="text-xs text-muted-foreground">3 days ago</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/notes"
                className="block w-full p-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors text-center"
              >
                Create New Note
              </Link>
              <Link 
                href="/notes"
                className="block w-full p-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors text-center"
              >
                Start Journal Entry
              </Link>
              <button className="w-full p-3 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                Browse Templates
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Your Progress</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Notes</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <HelpFAB />
    </>
  )
}
