/*! SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *  Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com */
import { atom, read, update } from 'claude-code'
import type { Register, EngineInterface as Engine } from 'claude-code'

import type { Aktywnosc, Migawka, Ryzyko, SerwerMcp, Uprawnienia } from '../types'
import { KONFIG_DOMYSLNY, budujGraf } from './graf'
import { STRONA, WERSJA_STRONY } from './strona'

/** Numer wersji z `<meta name="md-wersja">` zapisanej strony; brak = 0 (strony sprzed numeracji). */
export const wersjaStrony = (html: string): number => Number(/name="md-wersja" content="(\d+)"/.exec(html)?.[1] ?? 0)

const PANE = 'monitor-dostepow'
const TYTUL = 'Monitor dostępów'
const PORT = 7331
const ADRES = `http://localhost:${PORT}/monitor.html`

// Serwer strony z grafem: dziecko moda, żyje do końca sesji albo przeładowania moda.
let serwerDziala = false

const katalogStrony = async ($: Engine) => {
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''
  return home ? `${home}/.claude/monitor-dostepow` : ''
}

const migawka = atom({ plugin: 'monitor-dostepow', key: 'migawka' } as const, null)
const aktywnosc = atom({ plugin: 'monitor-dostepow', key: 'aktywnosc' } as const, {
  wywolan: 0,
  ostatnie: [],
})

type Obiekt = Record<string, unknown>
const obiekt = (v: unknown): Obiekt => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Obiekt) : {})
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : [])

// Klucze w konfiguracji, które wyglądają na sekrety — pokazujemy tylko ich nazwy, nigdy wartości.
const SEKRET = /token|key|secret|password|auth/i
const nazwySekretow = (env: unknown): string[] => Object.keys(obiekt(env)).filter(k => SEKRET.test(k))

// Serwery, które sterują przeglądarką — mają dostęp do zalogowanych sesji użytkownika.
const PRZEGLADARKA = /chrome|browser|playwright|puppeteer/i

/** Ocena ryzyk na podstawie zebranych danych. Czysta funkcja — testowana osobno. */
export const ocenRyzyka = (m: Omit<Migawka, 'ryzyka'>): Ryzyko[] => {
  const r: Ryzyko[] = []
  const u = m.uprawnienia
  if (u.tryb === 'auto' && u.deny === 0) {
    r.push({
      poziom: 'wysokie',
      tytul: 'Tryb auto bez żadnej listy deny',
      rada: 'Dodaj deny: rm -rf, git push --force, git reset --hard, odczyt .env i ~/.ssh.',
    })
  } else if (u.tryb === 'bypassPermissions' || u.tryb === 'dontAsk') {
    r.push({ poziom: 'wysokie', tytul: `Tryb ${u.tryb}: brak pytań o zgodę`, rada: 'Używaj tylko w izolowanym środowisku.' })
  } else if (u.deny === 0) {
    r.push({ poziom: 'srednie', tytul: 'Brak listy deny', rada: 'Zablokuj komendy destrukcyjne na stałe.' })
  }
  if (m.hooki.some(h => /SessionStart/i.test(h))) {
    r.push({
      poziom: 'srednie',
      tytul: 'Hook SessionStart wstrzykuje treść do każdej sesji',
      rada: 'Jeśli czyta plik z repo (np. AGENTS.md), obce repozytorium może podrzucić instrukcje.',
    })
  }
  for (const s of m.serwery) {
    if (s.polaczony && PRZEGLADARKA.test(s.nazwa)) {
      r.push({
        poziom: 'srednie',
        tytul: `${s.nazwa}: sterowanie przeglądarką`,
        rada: 'Podpięty pod Twoją przeglądarkę widzi zalogowane sesje. Używaj osobnego profilu.',
      })
    }
    if (s.sekrety.length > 0) {
      r.push({
        poziom: 'niskie',
        tytul: `${s.nazwa}: sekret jawnie w konfiguracji (${s.sekrety.join(', ')})`,
        rada: 'Przenieś do zmiennej środowiskowej albo usuń, jeśli serwer nieużywany.',
      })
    }
    if (/user:password@/.test(s.cel)) {
      r.push({ poziom: 'niskie', tytul: `${s.nazwa}: DSN to placeholder`, rada: 'Martwy wpis — usuń go z konfiguracji.' })
    }
    if (!s.polaczony && s.zrodlo !== 'claude.ai') {
      r.push({ poziom: 'info', tytul: `${s.nazwa}: skonfigurowany, nie połączony`, rada: 'Napraw logowanie albo usuń wpis.' })
    }
  }
  if (m.tokeny.length > 1) {
    r.push({
      poziom: 'niskie',
      tytul: `${m.tokeny.length} katalogi tokenów OAuth w ~/.mcp-auth`,
      rada: 'Stare wersje mcp-remote trzymają kopie tokenów. Zostaw tylko najnowszą.',
    })
  }
  if (u.allow > 40) {
    r.push({ poziom: 'info', tytul: `${u.allow} stałych zgód (allow)`, rada: 'Przejrzyj, czy wszystkie są jeszcze potrzebne.' })
  }
  const waga: Record<Ryzyko['poziom'], number> = { wysokie: 0, srednie: 1, niskie: 2, info: 3 }
  return r.sort((a, b) => waga[a.poziom] - waga[b.poziom])
}

