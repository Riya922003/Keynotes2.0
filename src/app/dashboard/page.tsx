export const dynamic = 'force-dynamic';

import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions as topAuthOptions } from "@/lib/auth"
import HelpFAB from "@/components/HelpFAB"
import { ThemeToggleButton } from "@/components/ThemeToggleButton"
import { DashboardUserNav } from "@/components/DashboardUserNav"
import RecentNotes from '@/components/dashboard/RecentNotes'
import QuickActions from '@/components/dashboard/QuickActions'

export default async function DashboardPage() {
  const session = await getServerSession(topAuthOptions)

  if (!session) {
    redirect('/')
  }

  return (
    <>
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <DashboardUserNav />
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
            <RecentNotes />
          </div>

          {/* Quick Actions Card */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <QuickActions />
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
