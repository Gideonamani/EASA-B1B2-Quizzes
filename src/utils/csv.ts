import Papa, { type ParseResult } from 'papaparse'
import type { QuizQuestion } from '../types'

interface CsvQuestionRow {
  module?: string
  submodule?: string
  question?: string
  a?: string
  b?: string
  c?: string
  d?: string
  correct?: string
  explanation?: string
  difficulty?: string
  tags?: string
}

const OPTION_KEYS = ['a', 'b', 'c', 'd'] as const

const sanitize = (value?: string) => value?.trim() ?? ''

const normalizeTags = (raw?: string) =>
  sanitize(raw)
    .split(/[,;]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)

const randomId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11)

const pickOptions = (row: CsvQuestionRow) => {
  return OPTION_KEYS.map((key) => sanitize(row[key]))
    .map((value, index) =>
      value
        ? {
            id: OPTION_KEYS[index],
            label: value,
          }
        : null,
    )
    .filter(Boolean) as Array<{ id: string; label: string }>
}

const mapRowToQuestion = (row: CsvQuestionRow, index: number): QuizQuestion | null => {
  const prompt = sanitize(row.question)
  if (!prompt) {
    return null
  }

  const options = pickOptions(row)
  if (!options.length) {
    return null
  }

  const correct = sanitize(row.correct).toLowerCase() || options[0].id

  return {
    id: randomId() + '-' + index,
    module: sanitize(row.module) || 'General',
    submodule: sanitize(row.submodule) || 'Core',
    prompt,
    options,
    correctOption: correct,
    explanation: sanitize(row.explanation),
    difficulty: sanitize(row.difficulty),
    tags: normalizeTags(row.tags),
  }
}

const normalizeGoogleSheetUrl = (input: string) => {
  if (!input.includes('docs.google.com')) {
    return input
  }

  const idMatch = input.match(/\/d\/([a-zA-Z0-9-_]+)/)
  if (!idMatch) {
    return input
  }

  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`
}

export const fetchQuestionsFromCsv = async (rawUrl: string): Promise<QuizQuestion[]> => {
  const url = normalizeGoogleSheetUrl(rawUrl)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Unable to download CSV (${response.status})`)
  }
  const csvText = await response.text()

  return await new Promise<QuizQuestion[]>((resolve, reject) => {
    Papa.parse<CsvQuestionRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }: ParseResult<CsvQuestionRow>) => {
        const questions = data
          .map((row, index) => mapRowToQuestion(row, index))
          .filter((question): question is QuizQuestion => Boolean(question))

        if (!questions.length) {
          reject(new Error('No valid questions were found in the CSV file.'))
        } else {
          resolve(questions)
        }
      },
      error: (error: Error) => reject(error),
    })
  })
}
