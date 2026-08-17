import { describe, expect, it } from 'vitest'
import { isDateInRange, weekRange } from './date'
describe('date utilities', () => { it('calculates Monday through Sunday range', () => { expect(weekRange(new Date('2026-08-05T12:00:00Z'))).toEqual({ start: '2026-08-03', end: '2026-08-09' }) }); it('checks inclusive date ranges', () => { expect(isDateInRange('2026-08-03', '2026-08-03', '2026-08-09')).toBe(true); expect(isDateInRange('2026-08-10', '2026-08-03', '2026-08-09')).toBe(false) }) })
