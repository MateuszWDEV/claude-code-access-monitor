/*! SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *  Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com */
import { describe, expect, test } from 'claude-code/testing'

import { KONFIG_DOMYSLNY, TYPY, WARSTWY, budujGraf } from './graf'
import type { Migawka } from '../types'

const migawka = (): Migawka => ({
  czas: 0,
  cwd: 'C:/projekty/moja-strona',
  uprawnienia: {
    tryb: 'auto', allow: 3, deny: 0, ask: 0,
    zrodla: [{ nazwa: 'user', allow: 2, deny: 0, ask: 0 }, { nazwa: 'project', allow: 1, deny: 0, ask: 0 }],
    przykladyAllow: [],
    reguly: [
      { zrodlo: 'user', rodzaj: 'allow', tekst: 'Bash(git status:*)' },
      { zrodlo: 'user', rodzaj: 'allow', tekst: 'WebFetch' },
      { zrodlo: 'project', rodzaj: 'allow', tekst: 'mcp__magic__21st_magic_component_inspiration' },
    ],
  },
  narzedzia: ['Bash', 'Read', 'WebFetch'],
  serwery: [
    { nazwa: 'notion', zrodlo: 'globalny', rodzaj: 'stdio', cel: 'npx -y mcp-remote https://mcp.notion.com/mcp', sekrety: [], polaczony: true, narzedzia: 60 },
    { nazwa: 'magic', zrodlo: 'globalny', rodzaj: 'stdio', cel: 'npx magic', sekrety: ['API_KEY'], polaczony: false, narzedzia: 0 },
    { nazwa: 'chrome-devtools', zrodlo: 'plugin', rodzaj: 'sesja', cel: '', sekrety: [], polaczony: true, narzedzia: 29 },
  ],
  pluginy: [{ nazwa: 'chrome-devtools-mcp', wlaczony: true }, { nazwa: 'ralph-loop', wlaczony: false }],
  hooki: ['SessionStart'],
  tokeny: [{ katalog: 'a', plikow: 1 }],
  ryzyka: [
    { poziom: 'wysokie', tytul: 'Tryb auto bez żadnej listy deny', rada: 'Dodaj deny.' },
    { poziom: 'niskie', tytul: 'magic: sekret jawnie w konfiguracji (API_KEY)', rada: 'Usuń.' },
    { poziom: 'srednie', tytul: 'Hook SessionStart wstrzykuje treść do każdej sesji', rada: 'Ogranicz.' },
  ],
  bledy: [],
})

const ma = (g: ReturnType<typeof budujGraf>, z: string, d: string, typ: string) =>
  g.krawedzie.some(k => k.z === z && k.do === d && k.typ === typ)

describe('sieć powiązań', () => {
  test('każda krawędź łączy istniejące węzły, bez duplikatów id', () => {
    const g = budujGraf(migawka())
    const ids = new Set(g.wezly.map(w => w.id))
    expect(ids.size).toBe(g.wezly.length)
    for (const k of g.krawedzie) {
      expect(ids.has(k.z)).toBe(true)
      expect(ids.has(k.do)).toBe(true)
    }
    expect(g.warstwy).toEqual(WARSTWY)
    expect(g.typy).toEqual(TYPY)
  })

  test('zależności między warstwami są odwzorowane', () => {
    const g = budujGraf(migawka())
    expect(ma(g, 'plugin-chrome-devtools-mcp', 'mcp-chrome-devtools', 'udostepnia')).toBe(true)
    expect(ma(g, 'ust-user', 'narz-Bash', 'zezwala')).toBe(true)
    expect(ma(g, 'ust-project', 'mcp-magic', 'zezwala')).toBe(true)
    expect(ma(g, 'ust-project', 'ust-user', 'dziedziczy')).toBe(true)
    expect(ma(g, 'mcp-notion', 'zasieg-notion', 'siega')).toBe(true)
    expect(ma(g, 'narz-WebFetch', 'zasieg-internet', 'siega')).toBe(true)
    expect(ma(g, 'sekret-magic-API_KEY', 'mcp-magic', 'autoryzuje')).toBe(true)
    expect(ma(g, 'tokeny', 'mcp-notion', 'autoryzuje')).toBe(true)
    expect(ma(g, 'hook-SessionStart', 'sesja', 'wstrzykuje')).toBe(true)
    expect(ma(g, 'ryzyko-0', 'tryb', 'zagraza')).toBe(true)
    expect(ma(g, 'ryzyko-1', 'mcp-magic', 'zagraza')).toBe(true)
    expect(ma(g, 'ryzyko-2', 'hook-SessionStart', 'zagraza')).toBe(true)
    expect(g.wezly.find(w => w.id === 'tryb')?.poziom).toBe('wysokie')
    expect(g.wezly.find(w => w.id === 'plugin-ralph-loop')).toBeDefined()
    expect(g.krawedzie.find(k => k.z === 'sesja' && k.do === 'plugin-ralph-loop')?.waga).toBe(0.2)
    expect(g.krawedzie.find(k => k.z === 'sesja' && k.do === 'plugin-chrome-devtools-mcp')?.waga).toBe(1)
  })

  test('żaden węzeł nie wisi bez powiązań', () => {
    const g = budujGraf(migawka())
    const polaczone = new Set(g.krawedzie.flatMap(k => [k.z, k.do]))
    for (const w of g.wezly) expect(polaczone.has(w.id)).toBe(true)
  })

  test('poziom = odległość od sesji, a skupiska łączą silnie skojarzone węzły', () => {
    const g = budujGraf(migawka())
    const w = (id: string) => g.wezly.find(x => x.id === id)
    expect(w('sesja')?.glebokosc).toBe(0)
    expect(w('mcp-notion')?.glebokosc).toBe(1)
    expect(w('zasieg-notion')?.glebokosc).toBe(2)
    // magic nie jest połączony, więc leży dalej od Claude; jego ryzyko o krok dalej niż on sam
    expect(w('mcp-magic')?.glebokosc).toBeGreaterThan(1)
    expect(w('ryzyko-1')?.glebokosc).toBe((w('mcp-magic')?.glebokosc ?? 0) + 1)
    expect(w('sesja')?.grupa).toBe('Claude (ta sesja)')
    for (const x of g.wezly) { expect(typeof x.glebokosc).toBe('number'); expect(typeof x.grupa).toBe('string'); expect(x.grupa).not.toBe('') }
    // sekret magic i jego ryzyko siedzą w skupisku serwera magic; notion ze swoim zasięgiem i tokenami
    expect(w('sekret-magic-API_KEY')?.grupa).toBe(w('mcp-magic')?.grupa)
    expect(w('ryzyko-1')?.grupa).toBe(w('mcp-magic')?.grupa)
    expect(w('zasieg-notion')?.grupa).toBe(w('mcp-notion')?.grupa)
    expect(new Set(g.wezly.map(x => x.grupa)).size).toBeGreaterThan(2)
  })

  test('konfiguracja domyślna obejmuje wszystkie warstwy i typy', () => {
    expect(Object.keys(KONFIG_DOMYSLNY.warstwy)).toEqual([...WARSTWY])
    expect(Object.keys(KONFIG_DOMYSLNY.krawedzie)).toEqual([...TYPY])
  })
})
