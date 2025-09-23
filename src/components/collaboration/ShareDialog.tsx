"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getCollaborators, inviteUserToNote, getUserById } from '@/app/actions/collaborationActions'

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
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  // Friendly short form for owner id (keep full id in tooltip/title)
  const shortAuthorId = authorId && authorId.length > 12 ? `${authorId.slice(0,8)}...${authorId.slice(-4)}` : authorId
  const [ownerInfo, setOwnerInfo] = useState<{ name?: string | null, email?: string | null } | null>(null)

  useEffect(() => {
    if (!open) return

    let mounted = true

    ;(async () => {
      try {
        const rows = await getCollaborators(documentId)
        if (mounted) setCollaborators((rows as Collaborator[]) || [])
        // fetch owner info for display
        if (mounted && authorId) {
          const owner = await getUserById(authorId)
          setOwnerInfo(owner)
        }
      } catch (_err) {
        // swallow — we'll show whatever data we have
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
    } catch (_err) {
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
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={undefined} alt="Owner avatar" />
                  <AvatarFallback>O</AvatarFallback>
                </Avatar>
                <div>
              <div className="text-sm font-medium">Owner</div>
                  <div className="text-xs text-muted-foreground" title={authorId}>
                    {ownerInfo?.name || ownerInfo?.email || shortAuthorId}
                  </div>
                </div>
              </div>

              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar>
                    {c.avatar_url ? <AvatarImage src={c.avatar_url ?? undefined} alt={c.name ?? undefined} /> : <AvatarFallback>{(c.name || c.email || '').slice(0,2).toUpperCase()}</AvatarFallback>}
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{c.name || c.email}</div>
                    <div className="text-xs text-muted-foreground">{c.role === 'editor' ? 'Editor' : 'Viewer'}</div>
                  </div>
                </div>
              ))}
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
