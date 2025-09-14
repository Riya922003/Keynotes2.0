import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center max-w-4xl px-6">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Your Space to Think and Create.
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          The simple, beautiful home for your private journals and collaborative notes.
        </p>
        <Button size="lg" className="text-lg px-8 py-6">
          Get Started for Free
        </Button>
      </div>
    </main>
  )
}
