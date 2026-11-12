// SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
// Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com
export type Poziom = 'wysokie' | 'srednie' | 'niskie' | 'info'

export type Ryzyko = { poziom: Poziom; tytul: string; rada: string }

export type SerwerMcp = {
  nazwa: string
  zrodlo: 'globalny' | 'projekt' | 'plugin' | 'claude.ai'
  rodzaj: string
  cel: string
  sekrety: string[]
  polaczony: boolean
  narzedzia: number
}

export type RodzajReguly = 'allow' | 'deny' | 'ask'

export type Regula = { zrodlo: string; rodzaj: RodzajReguly; tekst: string }

export type Uprawnienia = {
  tryb: string
  allow: number
  deny: number
  ask: number
  zrodla: { nazwa: string; allow: number; deny: number; ask: number }[]
  przykladyAllow: string[]
  reguly: Regula[]
}

export type Migawka = {
  czas: number
  cwd: string
  uprawnienia: Uprawnienia
  narzedzia: string[]
  serwery: SerwerMcp[]
  pluginy: { nazwa: string; wlaczony: boolean }[]
  hooki: string[]
  tokeny: { katalog: string; plikow: number }[]
  ryzyka: Ryzyko[]
  bledy: string[]
}

export type Aktywnosc = { wywolan: number; ostatnie: string[] }

declare module 'claude-code' {
  interface PluginState {
    'monitor-dostepow': { migawka: Migawka | null; aktywnosc: Aktywnosc }
  }
}
