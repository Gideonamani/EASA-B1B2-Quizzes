export type QuizMode = 'learning' | 'timed'

export type AnswerMap = Record<string, string | undefined>

export interface QuizQuestion {
  id: string
  module: string
  submodule: string
  prompt: string
  options: Array<{ id: string; label: string }>
  correctOption: string
  explanation?: string
  difficulty?: string
  tags: string[]
}

export interface ModuleStat {
  label: string
  correct: number
  total: number
  accuracy: number
}

export interface QuestionResult {
  questionId: string
  prompt: string
  module: string
  submodule: string
  difficulty?: string
  tags: string[]
  selected?: string
  correctAnswer: string
  wasCorrect: boolean
  explanation?: string
}

export interface QuizSummary {
  mode: QuizMode
  total: number
  correct: number
  incorrect: number
  skipped: number
  accuracy: number
  strengths: string[]
  focus: string[]
  byModule: ModuleStat[]
  byTag: ModuleStat[]
  questions: QuestionResult[]
  timing?: {
    elapsedSeconds: number
    limitSeconds?: number
  }
}
