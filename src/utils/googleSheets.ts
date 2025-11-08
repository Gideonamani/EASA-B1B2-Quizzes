export type GoogleSheetVariant = 'classic' | 'published'

export interface GoogleSheetInfo {
  kind: 'google-sheet'
  variant: GoogleSheetVariant
  id: string
  gid?: string
}

export interface ExternalCsvInfo {
  kind: 'external'
  url: string
}

export type SheetLinkInfo = GoogleSheetInfo | ExternalCsvInfo

export interface SheetOption {
  gid: string
  label: string
}

const GOOGLE_HOST = 'docs.google.com'

export const parseGoogleSheetLink = (input: string): SheetLinkInfo => {
  try {
    const url = new URL(input)
    if (!url.hostname.includes(GOOGLE_HOST)) {
      return { kind: 'external', url: input }
    }

    const publishedMatch = url.pathname.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/)
    if (publishedMatch) {
      return {
        kind: 'google-sheet',
        variant: 'published',
        id: publishedMatch[1],
        gid: url.searchParams.get('gid') ?? undefined,
      }
    }

    const classicMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (classicMatch) {
      return {
        kind: 'google-sheet',
        variant: 'classic',
        id: classicMatch[1],
        gid: url.searchParams.get('gid') ?? undefined,
      }
    }

    return { kind: 'external', url: input }
  } catch {
    return { kind: 'external', url: input }
  }
}

const ensureGoogleInfo = (info: SheetLinkInfo): GoogleSheetInfo => {
  if (info.kind !== 'google-sheet') {
    throw new Error('Expected a Google Sheets link')
  }
  return info
}

export const buildCsvUrl = (info: SheetLinkInfo, overrideGid?: string) => {
  if (info.kind === 'external') {
    return info.url
  }
  const gid = overrideGid ?? info.gid ?? '0'

  if (info.variant === 'published') {
    return `https://docs.google.com/spreadsheets/d/e/${info.id}/pub?output=csv&gid=${gid}`
  }

  return `https://docs.google.com/spreadsheets/d/${info.id}/export?format=csv&gid=${gid}`
}

const buildPubHtmlUrl = (info: GoogleSheetInfo) => {
  if (info.variant === 'published') {
    return `https://docs.google.com/spreadsheets/d/e/${info.id}/pubhtml`
  }
  return `https://docs.google.com/spreadsheets/d/${info.id}/pubhtml`
}

const SHEET_REGEX = /items\.push\(\{name: "([^"]+)",[^}]*gid: "([^"]+)"/g

export const fetchPublishedSheetList = async (info: SheetLinkInfo): Promise<SheetOption[]> => {
  const googleInfo = ensureGoogleInfo(info)
  const response = await fetch(buildPubHtmlUrl(googleInfo))
  if (!response.ok) {
    throw new Error('Unable to load the sheet index. Ensure the spreadsheet is published to the web.')
  }
  const html = await response.text()
  const sheets: SheetOption[] = []
  SHEET_REGEX.lastIndex = 0
  let match: RegExpExecArray | null = null
  while ((match = SHEET_REGEX.exec(html))) {
    const [, label, gid] = match
    sheets.push({ gid, label })
  }

  if (!sheets.length) {
    throw new Error('No published sheets were found. Double-check the Google Sheets sharing settings.')
  }

  return sheets
}

export const needsSheetSelection = (info: SheetLinkInfo) => info.kind === 'google-sheet' && !info.gid
