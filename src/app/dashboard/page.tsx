import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  console.log('Dashboard page - session:', session ? 'exists' : 'null')

  if (!session) {
    console.log('No session found, redirecting to home page')
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">
        Welcome to your Dashboard, {session.user?.name}!
      </h1>
      <p className="text-muted-foreground mt-4">Your personalized workspace will appear here.</p>
    </div>
  )
}
