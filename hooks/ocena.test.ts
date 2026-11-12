/*! SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *  Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com */
import { describe, expect, test } from 'claude-code/testing'

import { ocenRyzyka, pasujeSerwer, wersjaStrony } from './register'
import { STRONA, WERSJA_STRONY } from './strona'
import type { Migawka } from '../types'

const baza = (): Omit<Migawka, 'ryzyka'> => ({
  czas: 0,
  cwd: 'C:/x',
  uprawnienia: { tryb: 'default', allow: 3, deny: 2, ask: 0, zrodla: [], przykladyAllow: [], reguly: [] },
  narzedzia: [],
  serwery: [],
  pluginy: [],
  hooki: [],
  tokeny: [],
  bledy: [],
})

describe('ocena ryzyk', () => {
  test('tryb auto bez deny to ryzyko wysokie, na pierwszym miejscu', () => {
    const m = baza()
    m.uprawnienia = { ...m.uprawnienia, tryb: 'auto', deny: 0 }
    m.tokeny = [{ katalog: 'a', plikow: 1 }, { katalog: 'b', plikow: 1 }]
    const r = ocenRyzyka(m)
    expect(r[0]?.poziom).toBe('wysokie')
    expect(r[0]?.tytul).toContain('auto')
    expect(r.some(x => x.tytul.includes('tokenów'))).toBe(true)
  })

  test('czysta konfiguracja nie daje uwag', () => {
    expect(ocenRyzyka(baza())).toEqual([])
  })

  test('serwer przeglądarki, placeholder DSN i jawny sekret są wykrywane', () => {
    const m = baza()
    m.serwery = [
      { nazwa: 'chrome-devtools', zrodlo: 'plugin', rodzaj: 'sesja', cel: '', sekrety: [], polaczony: true, narzedzia: 20 },
      { nazwa: 'dbhub', zrodlo: 'projekt', rodzaj: 'stdio', cel: 'npx dbhub --dsn postgres://user:password@localhost', sekrety: [], polaczony: false, narzedzia: 0 },
      { nazwa: 'magic', zrodlo: 'globalny', rodzaj: 'stdio', cel: 'npx magic', sekrety: ['API_KEY'], polaczony: false, narzedzia: 0 },
    ]
    const tytuly = ocenRyzyka(m).map(r => r.tytul)
    expect(tytuly.some(t => t.includes('przeglądark'))).toBe(true)
    expect(tytuly.some(t => t.includes('placeholder'))).toBe(true)
    expect(tytuly.some(t => t.includes('API_KEY'))).toBe(true)
  })
})

describe('dopasowanie serwera do narzędzi sesji', () => {
  test('myślnik w nazwie: code-brain z ~/.claude.json to mcp__code-brain__*', () => {
    expect(pasujeSerwer('code-brain', 'code-brain')).toBe(true)
  })

  test('zwykła nazwa, serwer pluginu i konektor claude.ai', () => {
    expect(pasujeSerwer('notion', 'notion')).toBe(true)
    expect(pasujeSerwer('plugin_playwright_playwright', 'playwright')).toBe(true)
    expect(pasujeSerwer('plugin_chrome-devtools-mcp_chrome-devtools', 'chrome-devtools')).toBe(true)
    expect(pasujeSerwer('claude_ai_Gmail', 'claude.ai Gmail')).toBe(true)
  })

  test('różne serwery się nie mylą', () => {
    expect(pasujeSerwer('notion', 'magic')).toBe(false)
    expect(pasujeSerwer('higgsfield', 'code-brain')).toBe(false)
  })
})

describe('wersja strony', () => {
  test('strona niesie swój numer, a starsze strony bez numeru mają 0', () => {
    expect(wersjaStrony(STRONA)).toBe(WERSJA_STRONY)
    expect(wersjaStrony('<!doctype html><title>stara</title>')).toBe(0)
    expect(wersjaStrony('')).toBe(0)
  })
})
