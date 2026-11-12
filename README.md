<!-- SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0 · Copyright (c) Mateusz Wiszniowski · wiszniowski-it.com -->
# Monitor dostępów — Claude Code Access Monitor

**Do czego Claude Code ma dostęp na Twoim komputerze — i co z czego wynika.**
Mod (plugin) do Claude Code, który skanuje uprawnienia, serwery MCP, pluginy, hooki i tokeny, ocenia ryzyka i pokazuje wszystko jako interaktywną sieć powiązań 2D/3D.

[English below](#english)

![Sieć powiązań 3D: poziomy = kroki od Claude, sześciany = skupiska silnie powiązanych elementów](docs/siec-3d.png)

## Co pokazuje

- **Uprawnienia:** tryb (`default`, `auto`, `bypassPermissions`…), reguły allow / deny / ask z każdego źródła (user, project, local) i to, do jakiego narzędzia lub serwera każda reguła się odnosi.
- **Serwery MCP:** które są skonfigurowane, które naprawdę połączone (na podstawie narzędzi bieżącej sesji), ile mają narzędzi i dokąd prowadzą (repozytoria, przeglądarka, poczta, baza danych…).
- **Pluginy i hooki:** włączone i wyłączone pluginy oraz hooki z `settings.json`.
- **Sekrety i tokeny:** nazwy kluczy w konfiguracji serwerów MCP (nigdy wartości) i katalogi tokenów OAuth w `~/.mcp-auth`.
- **Ryzyka:** np. tryb `auto` bez listy deny, hook `SessionStart` wstrzykujący treść do każdej sesji, serwery sterujące przeglądarką, sekret zapisany jawnie w konfiguracji, stare kopie tokenów.

## Jak to wygląda

- **Panel w Claude Code** (w terminalu): podsumowanie uprawnień, serwerów, ryzyk i aktywności sesji.
- **`/dostepy`** robi nowy skan i otwiera lokalną stronę `http://localhost:7331/monitor.html`:
  - **sieć powiązań 2D i 3D**: poziom = liczba kroków od Claude, sześcian = skupisko elementów silnie ze sobą powiązanych, kolor = kategoria, czerwone iskry = ryzyko;
  - **10 typów zależności** (używa, zezwala, blokuje, pyta, udostępnia, autoryzuje, sięga do, wstrzykuje, dziedziczy, zagraża), każdy do włączenia i wyłączenia;
  - klik w sześcian → widok 2D obszaru z jego **wejściami i wyjściami**;
  - **panel danych**: tabela węzłów i zależności z szukaniem i sortowaniem, zsynchronizowana z grafem;
  - suwak rozsunięcia warstw, zamrażanie układu, presety kamery, cofanie zmian (`Z` / `Y`), skróty klawiszowe (ściąga pod `?`);
  - **poruszanie się w 3D**: graf obraca się zawsze wokół swojego środka (lewy przycisk myszy); osie na brzegach sceny to jazda kamerą — **Y** (lewy brzeg) w górę / w dół, **X** (dolny brzeg) w lewo / w prawo, w głąb kółkiem myszy, klik w grot = skok;
  - **gizmo** w prawym dolnym rogu: obręcze **YZ / XZ / XY** (ciągnij = obrót wokół osi X / Y / Z, klik = obrót o 90°), osie **X / Y / Z** (klik = widok z tej strony) i domek (widok startowy).

![Widok 2D z panelem danych](docs/dane.png)

## Instalacja

W sesji Claude Code w terminalu:

```
/plugin install monitor-dostepow --marketplace MateuszWDEV/claude-code-access-monitor
```

Potwierdź dodanie marketplace (`y`) i wybierz zakres (domyślnie: użytkownik).

Z powłoki:

```
claude plugin install monitor-dostepow --marketplace MateuszWDEV/claude-code-access-monitor
```

W aplikacji desktop: **+** obok pola wiadomości → **Plugins** → **Add marketplace** `MateuszWDEV/claude-code-access-monitor` → **Add plugin**.

## Użycie

Wpisz `/dostepy`. Skan odświeża się też sam: na starcie sesji i kilka razy zaraz po nim (serwery MCP łączą się z opóźnieniem), gdy Claude zmieni plik ustawień (`settings*.json`, `.claude.json`, `.mcp.json`, `hooks.json`) i gdy zadziała narzędzie serwera, który skan widział jako niepołączony. Otwarta strona dociąga nowe dane co 15 s.

| Klawisz | Akcja |
|---|---|
| `2` / `3` | widok 2D / 3D |
| `Z` / `Y` | cofnij / ponów zmianę widoku |
| `F` | zamroź / odmroź układ |
| `D` | panel danych |
| `L` / `B` | etykiety / sześciany obszarów |
| `Shift+1` / `Shift+2` / `Shift+3` / `0` | kamera: przód / góra / bok / reset |
| `Esc` | cała sieć, zamknij karty |
| `?` | ściąga skrótów |

Ustawienia widoku i skróty zmienisz w `~/.claude/monitor-dostepow/konfig.json`.

## Wymagania

- Claude Code z obsługą modów (function hooks); sprawdzone na wersjach 2.1.300–2.1.322.
- Python 3 (lokalny serwer strony), przeglądarka z WebGL.
- Internet przy otwieraniu strony: biblioteki grafu ładują się z jsDelivr.
- Rozszerzenie VS Code nie rysuje jeszcze paneli modów — tam działa `/dostepy` i strona w przeglądarce.

## Prywatność

Wszystko dzieje się lokalnie. Mod czyta Twoje ustawienia Claude Code, `~/.claude.json` i listę plików w `~/.mcp-auth`; z konfiguracji serwerów zapisuje tylko **nazwy** kluczy, a adresy z hasłem maskuje (`://***@`). Wynik trafia do `~/.claude/monitor-dostepow/` (`graf.json`, `monitor.html`, `konfig.json`), a strona jest serwowana tylko na `127.0.0.1`. Nic nie jest wysyłane na zewnątrz poza pobraniem bibliotek z CDN.

## Ograniczenia

- Interfejs jest po polsku.
- Ocena ryzyk to heurystyka, nie audyt bezpieczeństwa.
- To, dokąd prowadzi serwer MCP, jest zgadywane po jego nazwie.

## Licencja

© Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · [wiszniowski-it.com](https://wiszniowski-it.com)

- **Za darmo do użytku niekomercyjnego** — [PolyForm Noncommercial 1.0.0](LICENSE): prywatnie, nauka, badania, hobby, organizacje non-profit, szkoły i instytucje publiczne.
- **Użycie w firmie lub w celu zarobkowym wymaga licencji komercyjnej.** Firmy mogą na prośbę dostać bezpłatną 30-dniową licencję testową. Szczegóły i kontakt: [COMMERCIAL.md](COMMERCIAL.md).
- Wersja 1.0.0 była 12.11.2026 przez kilka godzin dostępna na MIT i została wycofana; od wersji 1.1.0 obowiązuje wyłącznie licencja opisana wyżej.

Wykorzystane biblioteki (ładowane z CDN, nie dołączone): [force-graph](https://github.com/vasturiano/force-graph) i [3d-force-graph](https://github.com/vasturiano/3d-force-graph) (MIT), [three.js](https://github.com/mrdoob/three.js) (MIT), [d3-force](https://github.com/d3/d3-force) i [d3-quadtree](https://github.com/d3/d3-quadtree) (ISC).

---

<a id="english"></a>
## English

**See what Claude Code can access on your machine — and how it all connects.**

A Claude Code mod (plugin) that scans your permission mode and allow/deny/ask rules, MCP servers (configured vs. actually connected), plugins, hooks, secret key names in MCP configs and OAuth token folders, flags risks (e.g. `auto` mode with no deny list, a `SessionStart` hook injecting content, browser-controlling servers, plaintext secrets), and shows everything as an interactive 2D/3D dependency network on `localhost`.

- In-terminal pane with a summary; `/dostepy` rescans and opens `http://localhost:7331/monitor.html`.
- Layers = steps away from Claude, cubes = clusters of strongly linked items, 10 dependency types, area view with inputs/outputs, searchable data table, undo/redo, keyboard shortcuts.
- Everything stays local; only key **names** are recorded, never secret values.
- **The UI is in Polish.**

Install (in a Claude Code terminal session):

```
/plugin install monitor-dostepow --marketplace MateuszWDEV/claude-code-access-monitor
```

Requires a Claude Code build with mods (function hooks), Python 3 and a WebGL browser.

**License:** source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE) — free for noncommercial use only. **Any use in or for a business requires a commercial license**; a free 30-day evaluation license is available on request. See [COMMERCIAL.md](COMMERCIAL.md). Version 1.0.0 was briefly available under MIT on 12 Nov 2026 and has been withdrawn.
