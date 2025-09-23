import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { getAuthOptions } from '@/lib/auth'
import GetStartedButton from '@/components/GetStartedButton'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import Features from '@/components/landing/Features'
import SocialProof from '@/components/landing/SocialProof'
import Image from 'next/image'
import HelpFAB from '@/components/HelpFAB'

export default async function Home() {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <>
      {/* Hero Section */}
      <section className="w-full bg-background py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 container mx-auto px-6">
        {/* Left: Text Content */}
        <div className="flex-1 flex flex-col gap-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
            Collaborate, Journal, and Grow Together
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            Keynotes is your seamless space for collaborative note-taking and journaling. Capture ideas, share thoughts, and build knowledge with friends, teams, or the world. Minimal, secure, and always inspiring.
          </p>
          <div className="flex gap-4 mt-2">
            <GetStartedButton />
            <button className="flex items-center gap-2 px-4 py-2 rounded bg-muted text-foreground hover:bg-muted/80 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z"/></svg>
              Watch Demo
            </button>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <span>⭐ Trusted by 10,000+ users & teams</span>
          </div>
        </div>
        {/* Right: Image/Illustration */}
        <div className="flex-1 flex items-center justify-center">
          <Image src="/assets/Images/j4.png" alt="Collaborative journaling" width={480} height={360} className="rounded-xl object-cover border border-gray-200 dark:border-gray-800" />
        </div>
      </section>

      {/* Floating Action Button (FAB) */}
      <HelpFAB />

      {/* Features Section */}
      <FeatureShowcase />
      {/* Additional Features */}
      <Features />
      {/* Social Proof Section */}
      <SocialProof />
    </>
  )
}
