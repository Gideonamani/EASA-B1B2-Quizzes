import Papa, { type ParseResult } from 'papaparse'
import type { QuizQuestion } from '../types'
import { buildCsvUrl, parseGoogleSheetLink } from './googleSheets'

interface CsvQuestionRow {
  module?: string
  submodule?: string
  question?: string
  option_a?: string
  option_b?: string
  option_c?: string
  option_d?: string
  correct?: string
  explanation?: string
  difficulty?: string
  tags?: string
}

const OPTION_KEYS = ['option_a', 'option_b', 'option_c', 'option_d'] as const

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

const pickOptions = (row: CsvQuestionRow) =>
  OPTION_KEYS.map((key, index) => {
    const value = sanitize(row[key])
    if (!value) {
      return null
    }
    const optionId = String.fromCharCode(97 + index) // a, b, c, d
    return { id: optionId, label: value }
  }).filter(Boolean) as Array<{ id: string; label: string }>

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

export const fetchQuestionsFromCsv = async (rawUrl: string): Promise<QuizQuestion[]> => {
  const linkInfo = parseGoogleSheetLink(rawUrl)
  const url = buildCsvUrl(linkInfo)
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