/**
 * Czy serwer z narzędzi sesji (`mcp__<k>__*`) to serwer o tej nazwie z konfiguracji.
 * Obie strony normalizowane tak samo: `code-brain` w ~/.claude.json to `mcp__code-brain__*`,
 * a `claude.ai Gmail` to `mcp__claude_ai_Gmail__*`. Serwer pluginu: `plugin_<plugin>_<serwer>`.
 */
const normuj = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '_')
export const pasujeSerwer = (k: string, nazwa: string): boolean => {
  const a = normuj(k)
  const b = normuj(nazwa)
  return a === b || a.endsWith(`_${b}`)
}

const liczUprawnienia = (settings: unknown) => {
  const p = obiekt(obiekt(settings).permissions)
  return { allow: lista(p.allow).length, deny: lista(p.deny).length, ask: lista(p.ask).length }
}

/** Zbiera migawkę: ustawienia, konfigurację MCP, narzędzia sesji, pluginy, tokeny. */
export const skanuj = async ($: Engine): Promise<Migawka> => {
  const bledy: string[] = []
  const cwd = await $.session.cwd().catch(() => '')
  const home = (await $.env.get('USERPROFILE')) ?? (await $.env.get('HOME')) ?? ''

  // 1. Ustawienia (scalone + per źródło)
  const scalone = obiekt(await $.settings.read().catch((e: unknown) => (bledy.push(`settings: ${String(e)}`), {})))
  const perm = obiekt(scalone.permissions)
  const zrodla: Uprawnienia['zrodla'] = []
  const reguly: Uprawnienia['reguly'] = []
  for (const nazwa of ['user', 'project', 'local'] as const) {
    const s = await $.settings.read({ source: nazwa }).catch(() => ({}))
    const n = liczUprawnienia(s)
    if (n.allow + n.deny + n.ask > 0) zrodla.push({ nazwa, ...n })
    const p = obiekt(obiekt(s).permissions)
    for (const rodzaj of ['allow', 'deny', 'ask'] as const) for (const tekst of lista(p[rodzaj])) reguly.push({ zrodlo: nazwa, rodzaj, tekst })
  }
  const uprawnienia: Uprawnienia = {
    tryb: typeof perm.defaultMode === 'string' ? perm.defaultMode : 'default',
    ...liczUprawnienia(scalone),
    zrodla,
    przykladyAllow: lista(perm.allow).slice(0, 6),
    reguly,
  }
  const hooki = Object.keys(obiekt(scalone.hooks))
  const pluginy = Object.entries(obiekt(scalone.enabledPlugins)).map(([nazwa, v]) => ({
    nazwa: nazwa.replace(/@.*$/, ''),
    wlaczony: v === true,
  }))

  // 2. Narzędzia sesji → które serwery MCP naprawdę są połączone
  const narzedzia = await $.tool.list().catch((e: unknown) => (bledy.push(`tools: ${String(e)}`), []))
  const polaczone = new Map<string, number>()
  const wbudowane = narzedzia.filter(t => !t.mcp).map(t => t.name).sort()
  for (const t of narzedzia) {
    if (!t.mcp) continue
    const serwer = /^mcp__(.+?)__/.exec(t.name)?.[1]
    if (serwer) polaczone.set(serwer, (polaczone.get(serwer) ?? 0) + 1)
  }
  const szukajPolaczenia = (nazwa: string) => {
    for (const [k, n] of polaczone) if (pasujeSerwer(k, nazwa)) return n
    return 0
  }

  // 3. Konfiguracja MCP z ~/.claude.json (tylko nazwy kluczy sekretów)
  const serwery: SerwerMcp[] = []
  const dodaj = (nazwa: string, cfg: unknown, zrodlo: SerwerMcp['zrodlo']) => {
    const c = obiekt(cfg)
    const args = lista(c.args).join(' ')
    const cel = typeof c.url === 'string' ? c.url : `${typeof c.command === 'string' ? c.command : ''} ${args}`.trim()
    const n = szukajPolaczenia(nazwa)
    serwery.push({
      nazwa,
      zrodlo,
      rodzaj: typeof c.type === 'string' ? c.type : 'stdio',
      cel: cel.replace(/:\/\/[^@\s]+@/, '://***@').slice(0, 60),
      sekrety: nazwySekretow(c.env),
      polaczony: n > 0,
      narzedzia: n,
    })
  }
  if (home) {
    try {
      const g = obiekt(JSON.parse(await $.fs.read(`${home}/.claude.json`)))
      for (const [n, c] of Object.entries(obiekt(g.mcpServers))) dodaj(n, c, 'globalny')
      const projekty = obiekt(g.projects)
      const klucz = Object.keys(projekty).find(k => k.replace(/\\/g, '/').toLowerCase() === cwd.replace(/\\/g, '/').toLowerCase())
      if (klucz) for (const [n, c] of Object.entries(obiekt(obiekt(projekty[klucz]).mcpServers))) dodaj(n, c, 'projekt')
    } catch (e) {
      bledy.push(`~/.claude.json: ${String(e).slice(0, 80)}`)
    }
  }
  // Serwery połączone, których nie ma w ~/.claude.json: pluginy i konektory claude.ai
  for (const [k, n] of polaczone) {
    if (serwery.some(s => pasujeSerwer(k, s.nazwa))) continue
    // Serwer pluginu nazywa się `plugin_<plugin>_<serwer>`; plugin znamy z listy, więc zostaje sam serwer.
    const plugin = pluginy.find(p => k.startsWith(`plugin_${p.nazwa.replace(/-/g, '_')}_`))
    serwery.push({
      nazwa: plugin ? k.slice(`plugin_${plugin.nazwa.replace(/-/g, '_')}_`.length).replace(/_/g, '-') : k.replace(/_/g, ' '),
      zrodlo: plugin ? 'plugin' : 'claude.ai',
      rodzaj: 'sesja',
      cel: '',
      sekrety: [],
      polaczony: true,
      narzedzia: n,
    })
  }

  // 4. Tokeny OAuth w ~/.mcp-auth
  const tokeny: Migawka['tokeny'] = []
  if (home) {
    const katalogi = await $.fs.list(`${home}/.mcp-auth`).catch(() => [])
    for (const k of katalogi) {
      if (k.kind !== 'dir') continue
      const pliki = await $.fs.list(`${home}/.mcp-auth/${k.name}`).catch(() => [])
      tokeny.push({ katalog: k.name, plikow: pliki.filter((p: { name: string }) => /tokens\.json$/.test(p.name)).length })
    }
  }

  const bez: Omit<Migawka, 'ryzyka'> = { czas: Date.now(), cwd, uprawnienia, narzedzia: wbudowane, serwery, pluginy, hooki, tokeny, bledy }
  return { ...bez, ryzyka: ocenRyzyka(bez) }
}

