'use client';

import { Brain, PlayCircle, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type ScaffoldingLevel = 'Independent' | 'Guided' | 'Intensive';

export interface SubjectHeaderProps {
  label: string;
  slug: string;
  totalXP: number;
  level: number;
  nextLevelXP: number;
  resumeActivity?: { id: string; name: string; progress: number } | null;
  grade: string;
  scaffoldingLevel?: ScaffoldingLevel | null;
  onResume: () => void;
  onStartFresh: () => void;
}

const SCAFFOLDING_BADGE: Record<
  ScaffoldingLevel,
  { label: string; className: string; title: string }
> = {
  Independent: {
    label: '🟢 Independent',
    className: 'border-green-300 bg-green-50 text-green-800',
    title: 'You are working independently — great mastery!',
  },
  Guided: {
    label: '🟡 Guided',
    className: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    title: 'Your tutor is giving you guided hints.',
  },
  Intensive: {
    label: '🔵 Intensive',
    className: 'border-blue-300 bg-blue-50 text-blue-800',
    title: 'Your tutor is breaking topics into small steps to support you.',
  },
};

/**
 * Sticky subject page header showing XP badge, level progress,
 * Omega scaffolding level, and optional resume / start-fresh actions.
 */
export function SubjectHeader({
  label,
  totalXP,
  level,
  nextLevelXP,
  resumeActivity,
  scaffoldingLevel,
  onResume,
  onStartFresh,
}: SubjectHeaderProps) {
  const scaffoldBadge = scaffoldingLevel ? SCAFFOLDING_BADGE[scaffoldingLevel] : null;

  return (
    <div className="flex flex-col gap-4 border-b border-teal-100 bg-white/80 px-5 pb-4 pt-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-8">
      {/* Left: title + XP + scaffolding */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-teal-950 sm:text-3xl">
            {label}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="gap-1 border-amber-300 bg-amber-50 text-amber-800 font-semibold"
            >
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              Level {level}
            </Badge>
            <span className="text-sm text-teal-700 font-medium">
              {totalXP.toLocaleString()} XP
            </span>
            {level < 5 && (
              <span className="text-xs text-teal-500">
                · {nextLevelXP.toLocaleString()} to Level {level + 1}
              </span>
            )}
            {scaffoldBadge && (
              <Badge
                variant="outline"
                className={`gap-1 font-medium text-xs ${scaffoldBadge.className}`}
                title={scaffoldBadge.title}
              >
                <Brain className="h-3 w-3" />
                {scaffoldBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right: resume / start buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {resumeActivity ? (
          <>
            <Button
              onClick={onResume}
              size="sm"
              className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <PlayCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Continue:</span>{' '}
              {resumeActivity.name}
              <span className="text-xs opacity-75 ml-1">
                {resumeActivity.progress}%
              </span>
            </Button>
            <Button
              onClick={onStartFresh}
              variant="outline"
              size="sm"
              className="gap-1 text-teal-700 border-teal-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start fresh
            </Button>
          </>
        ) : (
          <Button
            onClick={onStartFresh}
            size="sm"
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            <PlayCircle className="h-4 w-4" />
            Start learning
          </Button>
        )}
      </div>
    </div>
  );
}
