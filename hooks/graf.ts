/*! SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *  Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com */
import type { Migawka, Poziom, Regula } from '../types'

// Warstwy sieci, od góry (sesja) do dołu (dokąd to wszystko sięga). Kolejność = poziom Z w widoku 3D.
export const WARSTWY = ['sesja', 'projekt', 'uprawnienia', 'narzedzia', 'pluginy', 'mcp', 'sekrety', 'zasieg', 'ryzyka'] as const
export type Warstwa = (typeof WARSTWY)[number]

// Typy zależności, każdy osobno włączany na stronie.
export const TYPY = ['udostepnia', 'zezwala', 'blokuje', 'pyta', 'autoryzuje', 'siega', 'wstrzykuje', 'dziedziczy', 'uzywa', 'zagraza'] as const
export type Typ = (typeof TYPY)[number]

export type Wezel = {
  id: string; nazwa: string; warstwa: Warstwa; opis: string; poziom?: Poziom; waga: number
  /** odległość od sesji Claude w krokach po powiązaniach (poziom w widoku „powiązania”) */
  glebokosc?: number
  /** skupisko silnie skojarzonych węzłów (sześcian na płaszczyźnie); nazwa = hub skupiska */
  grupa?: string
}
export type Krawedz = { z: string; do: string; typ: Typ; waga: number }
export type Graf = { czas: number; warstwy: readonly Warstwa[]; typy: readonly Typ[]; wezly: Wezel[]; krawedzie: Krawedz[] }

// Dokąd prowadzi dany serwer MCP — po nazwie, bo konfiguracja tego nie mówi. Kolejność ma znaczenie: pierwsze trafienie wygrywa.
const ZASIEG: [RegExp, string, string][] = [
  [/notion/i, 'notion', 'Workspace Notion'],
  [/higgsfield/i, 'higgsfield', 'Higgsfield: media, kredyty, TikTok'],
  [/github|gitlab/i, 'github', 'Repozytoria kodu'],
  [/chrome|browser|playwright|puppeteer/i, 'przegladarka', 'Twoja przeglądarka'],
  [/gmail|google|drive|calendar/i, 'google', 'Konto Google: poczta, dysk, kalendarz'],
  [/slack/i, 'slack', 'Slack'],
  [/linear|jira|asana|atlassian/i, 'zadania', 'Zadania i projekty'],
  [/stripe/i, 'platnosci', 'Płatności (Stripe)'],
  [/aws|cloudflare|vercel|azure|gcp/i, 'chmura', 'Konto w chmurze'],
  [/code.?brain|filesystem|^fs$|desktop.?commander/i, 'dysk', 'Dysk komputera'],
  [/docs/i, 'claude-ai', 'Konto claude.ai'],
  [/dbhub|postgres|mysql|sqlite|supabase|mongo|redis/i, 'baza', 'Baza danych'],
  [/context7|magic|21st|fetch|brave|tavily|exa|search/i, 'internet', 'Internet'],
  [/vscode/i, 'vscode', 'Edytor VS Code'],
]
export const zasieg = (nazwa: string): [string, string] => {
  const t = ZASIEG.find(([re]) => re.test(nazwa))
  return t ? [t[1], t[2]] : ['inne', 'Inne systemy']
}

// Narzędzia wbudowane → dokąd sięgają.
const ZASIEG_NARZEDZIA: [RegExp, string, string][] = [
  [/^(Bash|PowerShell|Read|Write|Edit|Glob|Grep|NotebookEdit)$/, 'dysk', 'Dysk komputera'],
  [/^(WebFetch|WebSearch)$/, 'internet', 'Internet'],
  [/^(Artifact|ArtifactData|ArtifactComments)/, 'claude-ai', 'Konto claude.ai'],
]

