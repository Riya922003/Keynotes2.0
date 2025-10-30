"use client"

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { getCollaborators, inviteUserToNote, getUserById, removeCollaborator, searchUsersByPrefix } from '@/app/actions/collaborationActions'
import { Trash2, Edit, Eye } from 'lucide-react'
import Skeleton from '@/components/ui/skeleton'

interface ShareDialogProps {
  documentId: string
  authorId: string
  open: boolean
  onOpenChangeAction: (open: boolean) => void
}

type Collaborator = {
  id: string
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: 'editor' | 'viewer' | string
}

export default function ShareDialog({ documentId, authorId, open, onOpenChangeAction }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [suggestions, setSuggestions] = useState<Collaborator[]>([])
  const { toast } = useToast()

  // role selected by the owner when inviting; empty string shows placeholder 'Role'
  const [selectedRole, setSelectedRole] = useState<'' | 'Editor' | 'Viewer'>('')

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

  // Debounced user search for email suggestions
  useEffect(() => {
    let mounted = true
    let t: ReturnType<typeof setTimeout> | null = null

    const fetchSuggestions = async () => {
      if (!email || email.trim().length === 0) {
        if (mounted) setSuggestions([])
        return
      }
      try {
        const rows = await searchUsersByPrefix(email, documentId)
        if (!mounted) return
        setSuggestions((rows as Collaborator[]) || [])
      } catch {
        if (mounted) setSuggestions([])
      } finally {
        // no-op
      }
    }

    // Debounce 250ms
    t = setTimeout(fetchSuggestions, 250)

    return () => {
      mounted = false
      if (t) clearTimeout(t)
    }
  }, [email, documentId])

  async function onInvite(e: React.FormEvent) {
    e.preventDefault()

    try {
      // default to 'editor' if no role was selected in the UI
      const roleToSend = (selectedRole || 'Editor').toLowerCase() as 'editor' | 'viewer'
      const res = await inviteUserToNote(documentId, email, roleToSend)

      if ((res as { error?: string }).error) {
        const err = (res as { error?: string }).error
        // Friendly toast for unregistered users instead of a red box
        if (err === 'User not found.') {
          toast({ title: 'User not registered', description: 'That email is not registered. Ask them to sign up first.' })
        } else {
          toast({ title: 'Invite failed', description: err, variant: 'destructive' })
        }
        return
      }

      // Success toast
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
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
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
                      <div className="flex items-center gap-2">
                        {/* Role badge for clarity */}
                        <span
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                          title={c.role === 'editor' ? 'Editor — can edit document' : 'Viewer — view-only access'}
                          aria-label={`Role: ${c.role === 'editor' ? 'Editor' : 'Viewer'}`}
                        >
                          {c.role === 'editor' ? (
                            <Edit className="w-4 h-4 text-white bg-blue-600 rounded-full p-0.5" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground bg-muted/30 rounded-full p-0.5" />
                          )}
                          <span className="sr-only">{c.role === 'editor' ? 'Editor' : 'Viewer'}</span>
                        </span>

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
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={onInvite} className="flex gap-2 items-center relative">
            <div className="w-full">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email to invite" />

              {/* Suggestions dropdown */}
              <div className="absolute left-0 mt-1 w-full bg-popover border rounded-md shadow z-40">
                {suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setEmail(s.email || '')
                        setSuggestions([])
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar>
                          {s.avatar_url ? <AvatarImage src={s.avatar_url ?? undefined} alt={s.name ?? undefined} /> : <AvatarFallback>{(s.name || s.email || '').slice(0,2).toUpperCase()}</AvatarFallback>}
                        </Avatar>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">{s.name || s.email}</span>
                          <span className="text-xs text-muted-foreground">{s.email}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  // No suggestions: show a friendly hint and allow inviting the typed email (will fail if unregistered)
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No registered users found in this workspace.
                    <div className="text-xs text-muted-foreground mt-1">If the email is not registered they will need to sign up before they can be invited.</div>
                  </div>
                )}
              </div>
            </div>

            <Select onValueChange={(val) => setSelectedRole(val as 'Editor' | 'Viewer')} defaultValue={selectedRole}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit">Invite</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
