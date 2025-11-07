import type { AnswerMap, ModuleStat, QuizMode, QuizQuestion, QuizSummary, QuestionResult } from '../types'

const toPercent = (fraction: number) => Math.round(fraction * 1000) / 10

const buildModuleStats = (questions: QuizQuestion[], answers: AnswerMap) => {
  const stats = new Map<string, ModuleStat>()

  questions.forEach((question) => {
    const selected = answers[question.id]
    const record = stats.get(question.module) ?? {
      label: question.module,
      correct: 0,
      total: 0,
      accuracy: 0,
    }

    record.total += 1
    if (selected && selected === question.correctOption) {
      record.correct += 1
    }
    record.accuracy = record.total ? record.correct / record.total : 0
    stats.set(question.module, record)
  })

  return Array.from(stats.values()).sort((a, b) => b.accuracy - a.accuracy)
}

const buildTagStats = (questions: QuizQuestion[], answers: AnswerMap) => {
  const stats = new Map<string, ModuleStat>()

  questions.forEach((question) => {
    question.tags.forEach((tag) => {
      const entry = stats.get(tag) ?? {
        label: tag,
        correct: 0,
        total: 0,
        accuracy: 0,
      }

      entry.total += 1
      if (answers[question.id] === question.correctOption) {
        entry.correct += 1
      }
      entry.accuracy = entry.correct / entry.total
      stats.set(tag, entry)
    })
  })

  return Array.from(stats.values()).sort((a, b) => b.accuracy - a.accuracy)
}

const buildQuestionBreakdown = (questions: QuizQuestion[], answers: AnswerMap): QuestionResult[] =>
  questions.map((question) => {
    const selected = answers[question.id]
    const wasCorrect = Boolean(selected) && selected === question.correctOption

    return {
      questionId: question.id,
      prompt: question.prompt,
      module: question.module,
      submodule: question.submodule,
      difficulty: question.difficulty,
      tags: question.tags,
      selected,
      correctAnswer: question.correctOption,
      wasCorrect,
      explanation: question.explanation,
    }
  })

const pickStrengths = (stats: ModuleStat[]) =>
  stats
    .filter((stat) => stat.total >= 1 && stat.accuracy >= 0.75)
    .slice(0, 3)
    .map((stat) => `${stat.label} (${toPercent(stat.accuracy)}%)`)

const pickFocusAreas = (stats: ModuleStat[]) =>
  stats
    .filter((stat) => stat.total >= 1 && stat.accuracy < 0.6)
    .slice(0, 3)
    .map((stat) => `${stat.label} (${toPercent(stat.accuracy)}%)`)

export const buildSummary = (
  questions: QuizQuestion[],
  answers: AnswerMap,
  meta: { mode: QuizMode; timing?: { elapsedSeconds: number; limitSeconds?: number } },
): QuizSummary => {
  const questionBreakdown = buildQuestionBreakdown(questions, answers)
  const correct = questionBreakdown.filter((item) => item.wasCorrect).length
  const skipped = questionBreakdown.filter((item) => !item.selected).length
  const incorrect = questionBreakdown.length - correct - skipped
  const byModule = buildModuleStats(questions, answers)
  const byTag = buildTagStats(questions, answers)

  return {
    mode: meta.mode,
    total: questions.length,
    correct,
    incorrect,
    skipped,
    accuracy: questions.length ? correct / questions.length : 0,
    strengths: pickStrengths(byModule),
    focus: pickFocusAreas(byModule.length ? byModule : byTag),
    byModule,
    byTag,
    questions: questionBreakdown,
    timing: meta.timing,
  }
}
