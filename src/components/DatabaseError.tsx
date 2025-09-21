'use client'

interface DatabaseErrorProps {
  error: string
}

export default function DatabaseError({ error }: DatabaseErrorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Database Connection Error</h1>
        <p className="text-muted-foreground mb-4">
          Unable to connect to the database. Please check your internet connection and try again.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Error: {error}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  )
}