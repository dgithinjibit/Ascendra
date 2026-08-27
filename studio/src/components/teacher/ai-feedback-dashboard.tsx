"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ThumbsUp, ThumbsDown, MessageSquare, TrendingUp, Brain, 
  CheckCircle, XCircle, AlertCircle, Lightbulb, Users, Award
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getApiUrl } from '@/lib/api-config'

interface AIDecision {
  id: string
  decision_id: string
  student_id: string
  competency: string
  grade: string
  subject: string
  ai_action: string
  ai_reasoning: string
  ai_response: string
  fired_rules: Array<{
    rule_id: string
    name: string
    explanation: string
    confidence: number
  }>
  scaffolding_level: string
  examples_used: string[]
  teacher_feedback: string | null
  teacher_comment: string | null
  created_at: string
}

interface FeedbackSummary {
  total_decisions: number
  feedback_given: number
  helpful_count: number
  not_helpful_count: number
  feedback_rate: number
  top_competencies: Array<{ competency: string; count: number }>
  recent_decisions: AIDecision[]
}

export function AIFeedbackDashboard({ teacherId }: { teacherId: string }) {
  const { toast } = useToast()
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [pendingDecisions, setPendingDecisions] = useState<AIDecision[]>([])
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [suggestedAlternative, setSuggestedAlternative] = useState('')
  const [loading, setLoading] = useState(false)

  const apiUrl = getApiUrl()

  useEffect(() => {
    fetchSummary()
    fetchPendingDecisions()
  }, [teacherId])

  const fetchSummary = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/teacher-feedback/summary?teacher_id=${teacherId}`
      )
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  const fetchPendingDecisions = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/teacher-feedback/decisions?teacher_id=${teacherId}&feedback_status=pending&limit=20`
      )
      if (response.ok) {
        const data = await response.json()
        setPendingDecisions(data)
      }
    } catch (error) {
      console.error('Failed to fetch pending decisions:', error)
    }
  }

  const submitFeedback = async (decisionId: string, feedback: 'helpful' | 'not_helpful') => {
    setLoading(true)
    try {
      const response = await fetch(`${apiUrl}/teacher-feedback/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_id: decisionId,
          feedback,
          comment: feedbackComment || null,
          suggested_alternative: suggestedAlternative || null
        })
      })

      if (response.ok) {
        toast({
          title: 'Feedback Submitted!',
          description: 'Thank you for helping syncsenta learn',
        })
        
        // Refresh data
        fetchSummary()
        fetchPendingDecisions()
        
        // Clear form
        setSelectedDecision(null)
        setFeedbackComment('')
        setSuggestedAlternative('')
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AI Feedback Dashboard</h1>
          <Badge variant="secondary">Help syncsenta Learn</Badge>
        </div>
        <p className="text-muted-foreground">
          Review AI decisions and help build Kenya's best pedagogical intelligence
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total AI Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total_decisions}</div>
              <p className="text-xs text-muted-foreground mt-1">
                For your students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Feedback Given</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.feedback_given}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(summary.feedback_rate * 100).toFixed(0)}% feedback rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Helpful Decisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{summary.helpful_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI is learning!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Needs Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{summary.not_helpful_count}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Your feedback helps
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review ({pendingDecisions.length})
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Feedback</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingDecisions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">
                  No pending AI decisions to review
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Decision List */}
              <div className="space-y-3">
                <h3 className="font-semibold">AI Decisions Needing Review</h3>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3 pr-4">
                    {pendingDecisions.map((decision) => (
                      <Card
                        key={decision.id}
                        className={`cursor-pointer transition-colors ${
                          selectedDecision?.id === decision.id
                            ? 'border-primary'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedDecision(decision)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">
                                {decision.competency}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {decision.grade} • {decision.subject}
                              </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {decision.scaffolding_level}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-2">
                            {decision.ai_response}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {decision.fired_rules?.map((rule) => (
                              <Badge key={rule.rule_id} variant="secondary" className="text-xs">
                                {rule.name}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Decision Detail & Feedback Form */}
              <div>
                {selectedDecision ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Review AI Decision</CardTitle>
                      <CardDescription>
                        Was this helpful for the student?
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* AI Response */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2">AI Response:</h4>
                        <div className="bg-muted p-3 rounded-md text-sm">
                          {selectedDecision.ai_response}
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      {selectedDecision.ai_reasoning && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Why AI chose this approach:
                          </h4>
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                            {selectedDecision.ai_reasoning}
                          </div>
                        </div>
                      )}

                      {/* Fired Rules */}
                      {selectedDecision.fired_rules && selectedDecision.fired_rules.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Pedagogical Rules Applied:</h4>
                          <div className="space-y-2">
                            {selectedDecision.fired_rules.map((rule) => (
                              <div key={rule.rule_id} className="bg-muted p-2 rounded-md text-xs">
                                <div className="font-semibold">{rule.name}</div>
                                <div className="text-muted-foreground">{rule.explanation}</div>
                                <div className="mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    Confidence: {(rule.confidence * 100).toFixed(0)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Examples Used */}
                      {selectedDecision.examples_used && selectedDecision.examples_used.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Cultural Context Used:</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedDecision.examples_used.map((example, idx) => (
                              <Badge key={idx} variant="secondary">
                                {example}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Feedback Form */}
                      <div className="border-t pt-4 space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Your Feedback (optional):
                          </label>
                          <Textarea
                            placeholder="What worked well? What could be improved?"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Suggest Better Approach (optional):
                          </label>
                          <Textarea
                            placeholder="What would you have done instead?"
                            value={suggestedAlternative}
                            onChange={(e) => setSuggestedAlternative(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => submitFeedback(selectedDecision.decision_id, 'helpful')}
                            disabled={loading}
                            className="flex-1"
                            variant="default"
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Helpful
                          </Button>
                          <Button
                            onClick={() => submitFeedback(selectedDecision.decision_id, 'not_helpful')}
                            disabled={loading}
                            className="flex-1"
                            variant="outline"
                          >
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Not Helpful
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Select a Decision</h3>
                      <p className="text-sm text-muted-foreground">
                        Click on a decision to review and provide feedback
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Recent Feedback Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Your Recent Feedback</CardTitle>
              <CardDescription>
                Decisions you've already reviewed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary && summary.recent_decisions.length > 0 ? (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {summary.recent_decisions
                      .filter(d => d.teacher_feedback)
                      .map((decision) => (
                        <div key={decision.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-sm">{decision.competency}</div>
                              <div className="text-xs text-muted-foreground">
                                {decision.grade} • {decision.subject}
                              </div>
                            </div>
                            <Badge
                              variant={decision.teacher_feedback === 'helpful' ? 'default' : 'secondary'}
                            >
                              {decision.teacher_feedback === 'helpful' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Helpful</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Not Helpful</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{decision.ai_response}</p>
                          {decision.teacher_comment && (
                            <div className="bg-muted p-2 rounded text-xs mt-2">
                              <span className="font-semibold">Your comment:</span> {decision.teacher_comment}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No feedback given yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Competencies
                </CardTitle>
                <CardDescription>
                  Where AI is helping your students most
                </CardDescription>
              </CardHeader>
              <CardContent>
                {summary && summary.top_competencies.length > 0 ? (
                  <div className="space-y-3">
                    {summary.top_competencies.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{comp.competency}</span>
                        <Badge variant="secondary">{comp.count} decisions</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Impact
                </CardTitle>
                <CardDescription>
                  How you're helping syncsenta learn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {summary ? summary.feedback_given : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pieces of feedback given
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {summary ? ((summary.helpful_count / Math.max(summary.feedback_given, 1)) * 100).toFixed(0) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI decisions were helpful
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm">
                    <p className="font-semibold mb-1">🎯 Keep it up!</p>
                    <p className="text-xs">
                      Your feedback is training syncsenta to understand Kenyan students better.
                      Every review helps build the world's best CBC-aligned pedagogical intelligence.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
