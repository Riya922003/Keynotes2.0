import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import JournalClientPage from '@/app/journal/JournalClientPage'
import { getJournalEntries } from '@/app/actions/noteActions'

export default async function JournalPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  const params = await searchParams
  const month = params?.month as string | undefined

  // Fetch journal entries for the current user
  try {
    const entries = await getJournalEntries(month)
    return <JournalClientPage initialEntries={entries} currentMonth={month} />
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Journal</h1>
        <p className="text-red-500">Failed to load journal entries. Please try again.</p>
      </div>
    )
  }
}
