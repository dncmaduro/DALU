import { describe, expect, it } from 'vitest'
import { taskStatusMeta } from './status'
describe('task status mapping', () => { it('maps every status to a readable Vietnamese label', () => { expect(taskStatusMeta.completed.label).toBe('Hoàn thành'); expect(Object.keys(taskStatusMeta)).toHaveLength(5) }) })
