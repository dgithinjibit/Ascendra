/**
 * Gamification - Points System
 *
 * Awards points for:
 * - Correct answers (base: 10 points)
 * - Difficulty bonus (L1: 5, L2: 10, L3: 15, L4: 20)
 * - Streak bonus (10 points per day in streak, max 100)
 * - First mastery of competency (50 points)
 * - Weekly engagement (20+ messages = 25 points bonus)
 * - Subject mastery (all competencies in subject mastered = 100 points)
 */

import { supabase } from '../supabase/client';
import type { DifficultyLevel } from '../adaptive-difficulty';

export interface PointsBreakdown {
  basePoints: number;
  difficultyBonus: number;
  streakBonus: number;
  masteryBonus: number;
  totalPoints: number;
}

export interface WeeklyPointsBreakdown {
  breakdown: Record<string, number>;
  totalWeeklyPoints: number;
}

/**
 * Award points for a correct answer
 */
export async function awardPointsForCorrectAnswer(
  userId: string,
  competencyCode: string,
  difficultyLevel: DifficultyLevel,
  streakDays: number
): Promise<PointsBreakdown> {
  const basePoints = 10;
  const difficultyBonus = getDifficultyBonusPoints(difficultyLevel);
  const streakBonus = Math.min(streakDays * 10, 100);

  const breakdown: PointsBreakdown = {
    basePoints,
    difficultyBonus,
    streakBonus,
    masteryBonus: 0,
    totalPoints: basePoints + difficultyBonus + streakBonus,
  };

  try {
    // Add points to user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    const newTotal = (profile?.total_points || 0) + breakdown.totalPoints;

    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', userId);

    // Log the point transaction
    await supabase.from('point_transactions').insert({
      user_id: userId,
      competency_code: competencyCode,
      transaction_type: 'correct_answer',
      base_points: basePoints,
      difficulty_bonus: difficultyBonus,
      streak_bonus: streakBonus,
      mastery_bonus: 0,
      total_points: breakdown.totalPoints,
    });
  } catch (error) {
    console.error('Error awarding points:', error);
  }

  return breakdown;
}

/**
 * Award mastery bonus points
 */
export async function awardMasteryBonus(
  userId: string,
  competencyCode: string,
  competencyName: string
): Promise<number> {
  const masteryBonus = 50;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    const newTotal = (profile?.total_points || 0) + masteryBonus;
    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', userId);

    await supabase.from('point_transactions').insert({
      user_id: userId,
      competency_code: competencyCode,
      transaction_type: 'competency_mastered',
      base_points: masteryBonus,
      difficulty_bonus: 0,
      streak_bonus: 0,
      mastery_bonus: masteryBonus,
      total_points: masteryBonus,
    });
  } catch (error) {
    console.error('Error awarding mastery bonus:', error);
  }

  return masteryBonus;
}

/**
 * Award subject mastery bonus (all competencies mastered)
 */
export async function awardSubjectMasteryBonus(
  userId: string,
  subject: string
): Promise<number> {
  const subjectMasteryBonus = 100;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    const newTotal = (profile?.total_points || 0) + subjectMasteryBonus;
    await supabase.from('profiles').update({ total_points: newTotal }).eq('id', userId);

    await supabase.from('point_transactions').insert({
      user_id: userId,
      competency_code: `${subject}_subject_mastery`,
      transaction_type: 'subject_mastered',
      base_points: subjectMasteryBonus,
      difficulty_bonus: 0,
      streak_bonus: 0,
      mastery_bonus: subjectMasteryBonus,
      total_points: subjectMasteryBonus,
    });
  } catch (error) {
    console.error('Error awarding subject mastery bonus:', error);
  }

  return subjectMasteryBonus;
}

/**
 * Get difficulty bonus points
 */
function getDifficultyBonusPoints(difficultyLevel: DifficultyLevel): number {
  const bonuses: Record<DifficultyLevel, number> = {
    L1: 5,
    L2: 10,
    L3: 15,
    L4: 20,
  };
  return bonuses[difficultyLevel];
}

/**
 * Get student's current rank based on total points
 */
export async function getStudentRank(userId: string): Promise<number> {
  try {
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (!studentProfile) return 0;

    // Count how many students have more points
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gt('total_points', studentProfile.total_points);

    return (count || 0) + 1; // Rank is position in leaderboard (1-indexed)
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 0;
  }
}

/**
 * Get class/school leaderboard
 */
export async function getClassLeaderboard(
  classId: string,
  limit: number = 10
): Promise<Array<{ rank: number; name: string; totalPoints: number; userId: string }>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, total_points, classroom_id')
      .eq('classroom_id', classId)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((profile, index) => ({
      rank: index + 1,
      name: profile.full_name || 'Student',
      totalPoints: profile.total_points || 0,
      userId: profile.id,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get school-wide leaderboard
 */
export async function getSchoolLeaderboard(
  schoolId: string,
  limit: number = 20
): Promise<Array<{ rank: number; name: string; totalPoints: number; userId: string }>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, total_points, school_id')
      .eq('school_id', schoolId)
      .order('total_points', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((profile, index) => ({
      rank: index + 1,
      name: profile.full_name || 'Student',
      totalPoints: profile.total_points || 0,
      userId: profile.id,
    }));
  } catch (error) {
    console.error('Error fetching school leaderboard:', error);
    return [];
  }
}

/**
 * Get student's weekly points breakdown
 */
export async function getWeeklyPointsBreakdown(
  userId: string
): Promise<WeeklyPointsBreakdown> {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by transaction type and sum
    const breakdown = (data || []).reduce(
      (acc, transaction) => {
        const type = transaction.transaction_type;
        acc[type] = (acc[type] || 0) + transaction.total_points;
        return acc;
      },
      {} as Record<string, number>
    );

    const totalWeeklyPoints = Object.values(breakdown).reduce(
      (sum, points) => sum + points,
      0
    );

    return { breakdown, totalWeeklyPoints };
  } catch (error) {
    console.error('Error fetching weekly breakdown:', error);
    return { breakdown: {}, totalWeeklyPoints: 0 };
  }
}
