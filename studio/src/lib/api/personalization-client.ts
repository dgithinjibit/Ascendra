/**
 * Personalization API Client
 * 
 * Type-safe client for student personalization endpoints.
 * Eliminates primitive obsession and URL string construction errors.
 */

export interface StudentProfile {
  id: string;
  name: string;
  grade: string;
  avatar?: string;
  streak: number;
  totalXP: number;
}

export interface SubjectProgress {
  subject: string;
  level: number;
  progress: number;
  xp: number;
  lastAccessed?: string;
}

export interface PersonalizationResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class PersonalizationApiClient {
  private baseUrl = '/api/test-personalization';
  private timeout = 10000; // 10 seconds

  private async fetchWithTimeout(url: string, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async getProfile(userId: string): Promise<StudentProfile> {
    const url = `${this.baseUrl}?action=profile&userId=${encodeURIComponent(userId)}`;
    
    try {
      const res = await this.fetchWithTimeout(url, this.timeout);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data as StudentProfile;
    } catch (error) {
      console.error('[PersonalizationClient] getProfile error:', error);
      throw new Error('Profile unavailable');
    }
  }

  async getProgress(userId: string, subject: string): Promise<SubjectProgress> {
    const url = `${this.baseUrl}?action=progress&userId=${encodeURIComponent(userId)}&subject=${encodeURIComponent(subject)}`;
    
    try {
      const res = await this.fetchWithTimeout(url, this.timeout);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch progress: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data as SubjectProgress;
    } catch (error) {
      console.error(`[PersonalizationClient] getProgress error for ${subject}:`, error);
      throw new Error(`Progress unavailable for ${subject}`);
    }
  }

  async getProgressForSubjects(userId: string, subjects: string[]): Promise<(SubjectProgress | null)[]> {
    return Promise.all(
      subjects.map(async (subject) => {
        try {
          return await this.getProgress(userId, subject);
        } catch (error) {
          console.warn(`Failed to get progress for ${subject}:`, error);
          return null;
        }
      })
    );
  }
}

// Singleton instance
export const personalizationClient = new PersonalizationApiClient();

// Convenience exports
export const getProfile = (userId: string) => personalizationClient.getProfile(userId);
export const getProgress = (userId: string, subject: string) => 
  personalizationClient.getProgress(userId, subject);
export const getProgressForSubjects = (userId: string, subjects: string[]) => 
  personalizationClient.getProgressForSubjects(userId, subjects);