const odswiez = async ($: Engine) => {
  const m = await skanuj($)
  await update($, migawka, () => m)
  const wysokie = m.ryzyka.filter(r => r.poziom === 'wysokie').length
  $.ui.status(wysokie > 0 ? `dostępy: ${wysokie} ryzyko wysokie` : 'dostępy: ok')
  // Strona czyta graf.json co kilkanaście sekund; konfig.json zakładamy raz, potem należy do właściciela.
  const katalog = await katalogStrony($)
  if (katalog) {
    await $.fs.write(`${katalog}/graf.json`, JSON.stringify(budujGraf(m))).catch(() => undefined)
    // Inna sesja mogła już zapisać nowszą stronę — nie cofamy jej (po aktualizacji stary mod zostaje w pamięci otwartych sesji).
    const obecna = await $.fs.read(`${katalog}/monitor.html`).catch(() => '')
    if (wersjaStrony(obecna) <= WERSJA_STRONY) await $.fs.write(`${katalog}/monitor.html`, STRONA).catch(() => undefined)
    if (!(await $.fs.exists(`${katalog}/konfig.json`).catch(() => true))) {
      await $.fs.write(`${katalog}/konfig.json`, JSON.stringify(KONFIG_DOMYSLNY, null, 2)).catch(() => undefined)
    }
  }
  return m
}

type System = 'windows' | 'mac' | 'linux'

