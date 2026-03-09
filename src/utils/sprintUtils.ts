import type { Sprint } from '../types/domain/sprint'

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * スプリントの期間（開始日〜終了日）を日数で返す。
 * 終了日が null（無期限）の場合は null。
 */
export function getSprintDurationDays(sprint: Sprint | null): number | null {
  if (!sprint?.startDate) return null
  if (sprint.endDate == null) return null
  const start = new Date(sprint.startDate).getTime()
  const end = new Date(sprint.endDate).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null
  return Math.ceil((end - start) / MS_PER_DAY)
}
