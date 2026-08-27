'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type AssessmentDraft = {
  id: string
  grade: string
  subject: string
  term: string
  assessment_period: string
  title: string
  total_marks: number
  status: string
}

export function AssessmentRecordsPanel() {
  const { toast } = useToast()
  const [grade, setGrade] = useState('Grade 5')
  const [subject, setSubject] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [period, setPeriod] = useState('midterm')
  const [title, setTitle] = useState('')
  const [totalMarks, setTotalMarks] = useState('')
  const [drafts, setDrafts] = useState<AssessmentDraft[]>([])
  const [saving, setSaving] = useState(false)

  const loadDrafts = async () => {
    const response = await fetch('/api/teacher/assessments')
    if (response.ok) {
      const data = await response.json()
      setDrafts(data.assessments || [])
    }
  }

  useEffect(() => { void loadDrafts() }, [])

  const saveDraft = async () => {
    if (!subject.trim() || !title.trim()) {
      toast({ title: 'Missing assessment details', description: 'Subject and title are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const response = await fetch('/api/teacher/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, subject, term, assessment_period: period, title, total_marks: Number(totalMarks) || 0 }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to save assessment draft')
      setDrafts((previous) => [data.assessment, ...previous])
      setTitle('')
      setTotalMarks('')
      toast({ title: 'Assessment draft saved', description: 'The formal paper is now available in your assessment register.' })
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Unable to save draft', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" />Assessment Register</CardTitle>
        <CardDescription>Save formal papers as draft records before publishing or marking.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-2"><Label>Grade</Label><Input value={grade} onChange={(event) => setGrade(event.target.value)} /></div>
          <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Kiswahili" /></div>
          <div className="space-y-2"><Label>Term</Label><Select value={term} onValueChange={setTerm}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Term 1">Term 1</SelectItem><SelectItem value="Term 2">Term 2</SelectItem><SelectItem value="Term 3">Term 3</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Paper type</Label><Select value={period} onValueChange={setPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="midterm">Midterm</SelectItem><SelectItem value="end_of_term">End of term</SelectItem><SelectItem value="formative">Formative</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Total marks</Label><Input type="number" min="0" value={totalMarks} onChange={(event) => setTotalMarks(event.target.value)} placeholder="40" /></div>
        </div>
        <div className="flex gap-3"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assessment title" /><Button onClick={saveDraft} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save draft'}</Button></div>
        {drafts.length > 0 && <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Title</th><th className="p-2">Grade / Subject</th><th className="p-2">Term</th><th className="p-2">Type</th><th className="p-2">Status</th></tr></thead><tbody>{drafts.map((draft) => <tr key={draft.id} className="border-b"><td className="p-2">{draft.title}</td><td className="p-2">{draft.grade} / {draft.subject}</td><td className="p-2">{draft.term}</td><td className="p-2">{draft.assessment_period}</td><td className="p-2">{draft.status}</td></tr>)}</tbody></table></div>}
      </CardContent>
    </Card>
  )
}
