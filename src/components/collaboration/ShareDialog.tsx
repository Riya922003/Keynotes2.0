"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getCollaborators, inviteUserToNote, getUserById, removeCollaborator } from '@/app/actions/collaborationActions'
import { Trash2 } from 'lucide-react'
import Skeleton from '@/components/ui/skeleton'

interface ShareDialogProps {
  documentId: string
  authorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Collaborator = {
  id: string
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: 'editor' | 'viewer' | string
}

export default function ShareDialog({ documentId, authorId, open, onOpenChange }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const [ownerInfo, setOwnerInfo] = useState<{ name?: string | null, email?: string | null } | null>(null)
  const [removingIds, setRemovingIds] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    let mounted = true

    ;(async () => {
      try {
        setIsLoading(true)
        const rows = await getCollaborators(documentId)
        if (mounted) setCollaborators((rows as Collaborator[]) || [])
        // fetch owner info for display
        if (mounted && authorId) {
          const owner = await getUserById(authorId)
          setOwnerInfo(owner)
        }
      } catch {
        // swallow — we'll show whatever data we have
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [open, documentId, authorId])

  async function onInvite(e: React.FormEvent) {
    e.preventDefault()

    try {
      const res = await inviteUserToNote(documentId, email)

      if ((res as { error?: string }).error) {
        toast({ title: 'Invite failed', description: (res as { error?: string }).error, variant: 'destructive' })
        return
      }

      toast({ title: 'Invite sent', description: 'User invited successfully.' })

      // refresh list
      const rows = await getCollaborators(documentId)
      setCollaborators((rows as Collaborator[]) || [])
      setEmail('')
    } catch {
      toast({ title: 'Invite failed', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share this note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Current collaborators</h4>
            <div className="space-y-2">
              {/* Author/owner */}
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-2 w-24 rounded bg-muted/80" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={undefined} alt="Owner avatar" />
                    <AvatarFallback>O</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">Owner</div>
                    <div className="text-xs text-muted-foreground">
                      {ownerInfo?.name || ownerInfo?.email || null}
                    </div>
                  </div>
                </div>
              )}

              {isLoading ? (
                // Render 3 skeleton rows while loading
                [0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-3 w-40 rounded" />
                      <Skeleton className="h-2 w-24 rounded bg-muted/80" />
                    </div>
                  </div>
                ))
              ) : (
                collaborators.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {c.avatar_url ? <AvatarImage src={c.avatar_url ?? undefined} alt={c.name ?? undefined} /> : <AvatarFallback>{(c.name || c.email || '').slice(0,2).toUpperCase()}</AvatarFallback>}
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{c.name || c.email}</div>
                        <div className="text-xs text-muted-foreground">{c.role === 'editor' ? 'Editor' : 'Viewer'}</div>
                      </div>
                    </div>

                    {/* Delete button - don't show for the owner */}
                    {c.id !== authorId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 hover:bg-red-100 rounded-full transition-colors ${removingIds.includes(c.id) ? 'text-red-600 bg-red-100' : 'hover:text-red-600'}`}
                        title="Remove collaborator"
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (removingIds.includes(c.id)) return
                          setRemovingIds((s) => [...s, c.id])
                          try {
                            const res = await removeCollaborator(documentId, c.id)
                            if ((res as { error?: string }).error) {
                              toast({ title: 'Remove failed', description: (res as { error?: string }).error, variant: 'destructive' })
                            } else {
                              // optimistic client update
                              setCollaborators((rows) => rows.filter((r) => r.id !== c.id))
                              toast({ title: 'Removed', description: 'Collaborator removed.' })
                            }
                          } catch {
                            toast({ title: 'Remove failed', description: 'Something went wrong', variant: 'destructive' })
                          } finally {
                            setRemovingIds((s) => s.filter((id) => id !== c.id))
                          }
                        }}
                        aria-label={`Remove ${c.email || c.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={onInvite} className="flex gap-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email to invite" />
            <Button type="submit">Invite</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