const narzedzieZReguly = (tekst: string) => tekst.replace(/\(.*$/, '').trim()

/** Buduje sieć powiązań z migawki. Każda krawędź łączy istniejące węzły (sprawdza to test). */
export const budujGraf = (m: Migawka): Graf => {
  const wezly = new Map<string, Wezel>()
  const krawedzie: Krawedz[] = []
  const dodajWezel = (w: Wezel) => {
    const stary = wezly.get(w.id)
    if (stary) stary.waga = Math.max(stary.waga, w.waga)
    else wezly.set(w.id, w)
    return w.id
  }
  const polacz = (z: string, d: string, typ: Typ, waga = 1) => {
    if (wezly.has(z) && wezly.has(d)) krawedzie.push({ z, do: d, typ, waga })
  }

  // Sesja i projekt
  dodajWezel({ id: 'sesja', nazwa: 'Claude (ta sesja)', warstwa: 'sesja', opis: 'bieżąca sesja Claude Code', waga: 10 })
  const projekt = m.cwd.replace(/\\/g, '/').split('/').filter(Boolean).pop() ?? 'projekt'
  dodajWezel({ id: 'projekt', nazwa: projekt, warstwa: 'projekt', opis: m.cwd, waga: 4 })
  polacz('projekt', 'sesja', 'uzywa', 2)

  // Uprawnienia: tryb + jedno źródło = jeden węzeł; reguły łączą źródło z narzędziem albo serwerem
  const u = m.uprawnienia
  dodajWezel({ id: 'tryb', nazwa: `tryb: ${u.tryb}`, warstwa: 'uprawnienia', opis: `tryb uprawnień ${u.tryb}`, waga: 6 })
  polacz('tryb', 'sesja', 'uzywa', 3)
  for (const z of u.zrodla) {
    dodajWezel({ id: `ust-${z.nazwa}`, nazwa: `ustawienia ${z.nazwa}`, warstwa: 'uprawnienia', opis: `allow ${z.allow} · deny ${z.deny} · ask ${z.ask}`, waga: 2 + z.allow / 10 })
    polacz(`ust-${z.nazwa}`, 'tryb', 'uzywa', 1)
  }
  polacz('ust-project', 'ust-user', 'dziedziczy', 1)
  polacz('ust-local', 'ust-project', 'dziedziczy', 1)
  polacz('projekt', 'ust-project', 'uzywa', 1)
  polacz('projekt', 'ust-local', 'uzywa', 1)

  // Narzędzia wbudowane
  for (const n of m.narzedzia) {
    dodajWezel({ id: `narz-${n}`, nazwa: n, warstwa: 'narzedzia', opis: 'narzędzie wbudowane', waga: 1.5 })
    polacz('sesja', `narz-${n}`, 'uzywa', 1)
    const z = ZASIEG_NARZEDZIA.find(([re]) => re.test(n))
    if (z) {
      dodajWezel({ id: `zasieg-${z[1]}`, nazwa: z[2], warstwa: 'zasieg', opis: 'system, do którego sięga Claude', waga: 5 })
      polacz(`narz-${n}`, `zasieg-${z[1]}`, 'siega', 1)
    }
  }

  // Pluginy
  for (const p of m.pluginy) {
    dodajWezel({ id: `plugin-${p.nazwa}`, nazwa: p.nazwa, warstwa: 'pluginy', opis: p.wlaczony ? 'plugin włączony' : 'plugin zainstalowany, wyłączony', waga: p.wlaczony ? 2 : 0.8 })
    // Wyłączony plugin wciąż jest zainstalowany: słaba nitka trzyma go w sieci zamiast puszczać w pustkę.
    polacz('sesja', `plugin-${p.nazwa}`, 'uzywa', p.wlaczony ? 1 : 0.2)
  }

  // Serwery MCP → zasięg; pluginy udostępniają swoje serwery
  for (const s of m.serwery) {
    const id = `mcp-${s.nazwa}`
    dodajWezel({ id, nazwa: s.nazwa, warstwa: 'mcp', opis: `${s.zrodlo} · ${s.polaczony ? `${s.narzedzia} narzędzi` : 'nie połączony'} · ${s.rodzaj}`, waga: s.polaczony ? 2 + s.narzedzia / 15 : 1 })
    if (s.polaczony) polacz('sesja', id, 'uzywa', 1 + s.narzedzia / 20)
    const [zid, znazwa] = zasieg(s.nazwa)
    dodajWezel({ id: `zasieg-${zid}`, nazwa: znazwa, warstwa: 'zasieg', opis: 'system, do którego sięga Claude', waga: 5 })
    polacz(id, `zasieg-${zid}`, 'siega', s.polaczony ? 2 : 0.5)
    if (s.zrodlo === 'plugin') {
      const p = m.pluginy.find(x => s.nazwa.includes(x.nazwa) || x.nazwa.includes(s.nazwa))
      if (p) polacz(`plugin-${p.nazwa}`, id, 'udostepnia', 1)
    }
    for (const k of s.sekrety) {
      dodajWezel({ id: `sekret-${s.nazwa}-${k}`, nazwa: `${k} (${s.nazwa})`, warstwa: 'sekrety', opis: 'klucz w konfiguracji serwera', waga: 1.2 })
      polacz(`sekret-${s.nazwa}-${k}`, id, 'autoryzuje', 1)
    }
  }

  // Reguły: źródło → narzędzie / serwer
  const celReguly = (r: Regula): string | undefined => {
    const n = narzedzieZReguly(r.tekst)
    const mcp = /^mcp__(.+?)__/.exec(n)?.[1]
    if (mcp) return [...wezly.keys()].find(id => id.startsWith('mcp-') && id.slice(4).replace(/[^a-zA-Z0-9]/g, '_') === mcp)
    if (wezly.has(`narz-${n}`)) return `narz-${n}`
    return undefined
  }
  const typReguly: Record<Regula['rodzaj'], Typ> = { allow: 'zezwala', deny: 'blokuje', ask: 'pyta' }
  const policzone = new Map<string, number>()
  for (const r of u.reguly) {
    const cel = celReguly(r)
    if (!cel) continue
    const klucz = `ust-${r.zrodlo}|${cel}|${r.rodzaj}`
    policzone.set(klucz, (policzone.get(klucz) ?? 0) + 1)
  }
  for (const [klucz, n] of policzone) {
    const [z, cel, rodzaj] = klucz.split('|') as [string, string, Regula['rodzaj']]
    polacz(z, cel, typReguly[rodzaj], n)
  }

  // Tokeny OAuth → serwery zdalne (mcp-remote) → te korzystają z tokenów
  if (m.tokeny.length > 0) {
    dodajWezel({ id: 'tokeny', nazwa: `tokeny OAuth (${m.tokeny.length} kat.)`, warstwa: 'sekrety', opis: '~/.mcp-auth', waga: 1 + m.tokeny.length / 2 })
    for (const s of m.serwery) if (/mcp-remote|https?:\/\//.test(s.cel)) polacz('tokeny', `mcp-${s.nazwa}`, 'autoryzuje', 1)
  }

  // Hooki wstrzykują treść do sesji
  for (const h of m.hooki) {
    dodajWezel({ id: `hook-${h}`, nazwa: `hook ${h}`, warstwa: 'uprawnienia', opis: 'hook z settings.json', waga: 1.5 })
    polacz(`hook-${h}`, 'sesja', 'wstrzykuje', 1)
  }

  // Ryzyka → węzeł, którego dotyczą
  m.ryzyka.forEach((r, i) => {
    const id = `ryzyko-${i}`
    dodajWezel({ id, nazwa: r.tytul, warstwa: 'ryzyka', opis: r.rada, poziom: r.poziom, waga: { wysokie: 4, srednie: 2.5, niskie: 1.5, info: 1 }[r.poziom] })
    const t = r.tytul.toLowerCase()
    const serwer = m.serwery.find(s => t.startsWith(s.nazwa.toLowerCase()))
    const cel = serwer ? `mcp-${serwer.nazwa}` : /hook/.test(t) ? `hook-${m.hooki[0] ?? ''}` : /token/.test(t) ? 'tokeny' : /zgód|allow/.test(t) ? 'ust-user' : 'tryb'
    polacz(id, wezly.has(cel) ? cel : 'tryb', 'zagraza', 1)
    const w = wezly.get(wezly.has(cel) ? cel : 'tryb')
    if (w && (!w.poziom || WAGA_POZIOMU[r.poziom] < WAGA_POZIOMU[w.poziom])) w.poziom = r.poziom
  })

  const lista = [...wezly.values()]
  const glebokosci = glebokosc(lista, krawedzie)
  const grupy = skupiska(lista, krawedzie)
  for (const w of lista) {
    w.glebokosc = glebokosci.get(w.id)
    w.grupa = grupy.get(w.id)
  }
  return { czas: m.czas, warstwy: WARSTWY, typy: TYPY, wezly: lista, krawedzie }
}

/** Odległość każdego węzła od sesji (BFS po krawędziach w obie strony); nieosiągalne = o jeden dalej niż najdalszy. */
export const glebokosc = (wezly: Wezel[], krawedzie: Krawedz[]): Map<string, number> => {
  const sasiedzi = new Map<string, string[]>()
  for (const k of krawedzie) {
    sasiedzi.set(k.z, [...(sasiedzi.get(k.z) ?? []), k.do])
    sasiedzi.set(k.do, [...(sasiedzi.get(k.do) ?? []), k.z])
  }
  const wynik = new Map<string, number>([['sesja', 0]])
  const kolejka = ['sesja']
  while (kolejka.length) {
    const id = kolejka.shift() as string
    for (const s of sasiedzi.get(id) ?? []) if (!wynik.has(s)) { wynik.set(s, (wynik.get(id) ?? 0) + 1); kolejka.push(s) }
  }
  const max = Math.max(0, ...wynik.values())
  for (const w of wezly) if (!wynik.has(w.id)) wynik.set(w.id, max + 1)
  return wynik
}

// Ogólne „używa” od sesji wiąże wszystko ze wszystkim, więc w skupiskach liczy się słabo; reszta wagą krawędzi.
const wagaSkojarzenia = (k: Krawedz) => (k.typ === 'uzywa' ? 0.15 * k.waga : k.waga)

/** Skupiska przez propagację etykiet (deterministyczną): węzeł przyjmuje etykietę najsilniej skojarzonych sąsiadów. */
export const skupiska = (wezly: Wezel[], krawedzie: Krawedz[]): Map<string, string> => {
  const sasiedzi = new Map<string, [string, number][]>()
  const dodaj = (a: string, b: string, w: number) => sasiedzi.set(a, [...(sasiedzi.get(a) ?? []), [b, w]])
  for (const k of krawedzie) { const w = wagaSkojarzenia(k); dodaj(k.z, k.do, w); dodaj(k.do, k.z, w) }
  const ids = wezly.map(w => w.id).sort()
  const etykieta = new Map(ids.map(id => [id, id]))
  for (let i = 0; i < 30; i++) {
    let zmiana = false
    for (const id of ids) {
      const suma = new Map<string, number>()
      for (const [s, w] of sasiedzi.get(id) ?? []) { const e = etykieta.get(s) as string; suma.set(e, (suma.get(e) ?? 0) + w) }
      if (!suma.size) continue
      const najlepsza = [...suma.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0]?.[0] as string
      if (najlepsza !== etykieta.get(id)) { etykieta.set(id, najlepsza); zmiana = true }
    }
    if (!zmiana) break
  }
  // Nazwa skupiska = jego hub: węzeł z największą sumą skojarzeń (sesja nie nazywa skupisk, bo łączy wszystko).
  const sila = new Map<string, number>()
  for (const id of ids) sila.set(id, (sasiedzi.get(id) ?? []).reduce((a, [, w]) => a + w, 0))
  const hub = new Map<string, string>()
  for (const id of ids) {
    const e = etykieta.get(id) as string
    const obecny = hub.get(e)
    if (id === 'sesja' && obecny) continue
    if (!obecny || obecny === 'sesja' || (sila.get(id) ?? 0) > (sila.get(obecny) ?? 0)) hub.set(e, id)
  }
  // Skupisko, w którym siedzi sesja, nazywa się po niej: to rdzeń sieci.
  const etykietaSesji = etykieta.get('sesja')
  if (etykietaSesji !== undefined) hub.set(etykietaSesji, 'sesja')
  const nazwa = new Map(wezly.map(w => [w.id, w.nazwa]))
  return new Map(ids.map(id => [id, nazwa.get(hub.get(etykieta.get(id) as string) as string) ?? '']))
}

const WAGA_POZIOMU: Record<Poziom, number> = { wysokie: 0, srednie: 1, niskie: 2, info: 3 }

/** Domyślna konfiguracja strony — właściciel edytuje ją w ~/.claude/monitor-dostepow/konfig.json. */
export const KONFIG_DOMYSLNY = {
  widok: '2d' as '2d' | '3d',
  grupowanie: 'powiazania' as 'powiazania' | 'warstwa' | 'ryzyko' | 'brak',
  warstwy: Object.fromEntries(WARSTWY.map(w => [w, true])) as Record<Warstwa, boolean>,
  krawedzie: Object.fromEntries(TYPY.map(t => [t, true])) as Record<Typ, boolean>,
  fizyka: { odpychanie: 220, dlugosc: 60, odstepWarstw3d: 60 },
  etykiety: true,
  obszary3d: true,
  zamrozony: false,
  rozsuniecie: 1,   // mnożnik odległości warstw względem widoku początkowego (tylko ≥ 1)
  panelDanych: false,   // otwarty panel podglądu danych (tabela węzłów i zależności)
  // Skróty klawiszowe widoku: zapis „ctrl+shift+z”, „escape”, pojedyncza litera lub cyfra; edytuj tu, strona czyta.
  skroty: {
    cofnij: 'z', ponow: 'y', widok2d: '2', widok3d: '3', zamroz: 'f', dane: 'd', etykiety: 'l', obszary: 'b',
    kameraPrzod: 'shift+1', kameraGora: 'shift+2', kameraBok: 'shift+3', kameraReset: '0', calaSiec: 'escape', sciaga: '?',
  },
  odswiezanieSek: 15,
}