/** Windows po zmiennej OS, macOS po `uname`, reszta jako Linux. */
const wykryjSystem = async ($: Engine): Promise<System> => {
  if ((await $.env.get('OS')) === 'Windows_NT') return 'windows'
  const uname = await $.process.run(['uname'], { timeoutMs: 3000 }).catch(() => undefined)
  return uname?.stdout.trim() === 'Darwin' ? 'mac' : 'linux'
}

/** Pierwszy interpreter Pythona, który odpowiada (`python3` na macOS i Linuksie, `python` na Windows). */
const znajdzPythona = async ($: Engine, system: System): Promise<string | undefined> => {
  const kandydaci = system === 'windows' ? ['python', 'py', 'python3'] : ['python3', 'python']
  for (const exe of kandydaci) {
    const wynik = await $.process.run([exe, '--version'], { timeoutMs: 5000 }).catch(() => undefined)
    if (wynik && wynik.exitCode === 0) return exe
  }
  return undefined
}

const poleceniePrzegladarki = (system: System, adres: string): string[] =>
  system === 'windows' ? ['cmd', '/c', 'start', '', adres] : system === 'mac' ? ['open', adres] : ['xdg-open', adres]

/** Uruchamia serwer strony (raz) i otwiera ją w przeglądarce. */
const otworzStrone = async ($: Engine): Promise<string> => {
  const katalog = await katalogStrony($)
  if (!katalog) return 'brak katalogu domowego'
  const system = await wykryjSystem($)
  if (!serwerDziala) {
    const python = await znajdzPythona($, system)
    if (!python) return `brak Pythona 3 — zainstaluj go albo podaj stronę z ${katalog} dowolnym serwerem HTTP`
    serwerDziala = true
    void (async () => {
      try {
        const serwer = $.process.spawn({
          argv: [python, '-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', katalog],
        })
        for await (const czesc of serwer) if ('text' in czesc) $.ui.log(czesc.text, { to: 'debug' })
      } finally {
        serwerDziala = false
      }
    })()
    await $.clock.sleep(700)
  }
  await $.process.run(poleceniePrzegladarki(system, ADRES), { timeoutMs: 5000 }).catch(() => undefined)
  return ADRES
}

// Narzędzia, które mogą zmienić konfigurację → po nich skanujemy ponownie.
const KONFIG = /(settings(\.local)?\.json|\.claude\.json|\.mcp\.json|hooks\.json)$/

// Serwery MCP łączą się po starcie sesji (notion przez mcp-remote trwa kilkanaście sekund),
// a hook mcp.connect łapie tylko $.mcp.connect pluginów — więc skan powtarzamy po starcie.
const PONOWNE_SKANY_MS = [5_000, 20_000, 60_000]

// Serwery, dla których wywołanie narzędzia wymusiło już skan — żeby nie skanować przy każdym.
const sprawdzone = new Set<string>()

