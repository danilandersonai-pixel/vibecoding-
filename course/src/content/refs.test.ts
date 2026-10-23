import { describe, expect, it } from 'vitest'
import { videos } from '../video/registry'
import { getDays } from './load'

describe('ссылки дней', () => {
  it('каждый блок video указывает на ролик из реестра', () => {
    const missing = getDays().flatMap((d) => d.blocks.filter((b) => b.type === 'video' && !videos[b.videoId]).map(() => d.id))
    expect(missing).toEqual([])
  })
})
