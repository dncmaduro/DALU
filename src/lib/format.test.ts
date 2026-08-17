import { describe, expect, it } from 'vitest'
import { formatPercent, formatVnd } from './format'
describe('formatters', () => { it('formats VND and CRR centrally', () => { expect(formatVnd(1250000)).toContain('1.250.000'); expect(formatPercent(0.125)).toBe('12,5%'); expect(formatPercent(12.5)).toBe('12,5%') }) })