export const register: Register = (on, _options) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'dostepy', description: 'Monitor dostępów: panel + ponowny skan' })
    void $.ui.open({ id: PANE, title: TYTUL })
    void (async () => {
      await odswiez($)
      for (const ms of PONOWNE_SKANY_MS) {
        await $.clock.sleep(ms)
        await odswiez($)
      }
    })().catch(err => $.ui.log(`monitor-dostepow: ${String(err)}`))
    return next(e)
  })

  on('command.run', { command: 'dostepy' }, async $ => {
    await $.ui.open({ id: PANE, title: TYTUL, focus: true })
    const m = await odswiez($)
    const adres = await otworzStrone($)
    return {
      text: `Monitor dostępów: ${m.ryzyka.length} uwag, ${m.serwery.filter(s => s.polaczony).length} serwerów MCP połączonych. Graf: ${adres}`,
    }
  })

  // Hooki przepuszczające: błąd monitora nigdy nie może zablokować narzędzia.
  on('tool.call', async ($, e, next) => {
    const wynik = await next(e)
    await update($, aktywnosc, a => ({ wywolan: a.wywolan + 1, ostatnie: [e.tool, ...a.ostatnie].slice(0, 5) })).catch(() => undefined)
    const plik = typeof (e as { file_path?: unknown }).file_path === 'string' ? (e as { file_path: string }).file_path : ''
    if ((e.tool === 'Write' || e.tool === 'Edit') && KONFIG.test(plik)) void odswiez($).catch(() => undefined)
    // Narzędzie MCP zadziałało, a panel ma jego serwer jako niepołączony → skan od nowa.
    const serwer = /^mcp__(.+?)__/.exec(e.tool)?.[1]
    if (serwer && !sprawdzone.has(serwer)) {
      const m = await read($, migawka).catch(() => null)
      if (m && !m.serwery.some(s => s.polaczony && pasujeSerwer(serwer, s.nazwa))) {
        sprawdzone.add(serwer)
        void odswiez($).catch(() => undefined)
      }
    }
    return wynik
  })

  on('mcp.connect', async ($, e, next) => {
    const wynik = await next(e)
    void odswiez($).catch(() => undefined)
    return wynik
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const m = await read($, migawka)
    const a: Aktywnosc = await read($, aktywnosc)
    const szer = Math.max(40, (e.viewport?.columns ?? 80) - 2)

    if (!m) {
      return (
        <Box flexDirection="column" padding={1}>
          <Text dimColor>Skanuję konfigurację…</Text>
        </Box>
      )
    }

    const kolor: Record<Ryzyko['poziom'], string> = { wysokie: 'red', srednie: 'yellow', niskie: 'cyan', info: 'gray' }
    const znak: Record<Ryzyko['poziom'], string> = { wysokie: '!!', srednie: ' !', niskie: ' ·', info: ' i' }
    const u = m.uprawnienia
    const czas = new Date(m.czas).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

    return (
      <Box flexDirection="column" paddingX={1} width={szer}>
        <Box justifyContent="space-between">
          <Text bold color="yellow">{'>_ '}{TYTUL}</Text>
          <Text dimColor>skan {czas} · /dostepy = skan + graf {serwerDziala ? ADRES : ''}</Text>
        </Box>

        <Text bold>UPRAWNIENIA</Text>
        <Text>
          {'  tryb: '}<Text bold color={u.tryb === 'auto' || u.tryb === 'bypassPermissions' ? 'red' : 'green'}>{u.tryb}</Text>
          {'   allow '}{String(u.allow)}{'   deny '}<Text color={u.deny === 0 ? 'red' : 'green'}>{String(u.deny)}</Text>{'   ask '}{String(u.ask)}
        </Text>
        {u.zrodla.map(z => (
          <Text dimColor>{'  '}{z.nazwa.padEnd(8)}{' allow '}{String(z.allow)}{'  deny '}{String(z.deny)}{'  ask '}{String(z.ask)}</Text>
        ))}

        <Text bold>{'\n'}SERWERY MCP ({String(m.serwery.filter(s => s.polaczony).length)}/{String(m.serwery.length)} połączone)</Text>
        {m.serwery.map(s => (
          <Text wrap="truncate-end">
            {'  '}<Text color={s.polaczony ? 'green' : 'red'}>{s.polaczony ? '●' : '○'}</Text>{' '}
            <Text bold>{s.nazwa.padEnd(16)}</Text>
            <Text dimColor>{s.zrodlo.padEnd(9)}{s.polaczony ? `${String(s.narzedzia)} narz.` : 'brak'}{s.sekrety.length ? `  sekret: ${s.sekrety.join(',')}` : ''}{s.cel ? `  ${s.cel}` : ''}</Text>
          </Text>
        ))}

        <Text bold>{'\n'}PLUGINY I HOOKI</Text>
        <Text wrap="wrap">
          {'  '}{m.pluginy.map(p => `${p.wlaczony ? '●' : '○'} ${p.nazwa}`).join('  ')}
        </Text>
        <Text dimColor>{'  hooki: '}{m.hooki.length ? m.hooki.join(', ') : 'brak'}{'   tokeny ~/.mcp-auth: '}{String(m.tokeny.length)} kat.</Text>

        <Text bold>{'\n'}RYZYKA ({String(m.ryzyka.length)})</Text>
        {m.ryzyka.length === 0 && <Text color="green">{'  brak uwag'}</Text>}
        {m.ryzyka.map(r => (
          <Box flexDirection="column">
            <Text wrap="truncate-end"><Text bold color={kolor[r.poziom]}>{' '}{znak[r.poziom]}{' '}</Text>{r.tytul}</Text>
            <Text dimColor wrap="truncate-end">{'      '}{r.rada}</Text>
          </Box>
        ))}

        <Text dimColor>{'\n'}{'  sesja: '}{String(a.wywolan)}{' wywołań narzędzi'}{a.ostatnie.length ? `  ostatnie: ${a.ostatnie.join(' ← ')}` : ''}</Text>
        {m.bledy.length > 0 && <Text color="red" wrap="truncate-end">{'  błędy skanu: '}{m.bledy.join('; ')}</Text>}
      </Box>
    )
  })
}
