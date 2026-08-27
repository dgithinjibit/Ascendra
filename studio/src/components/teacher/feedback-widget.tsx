'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FeedbackWidgetProps {
  contentType: 'scheme' | 'lesson_plan' | 'assessment' | 'worksheet' | 'text_leveler' | 'standards_unpacker';
  contentId: string;
  context?: Record<string, any>; // Generation parameters for learning
  onFeedbackSubmitted?: () => void;
  className?: string;
}

export function FeedbackWidget({
  contentType,
  contentId,
  context,
  onFeedbackSubmitted,
  className = '',
}: FeedbackWidgetProps) {
  const [rating, setRating] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [improvementSuggestions, setImprovementSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleRatingClick = (selectedRating: 'thumbs_up' | 'thumbs_down') => {
    setRating(selectedRating);
    if (selectedRating === 'thumbs_down') {
      // Open dialog for negative feedback to get details
      setShowDialog(true);
    } else {
      // For positive feedback, submit immediately
      submitFeedback(selectedRating, '', '');
    }
  };

  const submitFeedback = async (
    finalRating: 'thumbs_up' | 'thumbs_down',
    feedback: string,
    suggestions: string
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/teacher/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          rating: finalRating,
          feedback_text: feedback || null,
          improvement_suggestions: suggestions || null,
          context: context || null,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || payload.detail || 'Failed to save feedback');
      }

      toast({
        title: 'Feedback submitted',
        description: finalRating === 'thumbs_up' 
          ? 'Thank you for your positive feedback!' 
          : 'Thank you for helping us improve!',
      });

      // Reset state
      setShowDialog(false);
      setFeedbackText('');
      setImprovementSuggestions('');
      
      // Notify parent component
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Feedback submission failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogSubmit = () => {
    if (rating) {
      submitFeedback(rating, feedbackText, improvementSuggestions);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setRating(null);
    setFeedbackText('');
    setImprovementSuggestions('');
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-muted-foreground">Rate this output:</span>
        <Button
          variant={rating === 'thumbs_up' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleRatingClick('thumbs_up')}
          disabled={isSubmitting}
          className="gap-1"
        >
          <ThumbsUp className="h-4 w-4" />
          Good
        </Button>
        <Button
          variant={rating === 'thumbs_down' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleRatingClick('thumbs_down')}
          disabled={isSubmitting}
          className="gap-1"
        >
          <ThumbsDown className="h-4 w-4" />
          Needs Work
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Help Us Improve
            </DialogTitle>
            <DialogDescription>
              Your feedback helps us generate better content for you. Please tell us what went wrong and how we can improve.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">What went wrong?</Label>
              <Textarea
                id="feedback"
                placeholder="e.g., The activities don't match the learning outcomes, or the language is too complex for Grade 4..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suggestions">How should we handle it differently?</Label>
              <Textarea
                id="suggestions"
                placeholder="e.g., Include more hands-on activities, use simpler vocabulary, add more Kenyan examples..."
                value={improvementSuggestions}
                onChange={(e) => setImprovementSuggestions(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Made with Bob
