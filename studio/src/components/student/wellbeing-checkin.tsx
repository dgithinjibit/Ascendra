'use client'

import { useState } from 'react'
import { HeartHandshake, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

const options = [
  ['ready', 'I feel ready to learn'],
  ['unsure', 'I am not sure yet'],
  ['tired', 'I feel tired'],
  ['upset', 'Something is bothering me'],
  ['needs_help', 'I need help from a trusted adult'],
  ['prefer_not_to_say', 'I prefer not to say'],
] as const

export function WellbeingCheckIn() {
  const { toast } = useToast()
  const [state, setState] = useState<typeof options[number][0]>('ready')
  const [visibility, setVisibility] = useState('student_only')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/student/wellbeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_version: 'wellbeing-v1', state, note: note || undefined, support_requested: state === 'needs_help', visibility }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to save check-in')
      setNote('')
      toast({ title: 'Check-in saved', description: 'Thank you. You are in control of who can see this.' })
    } catch (error) {
      toast({ title: 'Check-in not saved', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><HeartHandshake className="h-4 w-4 text-primary" />How are you feeling about learning?</CardTitle>
        <CardDescription>You choose what to share. This is not camera or face detection.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={state} onValueChange={(value) => setState(value as typeof state)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{options.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional: tell your teacher what would help." maxLength={500} rows={2} />
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2"><Select value={visibility} onValueChange={setVisibility}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student_only">Only me</SelectItem><SelectItem value="teacher">Share with my teacher</SelectItem><SelectItem value="teacher_and_parent">Share with teacher and parent/guardian</SelectItem><SelectItem value="safeguarding_team">Share with safeguarding team</SelectItem></SelectContent></Select><Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save check-in'}</Button></div>
      </CardContent>
    </Card>
  )
}
