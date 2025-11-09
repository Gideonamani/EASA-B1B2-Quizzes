import Papa from 'papaparse'
import { buildCsvUrl, type SheetLinkInfo, type SheetOption } from './googleSheets'

export interface SheetMetadata {
  sheetName: string
  module?: string
  summary?: string
}

export type SheetMetadataMap = Record<string, SheetMetadata>

const CONFIG_SHEET_NAME = '_config'

export const normalizeSheetLabel = (value: string) => value.trim().toLowerCase()

export const partitionSheetOptions = (options: SheetOption[]) => {
  let configSheet: SheetOption | null = null
  const questionSheets = options.filter((option) => {
    const isConfig = normalizeSheetLabel(option.label) === CONFIG_SHEET_NAME
    if (isConfig) {
      configSheet = option
      return false
    }
    return true
  })

  return { questionSheets, configSheet }
}

const sanitize = (value?: string | null) => value?.trim() ?? ''

const normalizeRowKeys = (row: Record<string, string | undefined>) =>
  Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    if (typeof value === 'string') {
      acc[normalizeSheetLabel(key)] = value.trim()
    }
    return acc
  }, {})

const SUMMARY_KEYS = ['setsummary', 'summary']

export const fetchSheetMetadata = async (
  info: SheetLinkInfo,
  configSheet?: SheetOption | null,
): Promise<SheetMetadataMap> => {
  if (!configSheet || info.kind !== 'google-sheet') {
    return {}
  }

  const response = await fetch(buildCsvUrl(info, configSheet.gid))
  if (!response.ok) {
    throw new Error('Unable to download the configuration sheet.')
  }

  const csvText = await response.text()

  return await new Promise<SheetMetadataMap>((resolve, reject) => {
    Papa.parse<Record<string, string | undefined>>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const map: SheetMetadataMap = {}

        data.forEach((row) => {
          const normalized = normalizeRowKeys(row)
          const sheetName = sanitize(normalized['sheetname'])
          if (!sheetName) {
            return
          }

          const summaryKey = SUMMARY_KEYS.find((key) => sanitize(normalized[key]))
          const summaryValue = summaryKey ? sanitize(normalized[summaryKey]) : ''

          map[normalizeSheetLabel(sheetName)] = {
            sheetName,
            module: sanitize(normalized['module']) || undefined,
            summary: summaryValue || undefined,
          }
        })

        resolve(map)
      },
      error: (error: Error) => reject(error),
    })
  })
}
