import { getHardcodedStrands, getSubjectsForGrade } from './index'

// Lazy-loaded curriculum data structure to avoid server-side initialization issues
// Data is loaded on-demand when accessed, preventing 500 errors during SSR
type CurriculumStructure = {
  'lower-primary': {
    'grade-1': Record<string, any>
    'grade-2': Record<string, any>
    'grade-3': Record<string, any>
  }
  'upper-primary': {
    'grade-4': Record<string, any>
    'grade-5': Record<string, any>
    'grade-6': Record<string, any>
  }
}

let _curriculumDataCache: CurriculumStructure | null = null

// Lazy getter that only loads data when first accessed
export const curriculumData = new Proxy({} as CurriculumStructure, {
  get(target, level: string) {
    // Initialize cache on first access
    if (!_curriculumDataCache) {
      _curriculumDataCache = {
        'lower-primary': {
          'grade-1': {},
          'grade-2': {},
          'grade-3': {},
        },
        'upper-primary': {
          'grade-4': {},
          'grade-5': {},
          'grade-6': {},
        },
      }
    }

    const levelData = _curriculumDataCache[level as keyof CurriculumStructure]
    if (!levelData) return undefined

    // Return a proxy for the grade level
    return new Proxy(levelData, {
      get(gradeTarget, grade: string) {
        const gradeData = gradeTarget[grade as keyof typeof gradeTarget]
        if (!gradeData) return undefined

        // Return a proxy for the subject level that loads data on demand
        return new Proxy(gradeData, {
          get(subjectTarget, subject: string) {
            const subjects = subjectTarget as Record<string, any>
            // Check if already loaded
            if (subjects[subject]) {
              return subjects[subject]
            }

            // Load on demand
            const gradeKey = grade.replace('grade-', 'Grade ')
            const subjectKey = subject
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .replace('Cre', 'CRE')
              .replace('Hre', 'HRE')
              .replace('Ire', 'IRE')
              .replace('English Activities', 'English Activities')
              .replace('Environmental Activities', 'Environmental Activities')
              .replace('Creative Activities', 'Creative Activities')
              .replace('Creative Arts', 'Creative Arts')
              .replace('Science Technology', 'Science & Technology')
              .replace('Indigenous Language', 'Indigenous Language')
              .replace('Social Studies', 'Social Studies')

            const data = getHardcodedStrands(gradeKey, subjectKey)
            subjects[subject] = data
            return data
          }
        })
      }
    })
  }
})
