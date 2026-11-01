import type { AttemptRecord, BackupFile } from '@/types/analytics'
import { OPTION_KEYS } from '@/types/exam'

const SUBJECTS = new Set(['m1', 'm2', 'lectora', 'ciencias', 'historia'])
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0

function validAttempt(a: unknown): a is AttemptRecord {
  if (!isObj(a)) return false
  if (!isStr(a.id) || !isStr(a.examId) || !isStr(a.examTitle)) return false
  if (!SUBJECTS.has(a.subject as string)) return false
  if (a.mode !== 'practica' && a.mode !== 'ensayo') return false
  for (const k of ['startedAt', 'finishedAt', 'durationMs', 'totalQuestions', 'correct', 'paesScore'] as const) {
    if (!isNum(a[k])) return false
  }
  if ((a.paesScore as number) < 100 || (a.paesScore as number) > 1000) return false
  if (!isObj(a.perAxis) || !Array.isArray(a.questions)) return false
  return (a.questions as unknown[]).every(
    (q) =>
      isObj(q) &&
      isStr(q.id) &&
      isStr(q.axis) &&
      OPTION_KEYS.includes(q.correct as never) &&
      (q.selected === null || OPTION_KEYS.includes(q.selected as never)),
  )
}

export type BackupParseResult =
  | { ok: true; attempts: AttemptRecord[]; skipped: number }
  | { ok: false; error: string }

/** Valida un respaldo exportado por la app antes de importarlo. */
export function parseBackup(text: string): BackupParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' }
  }
  if (!isObj(data) || data.app !== 'paes-studio') {
    return { ok: false, error: 'El archivo no es un respaldo de PAES Studio.' }
  }
  if (data.version !== 1) {
    return { ok: false, error: `Versión de respaldo no compatible (${String(data.version)}).` }
  }
  if (!Array.isArray(data.attempts)) {
    return { ok: false, error: 'El respaldo no contiene intentos.' }
  }
  const attempts = data.attempts.filter(validAttempt)
  return { ok: true, attempts, skipped: data.attempts.length - attempts.length }
}

export function buildBackup(attempts: AttemptRecord[]): BackupFile {
  return { app: 'paes-studio', version: 1, exportedAt: new Date().toISOString(), attempts }
}
