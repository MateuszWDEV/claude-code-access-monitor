/*! SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 *  Copyright (c) Mateusz Wiszniowski · Mateusz Wiszniowski IT (mwiit) · wiszniowski-it.com */
// Strona monitora: sieć powiązań 2D (force-graph) i 3D (3d-force-graph).
// W 3D każda warstwa to kwadrat (obszar) na swoim poziomie; kliknięcie kwadratu otwiera jego reprezentację 2D.
// Dane dociąga z /graf.json, konfigurację z /konfig.json (nadpisywaną ustawieniami z przeglądarki).
// Uwaga: w kodzie strony nie ma backticków ani ${, bo całość siedzi w szablonie TS.
/** Rośnie przy każdej zmianie strony: sesja z modem sprzed aktualizacji nie nadpisze nowszej strony. */
export const WERSJA_STRONY = 12

export const STRONA = `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="md-wersja" content="${WERSJA_STRONY}">
<title>Monitor dostępów — sieć powiązań</title>
<style>
:root{--bg:#000;--ink:#f0f0ec;--dim:#8a8a86;--line:#232323;--neon:#FFB000;--mono:"JetBrains Mono",ui-monospace,Consolas,monospace}
*{box-sizing:border-box}html,body{height:100%}body{margin:0;background:var(--bg);color:var(--ink);font:13px/1.45 var(--mono);overflow:hidden}
#uklad{display:grid;grid-template-columns:300px 1fr;height:100%}
aside{border-right:1px solid var(--line);padding:14px;overflow:auto;background:#050505}
h1{font-size:16px;margin:0 0 4px}h1 b{color:var(--neon)}.meta{color:var(--dim);font-size:11px;margin-bottom:12px}
h2{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);margin:16px 0 6px}
label.w{display:flex;align-items:center;gap:8px;padding:2px 0;cursor:pointer}label.w i{width:10px;height:10px;border-radius:50%;display:inline-block;flex:none}
label.w button{margin-left:auto;padding:0 6px;font-size:10px}
label.k{display:flex;align-items:center;gap:8px;padding:2px 0;cursor:pointer}label.k i{width:18px;height:0;border-top:3px solid;display:inline-block}
.row{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}
button,select{font:12px var(--mono);background:#111;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:5px 9px;cursor:pointer}
button.on{background:var(--neon);color:#000;border-color:var(--neon);font-weight:700}
input[type=range]{width:100%}.suwak{font-size:11px;color:var(--dim)}
#graf{display:flex;flex-direction:column;background:#000;min-width:0}
#gorny{display:flex;align-items:center;gap:14px;padding:8px 16px;border-bottom:1px solid var(--line);background:#050505;flex:none}
#gorny label{display:flex;align-items:center;gap:10px;flex:1;max-width:560px;color:var(--ink);font-size:12px}
#gorny input[type=range]{flex:1;accent-color:var(--neon)}#gorny b{color:var(--neon);min-width:3ch;text-align:right}
#gorny .pod{color:var(--dim);font-size:11px}
#scena{position:relative;flex:1;min-height:0}#g2,#g3{position:absolute;inset:0}
#obszar{position:absolute;left:16px;top:12px;display:none;align-items:center;gap:10px;background:rgba(5,5,5,.94);border:1px solid var(--line);border-radius:8px;padding:6px 10px}
#obszar i{width:12px;height:12px;border-radius:3px;display:inline-block}
#karta{position:absolute;right:16px;top:16px;width:340px;max-height:calc(100% - 32px);overflow:auto;background:rgba(5,5,5,.94);border:1px solid var(--line);border-radius:10px;padding:14px;display:none}
#karta h3{margin:0 0 4px;font-size:14px}#karta .opis{color:var(--dim);font-size:12px;margin-bottom:10px}
#karta ul{list-style:none;padding:0;margin:0 0 8px}#karta li{padding:2px 0;font-size:12px}#karta li b{color:var(--neon)}
#karta .x{position:absolute;right:10px;top:8px;background:none;border:none;color:var(--dim);font-size:16px}
.stat{display:flex;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--dim)}.stat b{color:var(--ink)}
.znak{display:inline-block;color:#000;font-size:10px;font-weight:700;padding:0 6px;border-radius:3px;margin-right:6px}
#stan{position:absolute;left:56px;bottom:50px;color:var(--dim);font-size:11px}
#potwierdz{position:absolute;left:50%;top:16px;transform:translateX(-50%);display:none;align-items:center;gap:10px;background:rgba(5,5,5,.96);border:1px solid var(--neon);border-radius:8px;padding:8px 12px}
#potwierdz i{width:12px;height:12px;border-radius:3px;display:inline-block}
#wejwyj{position:absolute;right:16px;bottom:16px;width:360px;max-height:46%;overflow:auto;background:rgba(5,5,5,.94);border:1px solid var(--line);border-radius:10px;padding:12px 14px;display:none}
#wejwyj h3{margin:0 0 6px;font-size:13px}#wejwyj h2{margin:10px 0 4px}#wejwyj ul{list-style:none;padding:0;margin:0}#wejwyj li{font-size:12px;padding:1px 0}#wejwyj li b{color:var(--neon)}
#wejwyj .we{border-left:3px solid #7bd88f;padding-left:8px}#wejwyj .wy{border-left:3px solid #4fc3f7;padding-left:8px}
#gizmo{position:absolute;right:8px;bottom:8px;width:230px;height:230px;display:none;cursor:default;touch-action:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.7))}
#osY{position:absolute;left:6px;top:56px;height:calc(100% - 112px);width:44px;display:none;touch-action:none}
#osX{position:absolute;left:52px;bottom:6px;width:calc(100% - 370px);height:40px;display:none;touch-action:none}
#kamera{position:absolute;right:244px;bottom:16px;display:none;flex-direction:column;gap:4px}#kamera button{padding:3px 8px;font-size:11px}
#dane{position:absolute;right:0;top:0;bottom:0;width:min(600px,60%);background:rgba(5,5,5,.97);border-left:1px solid var(--line);display:none;flex-direction:column;z-index:3}
#dane .naglowek{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line)}
#dane input{flex:1;font:12px var(--mono);background:#111;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:5px 8px}
#dane .tresc{overflow:auto;flex:1;padding:0 6px 12px}
#dane table{width:100%;border-collapse:collapse;font-size:11px}#dane th{position:sticky;top:0;background:#0a0a0a;text-align:left;padding:6px 6px;color:var(--dim);font-weight:600;cursor:pointer;border-bottom:1px solid var(--line);white-space:nowrap}
#dane th.sort{color:var(--neon)}#dane td{padding:3px 6px;border-bottom:1px solid #141414;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}#dane .tresc{overflow-x:hidden}
#dane tr.w{cursor:pointer}#dane tr.w:hover,#dane tr.w.pod{background:#1a1300}#dane tr.w.pod td:first-child{color:var(--neon)}
#dane td i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;vertical-align:middle}
#dane h2{padding:0 6px}
#sciaga{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:rgba(5,5,5,.97);border:1px solid var(--neon);border-radius:10px;padding:16px 20px;display:none;z-index:4;min-width:360px}
#sciaga h3{margin:0 0 10px;font-size:14px}#sciaga table{border-collapse:collapse;font-size:12px}#sciaga td{padding:3px 10px 3px 0}#sciaga kbd{font:600 11px var(--mono);background:#1a1a1a;border:1px solid #333;border-radius:4px;padding:1px 6px;color:var(--neon)}
#sciaga .meta{margin:10px 0 0}
</style></head><body><div id="uklad">
<aside>
  <h1><b>&gt;_</b> Monitor dostępów</h1>
  <div class="meta" id="meta">ładowanie…</div>
  <div class="stat" id="stat"></div>
  <h2>Widok</h2>
  <div class="row"><button id="b2d">2D</button><button id="b3d">3D</button><button id="bEtyk">etykiety</button><button id="bObsz">kwadraty obszarów</button></div>
  <h2>Grupowanie</h2>
  <select id="grup"><option value="powiazania">wg powiązań: poziom = kroki od Claude, sześcian = skupisko</option><option value="warstwa">wg kategorii (warstwy)</option><option value="ryzyko">wg ryzyka</option><option value="brak">swobodne</option></select>
  <h2>Warstwy <span style="font-weight:400;text-transform:none;letter-spacing:0">· „2D” = sam obszar</span></h2><div id="warstwy"></div>
  <h2>Zależności</h2><div id="typy"></div>
  <h2>Fizyka</h2>
  <div class="suwak">odpychanie <span id="vOdp"></span></div><input type="range" id="odp" min="20" max="600" step="10">
  <div class="suwak">długość nitki <span id="vDl"></span></div><input type="range" id="dl" min="20" max="200" step="5">
  <h2>Konfiguracja</h2>
  <div class="row"><button id="bReset">wróć do konfig.json</button><button id="bKopiuj">kopiuj JSON</button></div>
  <div class="meta">Zmiany zapisują się w przeglądarce. „Kopiuj JSON” wkleja do <code>~/.claude/monitor-dostepow/konfig.json</code>, żeby stały się domyślne.</div>
</aside>
<div id="graf">
  <div id="gorny"><label>rozsunięcie warstw <input type="range" id="odw" min="1" max="4" step="0.1"><b id="vOdw"></b></label><span class="pod">×1 = widok początkowy; w górę rozsuwa poziomy — kropki, nitki i bryły razem</span><button id="bZamroz" title="fizyka robi zdjęcie układu; potem zmieniasz tylko obraz (odległość warstw, kamera), węzły nie uciekają">zamroź układ</button><button id="bDane" title="tabela węzłów i zależności, szukanie, sortowanie; klik w wiersz podświetla w grafie">dane</button><button id="bCofnij" title="cofnij ostatnią zmianę widoku">↶</button><button id="bPonow" title="ponów">↷</button><button id="bSciaga" title="skróty klawiszowe">?</button></div>
  <div id="scena"><div id="g2"></div><div id="g3" style="display:none"></div>
  <div id="obszar"><i id="oKolor"></i><span id="oNazwa"></span><span class="meta" id="oOpis" style="margin:0"></span><button id="bCalosc">cała sieć</button></div>
  <div id="potwierdz"><i id="pKolor"></i><span id="pNazwa"></span><button id="bPotwierdz" class="on">otwórz w 2D + wejścia/wyjścia</button><button id="bAnuluj">anuluj</button></div>
  <div id="karta"><button class="x" id="bZamknij">×</button><h3 id="kNazwa"></h3><div class="opis" id="kOpis"></div><div id="kTresc"></div></div>
  <div id="wejwyj"><h3 id="wTytul"></h3><div id="wTresc"></div></div>
  <canvas id="osY" title="oś Y: ciągnij, żeby kamera jechała w górę lub w dół; klik w grot = skok w tę stronę; w głąb = kółko myszy"></canvas>
  <canvas id="osX" title="oś X: ciągnij, żeby kamera jechała w lewo lub w prawo; klik w grot = skok w tę stronę; w głąb = kółko myszy"></canvas>
  <canvas id="gizmo" width="460" height="460" title="obręcze YZ, XZ, XY: ciągnij = obrót wokół osi X, Y, Z, klik = obrót o 90°; klik w X, Y lub Z = widok z tej strony; domek = widok startowy"></canvas>
  <div id="kamera"><button data-kam="przod">przód</button><button data-kam="gora">góra</button><button data-kam="bok">bok</button><button data-kam="reset">reset</button></div>
  <div id="dane">
    <div class="naglowek"><input id="szukaj" placeholder="szukaj węzła, skupiska, typu…"><span class="meta" id="dLicz" style="margin:0"></span><button id="bDaneZamknij">×</button></div>
    <div class="tresc"><h2>węzły</h2><table id="tWezly"></table><h2>zależności</h2><table id="tKraw"></table></div>
  </div>
  <div id="sciaga"><h3>Skróty klawiszowe</h3><table id="sciagaTab"></table><div class="meta">Zmienisz je w <code>~/.claude/monitor-dostepow/konfig.json</code> → <code>skroty</code>.</div></div>
  <div id="stan"></div>
  </div>
</div></div>
<script src="https://cdn.jsdelivr.net/npm/d3-quadtree@3/dist/d3-quadtree.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-force@3/dist/d3-force.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/force-graph@1/dist/force-graph.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/3d-force-graph@1/dist/3d-force-graph.min.js"></script>
<script type="module">
// Ta sama wersja Three.js, którą ma w sobie 3d-force-graph (r186) — inna wersja psuje renderowanie.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186/build/three.module.js';

var KOLOR_WARSTWY = { sesja: '#FFB000', projekt: '#f0f0ec', uprawnienia: '#ff8c42', narzedzia: '#8ab4f8', pluginy: '#c58af9', mcp: '#4fc3f7', sekrety: '#ff4d94', zasieg: '#7bd88f', ryzyka: '#ff4d4d' };
var NAZWA_WARSTWY = { sesja: 'sesja', projekt: 'projekt', uprawnienia: 'uprawnienia i hooki', narzedzia: 'narzędzia wbudowane', pluginy: 'pluginy', mcp: 'serwery MCP', sekrety: 'sekrety i tokeny', zasieg: 'dokąd sięga', ryzyka: 'ryzyka' };
var KOLOR_TYPU = { udostepnia: '#c58af9', zezwala: '#7bd88f', blokuje: '#ff4d4d', pyta: '#FFB000', autoryzuje: '#ff4d94', siega: '#4fc3f7', wstrzykuje: '#ff8c42', dziedziczy: '#8a8a86', uzywa: '#3a3a38', zagraza: '#ff4d4d' };
var NAZWA_TYPU = { udostepnia: 'udostępnia', zezwala: 'zezwala', blokuje: 'blokuje', pyta: 'pyta o zgodę', autoryzuje: 'autoryzuje', siega: 'sięga do', wstrzykuje: 'wstrzykuje', dziedziczy: 'dziedziczy', uzywa: 'używa', zagraza: 'zagraża' };
var KOLOR_POZIOMU = { wysokie: '#ff4d4d', srednie: '#FFB000', niskie: '#4fc3f7', info: '#8a8a86' };
var NAZWA_POZIOMU = ['ryzyko wysokie', 'ryzyko średnie', 'ryzyko niskie', 'informacje', 'bez uwag'];
var ODL_RYZYKA = { wysokie: 0, srednie: 1, niskie: 2, info: 3 };

// 2D i 3D mają osobne obiekty węzłów: 3D przypina poziom przez fy, 2D układa warstwy siłą forceY.
var konfig = null, baza = null, graf = null, wezly = {}, wezly3 = {}, dane = { nodes: [], links: [] };
var g2 = null, g3 = null, zaznaczony = null, sasiedzi = {}, krawSas = {}, dopasowano2d = false;
var obszar = null;           // wybrany obszar (warstwa) do reprezentacji 2D; null = cała sieć
var plaszczyzny = [];        // kwadraty obszarów w scenie 3D
var hover3d = null, rozgladanie = null;
var $ = function (id) { return document.getElementById(id); };

function zapisz() { try { localStorage.setItem('md-konfig', JSON.stringify(konfig)); } catch (e) {} }
function wczytajKonfig(k) { konfig = JSON.parse(JSON.stringify(k)); try { var l = localStorage.getItem('md-konfig'); if (l) konfig = Object.assign({}, konfig, JSON.parse(l)); } catch (e) {} if (konfig.obszary3d === undefined) konfig.obszary3d = true; if (!(konfig.rozsuniecie >= 1)) konfig.rozsuniecie = 1; if (k && k.skroty) konfig.skroty = Object.assign({}, konfig.skroty || {}, k.skroty); }   // skróty zawsze z konfig.json
// Odległość między poziomami = bazowy odstęp z fizyki × rozsunięcie (transformacja obrazu, wspólna dla kropek i brył).
function odstep() { return konfig.fizyka.odstepWarstw3d * (konfig.rozsuniecie || 1); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function widoczny(n) { return konfig.warstwy[n.warstwa] !== false; }
function kolorWezla(n) { return n.poziom ? KOLOR_POZIOMU[n.poziom] : (KOLOR_WARSTWY[n.warstwa] || '#888'); }
function przyciemnij(n) { return zaznaczony && !sasiedzi[n.id]; }
function id_(x) { return x && x.id !== undefined ? x.id : x; }

// Poziom: „powiazania” = kroki od Claude; „warstwa” = kategoria; „ryzyko” = poziom ryzyka.
function maxGlebokosc() { var m = 0; dane.nodes.forEach(function (n) { if (n.glebokosc > m) m = n.glebokosc; }); return m; }
function poziomy() {
  if (konfig.grupowanie === 'powiazania') { var p = []; for (var i = 0; i <= maxGlebokosc(); i++) p.push(i); return p; }
  return konfig.grupowanie === 'ryzyko' ? [0, 1, 2, 3, 4] : graf.warstwy.slice();
}
function poziomWezla(n) {
  if (konfig.grupowanie === 'powiazania') return n.glebokosc || 0;
  return konfig.grupowanie === 'ryzyko' ? (n.poziom ? ODL_RYZYKA[n.poziom] : 4) : n.warstwa;
}
function nazwaPoziomu(p) {
  if (konfig.grupowanie === 'powiazania') return p === 0 ? 'Claude' : p + (p === 1 ? ' krok' : ' kroki') + ' od Claude';
  return konfig.grupowanie === 'ryzyko' ? NAZWA_POZIOMU[p] : NAZWA_WARSTWY[p];
}
function kolorPoziomu(p) {
  if (konfig.grupowanie === 'powiazania') return ['#FFB000', '#f0f0ec', '#8ab4f8', '#7bd88f', '#c58af9', '#8a8a86'][Math.min(5, p)];
  return konfig.grupowanie === 'ryzyko' ? [KOLOR_POZIOMU.wysokie, KOLOR_POZIOMU.srednie, KOLOR_POZIOMU.niskie, KOLOR_POZIOMU.info, '#3a3a38'][p] : KOLOR_WARSTWY[p];
}
function indeksPoziomu(p) { return poziomy().indexOf(p); }
// Obszar (sześcian): przy powiązaniach = poziom + skupisko, inaczej = cały poziom.
function kluczObszaru(n) { return konfig.grupowanie === 'powiazania' ? poziomWezla(n) + '|' + (n.grupa || '') : poziomWezla(n); }
function poziomKlucza(k) { return konfig.grupowanie === 'powiazania' ? +String(k).split('|')[0] : k; }
function nazwaObszaru(k) { return konfig.grupowanie === 'powiazania' ? 'skupisko „' + String(k).split('|')[1] + '” · ' + nazwaPoziomu(poziomKlucza(k)) : nazwaPoziomu(k); }
// Kolor sześcianu skupiska = kolor kategorii, której w nim najwięcej.
function kolorObszaru(k, wezly) {
  if (konfig.grupowanie !== 'powiazania') return kolorPoziomu(k);
  var licz = {}, naj = null; (wezly || []).forEach(function (n) { licz[n.warstwa] = (licz[n.warstwa] || 0) + 1; if (naj === null || licz[n.warstwa] > licz[naj]) naj = n.warstwa; });
  return naj ? KOLOR_WARSTWY[naj] : kolorPoziomu(poziomKlucza(k));
}

function scal(nowy) {
  graf = nowy; var ids = {};
  nowy.wezly.forEach(function (w) { ids[w.id] = true; if (wezly[w.id]) Object.assign(wezly[w.id], w); else wezly[w.id] = Object.assign({}, w); });
  Object.keys(wezly).forEach(function (id) { if (!ids[id]) delete wezly[id]; });
  dane.nodes = nowy.wezly.map(function (w) { return wezly[w.id]; });
  dane.links = nowy.krawedzie.map(function (k) { return { source: k.z, target: k.do, typ: k.typ, waga: k.waga }; });
  przerysuj();
}

// Reprezentacja 2D obszaru: węzły obszaru + ich bezpośredni sąsiedzi (przyciemnieni).
function wObszarze(n) { return obszar !== null && kluczObszaru(n) === obszar; }
function przerysuj() {
  var w = dane.nodes.filter(widoczny), wid = {}; w.forEach(function (n) { wid[n.id] = true; });
  var l = dane.links.filter(function (k) { return konfig.krawedzie[k.typ] !== false && wid[id_(k.source)] && wid[id_(k.target)]; });
  var w2 = w, l2 = l;
  if (obszar !== null) {
    var trzymaj = {}; w.forEach(function (n) { if (wObszarze(n)) trzymaj[n.id] = true; });
    l.forEach(function (k) { var s = id_(k.source), t = id_(k.target); if (trzymaj[s] || trzymaj[t]) { trzymaj[s] = true; trzymaj[t] = true; } });
    w2 = w.filter(function (n) { return trzymaj[n.id]; });
    l2 = l.filter(function (k) { return trzymaj[id_(k.source)] && trzymaj[id_(k.target)]; });
  }
  var w3 = w.map(function (n) { var k = wezly3[n.id] || (wezly3[n.id] = {}); Object.keys(n).forEach(function (p) { if ('xyz'.indexOf(p) < 0 && p.charAt(0) !== 'v') k[p] = n[p]; }); return k; });
  var l3 = l.map(function (k) { return { source: id_(k.source), target: id_(k.target), typ: k.typ, waga: k.waga }; });
  ostatnieW3 = w3;
  zastosujGrupowanie(w3);
  dopasowano2d = false;
  if (g2) g2.graphData({ nodes: w2, links: l2 });
  if (g3) { g3.graphData({ nodes: w3, links: l3 }); rysujObszary3d(w3); }
  rysujPanel(); rysujPasekObszaru(w2); rysujWejWyj(w2); rysujDane();
}

function zastosujGrupowanie(w3) {
  var od3 = odstep(), P = poziomy();
  // 3D: poziom = wysokość na osi pionowej (sesja na górze), głębia i szerokość wolne.
  w3.forEach(function (n) { if (konfig.grupowanie === 'brak') delete n.fy; else n.fy = (P.length / 2 - indeksPoziomu(poziomWezla(n))) * od3; });
  if (g2) {
    g2.d3Force('charge').strength(-konfig.fizyka.odpychanie);
    g2.d3Force('link').distance(function (l) { return konfig.fizyka.dlugosc * (l.typ === 'uzywa' ? 1 : 0.8); });
    g2.d3Force('y', konfig.grupowanie === 'brak' ? null : d3.forceY(celY2d).strength(0.9));
    g2.d3Force('x', konfig.grupowanie === 'brak' ? null : d3.forceX(0).strength(0.03));
    g2.d3Force('collide', d3.forceCollide(function (n) { return Math.sqrt(n.waga) * 3 + (konfig.etykiety ? Math.min(90, 10 + n.nazwa.length * 3) : 6); }).strength(0.9).iterations(2));
    g2.d3ReheatSimulation();
  }
  if (g3) {
    g3.d3Force('charge').strength(-konfig.fizyka.odpychanie);
    g3.d3Force('link').distance(konfig.fizyka.dlugosc);
    g3.d3Force('srodek', silaSrodka(0.04));
    g3.d3Force('skupisko', konfig.grupowanie === 'powiazania' ? silaSkupiska(0.18) : null);
    g3.d3ReheatSimulation();
  }
  if (g2) g2.d3Force('skupisko2d', konfig.grupowanie === 'powiazania' ? d3.forceX(celX2d).strength(0.25) : null);
}
// 3D: węzły jednego skupiska ciągną do wspólnego środka (w poziomie), więc sześciany są zwarte i rozdzielone.
function silaSkupiska(k) {
  var lista = [];
  function sila(alpha) {
    var srodki = {};
    lista.forEach(function (n) { var c = kluczObszaru(n), s = srodki[c] || (srodki[c] = { x: 0, z: 0, n: 0 }); s.x += n.x || 0; s.z += n.z || 0; s.n++; });
    lista.forEach(function (n) { var s = srodki[kluczObszaru(n)]; if (s.n < 2) return; n.vx += (s.x / s.n - (n.x || 0)) * k * alpha; n.vz += (s.z / s.n - (n.z || 0)) * k * alpha; });
  }
  sila.initialize = function (nodes) { lista = nodes; };
  return sila;
}
// 2D: skupiska na jednym poziomie stoją obok siebie, każde w swojej kolumnie.
function celX2d(n) {
  var p = poziomWezla(n), klucze = [];
  dane.nodes.forEach(function (x) { if (widoczny(x) && poziomWezla(x) === p) { var k = kluczObszaru(x); if (klucze.indexOf(k) < 0) klucze.push(k); } });
  klucze.sort();
  return (klucze.indexOf(kluczObszaru(n)) - (klucze.length - 1) / 2) * 150;
}
// 2D: oś y rośnie w dół; ten sam odstęp warstw co w 3D. W widoku obszaru jego węzły leżą na 0, sąsiedzi wyżej/niżej.
function celY2d(n) {
  if (konfig.grupowanie === 'brak') return 0;
  var P = poziomy(), i = indeksPoziomu(poziomWezla(n)), baza = obszar !== null ? indeksPoziomu(poziomKlucza(obszar)) : P.length / 2;
  return (i - baza) * odstep() * 1.6;
}
// Suwak odległości warstw działa od razu: nowe poziomy dla 3D (fy) i 2D (forceY), bez przebudowy danych.
// Przy zamrożonym układzie modulujemy tylko zdjęcie: y wprost z poziomu, x i z zostają.
var ostatnieW3 = [];
function odswiezOdstep() {
  if (!graf) return;
  zastosujGrupowanie(ostatnieW3);
  // Natychmiast, bez symulacji: kropki dostają nową wysokość od razu, bryły liczą się z tych samych poziomów.
  ostatnieW3.forEach(function (n) { if (n.fy !== undefined) n.y = n.fy; });
  dane.nodes.forEach(function (n) { if (konfig.grupowanie !== 'brak' && typeof n.y === 'number') { n.y = celY2d(n); if (n.fx !== undefined) n.fy = n.y; } });
  dopasujObszary3d();
  if (g2) g2.d3ReheatSimulation();
  $('vOdw').textContent = '×' + (konfig.rozsuniecie || 1).toFixed(1);
}
// --- historia widoku: cofnij / ponów -----------------------------------------
// Zdjęcie stanu: pozycje (i przypięcia) węzłów 2D/3D, konfiguracja, kamera. Zapisywane PRZED każdą zmianą.
var historia = [], przyszlosc = [], ostatniZapis = 0;
function zdjecieStanu() {
  var w3 = {}, w2 = {};
  ostatnieW3.forEach(function (n) { w3[n.id] = { x: n.x, y: n.y, z: n.z, fx: n.fx, fy: n.fy, fz: n.fz }; });
  dane.nodes.forEach(function (n) { w2[n.id] = { x: n.x, y: n.y, fx: n.fx, fy: n.fy }; });
  // pion kamery i cel kontrolek też, bo obrót obręczą wokół osi patrzenia nie zmienia pozycji kamery
  var kam = null;
  if (g3) {
    var kc = g3.camera(), st = g3.controls();
    kam = { p: g3.cameraPosition(), up: [kc.up.x, kc.up.y, kc.up.z], cel: st && st.target ? { x: st.target.x, y: st.target.y, z: st.target.z } : null };
  }
  return { w3: w3, w2: w2, konfig: JSON.parse(JSON.stringify(konfig)), kam: kam, obszar: obszar };
}
function przywroc(s) {
  konfig = s.konfig; zapisz(); obszar = s.obszar;
  przelacz(konfig.widok); przerysuj();
  // Pozycje wracają PO przerysowaniu, bo ono ustawia fy z formuły poziomów.
  ostatnieW3.forEach(function (n) { var z = s.w3[n.id]; if (!z) return; ['x', 'y', 'z', 'fx', 'fy', 'fz'].forEach(function (k) { if (z[k] === undefined) delete n[k]; else n[k] = z[k]; }); });
  dane.nodes.forEach(function (n) { var z = s.w2[n.id]; if (!z) return; ['x', 'y', 'fx', 'fy'].forEach(function (k) { if (z[k] === undefined) delete n[k]; else n[k] = z[k]; }); });
  dopasujObszary3d();
  if (g3 && s.kam && s.kam.p) {
    if (s.kam.up) g3.camera().up.set(s.kam.up[0], s.kam.up[1], s.kam.up[2]);
    g3.cameraPosition({ x: s.kam.p.x, y: s.kam.p.y, z: s.kam.p.z }, s.kam.cel || undefined, 400);
  }
  if (g2) g2.d3ReheatSimulation(); if (g3) g3.d3ReheatSimulation();
}
// Jeden wpis historii na gest: zmiany w odstępie < 700 ms (przeciągnięcie suwaka) łączą się w jedną.
function zapamietaj(wymus) {
  var t = Date.now(); if (!wymus && t - ostatniZapis < 700) { ostatniZapis = t; return; }
  ostatniZapis = t; historia.push(zdjecieStanu()); if (historia.length > 50) historia.shift(); przyszlosc = [];
  $('bCofnij').className = 'on';
}
function cofnij() { if (!historia.length) { $('stan').textContent = 'nie ma czego cofnąć'; return; } przyszlosc.push(zdjecieStanu()); przywroc(historia.pop()); $('stan').textContent = 'cofnięto (' + historia.length + ' w historii)'; if (!historia.length) $('bCofnij').className = ''; }
function ponow() { if (!przyszlosc.length) return; historia.push(zdjecieStanu()); przywroc(przyszlosc.pop()); $('stan').textContent = 'ponowiono'; }
$('bCofnij').onclick = cofnij; $('bPonow').onclick = ponow;

// --- skróty klawiszowe (z konfig.skroty) -------------------------------------
var AKCJE = {
  cofnij: ['cofnij ostatnią zmianę widoku', cofnij], ponow: ['ponów', ponow],
  widok2d: ['widok 2D', function () { przelacz('2d'); }], widok3d: ['widok 3D', function () { przelacz('3d'); }],
  zamroz: ['zamroź / odmroź układ', function () { zapamietaj(true); zamroz(!konfig.zamrozony); }],
  dane: ['panel danych', function () { $('bDane').onclick(); }], etykiety: ['etykiety', function () { $('bEtyk').onclick(); }], obszary: ['kwadraty obszarów', function () { $('bObsz').onclick(); }],
  kameraPrzod: ['kamera: przód', function () { zapamietaj(true); ustawKamere('przod'); }], kameraGora: ['kamera: góra', function () { zapamietaj(true); ustawKamere('gora'); }],
  kameraBok: ['kamera: bok', function () { zapamietaj(true); ustawKamere('bok'); }], kameraReset: ['kamera: reset', function () { zapamietaj(true); ustawKamere('reset'); }],
  calaSiec: ['cała sieć / zamknij karty', function () { proponujObszar(null); if (obszar !== null) ustawObszar(null); zaznacz(null); pokazKarte(null); $('sciaga').style.display = 'none'; }],
  sciaga: ['ta ściąga', function () { var s = $('sciaga'); s.style.display = s.style.display === 'block' ? 'none' : 'block'; }],
};
function opisKlawisza(ev) { var k = ev.key.toLowerCase(); return (ev.ctrlKey || ev.metaKey ? 'ctrl+' : '') + (ev.shiftKey && ev.key.length > 1 ? 'shift+' : '') + (ev.altKey ? 'alt+' : '') + k; }
// Uwaga: w tym szablonie ukośnik wsteczny ginie, więc bez regexów ze znakami specjalnymi — spacje usuwamy przez split/join.
function normalizuj(s) { return String(s || '').toLowerCase().split(' ').join('').replace('control', 'ctrl').replace('esc', 'escape').replace('escapeape', 'escape'); }
document.addEventListener('keydown', function (ev) {
  // Skróty milczą tylko tam, gdzie się pisze (pole tekstowe, lista); suwak po przeciągnięciu trzyma fokus, a litery mają działać.
  var cel = ev.target, wInput = cel && ((cel.tagName === 'INPUT' && cel.type !== 'range' && cel.type !== 'checkbox') || cel.tagName === 'SELECT' || cel.tagName === 'TEXTAREA');
  if (wInput && ev.key !== 'Escape') return;
  var opis = opisKlawisza(ev), skroty = konfig.skroty || {};
  // „shift+1” daje „!”: dopasuj po kodzie klawisza; z Shiftem goła cyfra/litera nie liczy się jako „1”.
  var opisKod = (ev.ctrlKey || ev.metaKey ? 'ctrl+' : '') + (ev.shiftKey ? 'shift+' : '') + (ev.altKey ? 'alt+' : '') + (ev.code.replace(/^(Key|Digit)/, '').toLowerCase());
  var symbol = ev.key.length === 1 && !/[a-z0-9]/i.test(ev.key) && !ev.ctrlKey && !ev.altKey;
  var kandydaci = [opisKod]; if (symbol) kandydaci.push(ev.key); if (!ev.shiftKey || ev.key.length > 1) kandydaci.push(opis);
  for (var nazwa in AKCJE) {
    var s = normalizuj(skroty[nazwa]); if (!s) continue;
    if (kandydaci.indexOf(s) >= 0) { ev.preventDefault(); $('stan').textContent = 'skrót: ' + AKCJE[nazwa][0]; AKCJE[nazwa][1](); return; }
  }
});
function rysujSciage() {
  var skroty = konfig.skroty || {};
  $('sciagaTab').innerHTML = Object.keys(AKCJE).map(function (n) { return '<tr><td><kbd>' + esc(skroty[n] || '—') + '</kbd></td><td>' + AKCJE[n][0] + '</td></tr>'; }).join('');
}
$('bSciaga').onclick = AKCJE.sciaga[1];
// Do testów automatycznych: pozycje węzłów 3D (tylko odczyt).
window.__mdPozycje = function () { return ostatnieW3.map(function (n) { return [n.id, Math.round(n.x || 0), Math.round(n.y || 0), Math.round(n.z || 0)]; }); };

// --- gizmo obrotu: obręcze YZ, XZ, XY, osie X, Y, Z ze środka, domek i presety kamery -----------------
// Rzut ortogonalny z bazy kamery: x_ekranu = punkt·prawo, y_ekranu = punkt·góra, głębia = punkt·przód.
// Kostkę widoku (ViewCube) właściciel kazał usunąć; klik w podpis osi ustawia widok z tej strony.
var KOSTKA = { R: 1.85, os: 1.3 };
// Obręcze leżą w płaszczyznach układu (jak gimbal): YZ obraca wokół X, XZ wokół Y, XY wokół Z.
// Punkt obręczy p(t) = R(cos t·a + sin t·b); os = a×b, więc obrót świata o +δ wokół os przesuwa p(t) do p(t+δ).
var PIERSCIENIE = [
  { id: 'YZ', os: [1, 0, 0], osN: 'X', a: [0, 1, 0], b: [0, 0, 1], an: 'Y', bn: 'Z' },
  { id: 'XZ', os: [0, 1, 0], osN: 'Y', a: [0, 0, 1], b: [1, 0, 0], an: 'Z', bn: 'X' },
  { id: 'XY', os: [0, 0, 1], osN: 'Z', a: [1, 0, 0], b: [0, 1, 0], an: 'X', bn: 'Y' }
];
var KOLOR_OSI = { X: '#ff6b6b', Y: '#7bd88f', Z: '#4fc3f7' };
var kulaChwycona = null, kostkaNad = null;
function iloczyn(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function kombinacja(P, ka, kb, kn) { return [ka * P.a[0] + kb * P.b[0] + (kn || 0) * P.os[0], ka * P.a[1] + kb * P.b[1] + (kn || 0) * P.os[1], ka * P.a[2] + kb * P.b[2] + (kn || 0) * P.os[2]]; }
function geometriaKostki() {
  var c = $('gizmo'), s = c.width, m = s / 2, r = s * 0.14, e = g3.camera().matrixWorld.elements;
  var b = { pr: [e[0], e[1], e[2]], gr: [e[4], e[5], e[6]], pz: [-e[8], -e[9], -e[10]] };
  function rzut(p) { return { x: m + iloczyn(p, b.pr) * r, y: m - iloczyn(p, b.gr) * r, g: iloczyn(p, b.pz) }; }
  // odcinek obręczy jest „z przodu”, gdy leży bliżej kamery niż środek gizma
  var ringi = PIERSCIENIE.map(function (P) {
    var pts = [];
    for (var i = 0; i <= 72; i++) { var t = i / 72 * 2 * Math.PI, q = rzut(kombinacja(P, Math.cos(t) * KOSTKA.R, Math.sin(t) * KOSTKA.R)); q.t = t; pts.push(q); }
    for (var k = 0; k < pts.length - 1; k++) pts[k].w = (pts[k].g + pts[k + 1].g) / 2 <= 0;
    return { P: P, pts: pts, bokiem: Math.abs(iloczyn(P.os, b.pz)) < 0.25 };
  });
  // osie ze środka: koniec dodatni z podpisem (klik = widok z tej strony), koniec ujemny blady
  var osie = [['X', [1, 0, 0]], ['Y', [0, 1, 0]], ['Z', [0, 0, 1]]].map(function (o) {
    var k = rzut([o[1][0] * KOSTKA.os, o[1][1] * KOSTKA.os, o[1][2] * KOSTKA.os]), u = rzut([-o[1][0] * KOSTKA.os * 0.7, -o[1][1] * KOSTKA.os * 0.7, -o[1][2] * KOSTKA.os * 0.7]);
    return { id: o[0], d: o[1], k: k, u: u, g: k.g };
  });
  return { s: s, m: m, r: r, b: b, rzut: rzut, ringi: ringi, osie: osie, dom: { x: s * 0.1, y: s * 0.1, r: s * 0.065 } };
}
function odlOdcinka(x, y, p, q) {
  var dx = q.x - p.x, dy = q.y - p.y, L = dx * dx + dy * dy, t = L ? ((x - p.x) * dx + (y - p.y) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t)); return Math.hypot(x - p.x - t * dx, y - p.y - t * dy);
}
// Co jest pod punktem (współrzędne płótna): dom, obręcz z przodu, koniec osi albo nic.
// Obręcz widziana bokiem (kreska przez środek) przegrywa z końcem osi i z obręczą widzianą na wprost.
function trafKostke(x, y) {
  var G = geometriaKostki();
  if (Math.hypot(x - G.dom.x, y - G.dom.y) < G.dom.r * 1.3) return { typ: 'dom' };
  var best = null;
  G.ringi.forEach(function (o) {
    for (var k = 0; k < o.pts.length - 1; k++) {
      var p = o.pts[k], q = o.pts[k + 1]; if (!p.w) continue;
      var dd = odlOdcinka(x, y, p, q), wynik = dd + (o.bokiem ? G.s * 0.02 : 0);
      if (dd < G.s * 0.045 && (!best || wynik < best.w)) best = { w: wynik, typ: 'pierscien', P: o.P, t: (p.t + q.t) / 2, bokiem: o.bokiem };
    }
  });
  if (best && !best.bokiem) return best;
  var os = null;
  G.osie.forEach(function (o) { var dd = Math.hypot(x - o.k.x, y - o.k.y); if (dd < G.s * 0.05 && (!os || o.g < os.g)) os = o; });
  if (os) return { typ: 'os', id: os.id, d: os.d };
  return best;
}
function rysujGizmo() {
  var c = $('gizmo'); if (!g3 || konfig.widok !== '3d') { c.style.display = 'none'; $('kamera').style.display = 'none'; $('osY').style.display = 'none'; $('osX').style.display = 'none'; return; }
  c.style.display = 'block'; $('kamera').style.display = 'flex'; rysujOsie();
  var G = geometriaKostki(), ctx = c.getContext('2d'), s = G.s;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  function sciezka(w) { ctx.beginPath(); ctx.moveTo(w[0].x, w[0].y); for (var i = 1; i < w.length; i++) ctx.lineTo(w[i].x, w[i].y); ctx.closePath(); }
  function strzalka(p, q, kolor, gr) {
    var dx = q.x - p.x, dy = q.y - p.y, L = Math.hypot(dx, dy); if (L < 2) return;
    var ux = dx / L, uy = dy / L, h = s * 0.04;
    ctx.strokeStyle = ctx.fillStyle = kolor; ctx.lineWidth = gr;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x - ux * h * 0.6, q.y - uy * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - ux * h - uy * h * 0.55, q.y - uy * h + ux * h * 0.55); ctx.lineTo(q.x - ux * h + uy * h * 0.55, q.y - uy * h - ux * h * 0.55); ctx.closePath(); ctx.fill();
  }
  function napis(t, x, y, kolor, wielkosc) {
    ctx.font = 'bold ' + Math.round(s * (wielkosc || 0.055)) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.strokeText(t, x, y); ctx.fillStyle = kolor; ctx.fillText(t, x, y);
  }
  var h0 = kulaChwycona ? kulaChwycona.traf : kostkaNad, aktywna = h0 && h0.typ === 'pierscien' ? h0.P : null;
  // płaszczyzna aktywnej obręczy: kwadrat i osie z jego narożnika (dwie w płaszczyźnie + oś obrotu), jak na szkicu właściciela
  if (aktywna) {
    var P = aktywna, Rp = KOSTKA.R * 1.02, kol = KOLOR_OSI[P.osN];
    var naroza = [G.rzut(kombinacja(P, -Rp, -Rp)), G.rzut(kombinacja(P, Rp, -Rp)), G.rzut(kombinacja(P, Rp, Rp)), G.rzut(kombinacja(P, -Rp, Rp))];
    ctx.globalAlpha = 0.14; ctx.fillStyle = kol; sciezka(naroza); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.strokeStyle = kol; ctx.lineWidth = 1.5; sciezka(naroza); ctx.stroke(); ctx.globalAlpha = 1;
    var o0 = naroza[0], kA = G.rzut(kombinacja(P, Rp * 1.25, -Rp)), kB = G.rzut(kombinacja(P, -Rp, Rp * 1.25)), kN = G.rzut(kombinacja(P, -Rp, -Rp, Rp * 0.9));
    strzalka(o0, kA, KOLOR_OSI[P.an], 2.5); strzalka(o0, kB, KOLOR_OSI[P.bn], 2.5); strzalka(o0, kN, KOLOR_OSI[P.osN], 2.5);
    [[kA, P.an], [kB, P.bn], [kN, P.osN]].forEach(function (o) {
      var dx = o[0].x - o0.x, dy = o[0].y - o0.y, L = Math.hypot(dx, dy);
      if (L < s * 0.03) return;
      napis(o[1], o[0].x + dx / L * s * 0.04, o[0].y + dy / L * s * 0.04, KOLOR_OSI[o[1]]);
    });
  }
  // obręcze: tylna połowa przed osiami (blada), przednia po nich
  function obrecze(przod) {
    G.ringi.forEach(function (o) {
      var akt = aktywna === o.P, kol = akt ? '#FFB000' : KOLOR_OSI[o.P.osN];
      ctx.strokeStyle = kol; ctx.lineWidth = s * (akt ? 0.03 : 0.02);
      for (var i = 0; i < o.pts.length - 1; i++) {
        var p = o.pts[i], q = o.pts[i + 1];
        if (!!p.w !== przod) continue;
        ctx.globalAlpha = przod ? (o.bokiem && !akt ? 0.4 : 0.95) : (akt ? 0.5 : 0.25); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (!przod || (o.bokiem && !akt)) return;
      // grot w najdalszym od środka punkcie przodu obręczy (przy remisie bliżej prawego górnego rogu),
      // w kierunku rosnącego t (tam obraca klik), i podpis płaszczyzny na zewnątrz
      var k = -1, kd = -1;
      o.pts.forEach(function (p, i) {
        if (i >= o.pts.length - 1 || !p.w || p.g > 0.2) return;
        var d0 = Math.hypot(p.x - G.m, p.y - G.m) + (p.x - p.y) * 0.002; if (d0 > kd) { kd = d0; k = i; }
      });
      if (k < 0) return;
      var a = o.pts[k], b2 = o.pts[(k + 3) % (o.pts.length - 1)];
      if (Math.hypot(b2.x - a.x, b2.y - a.y) > s * 0.02) strzalka(a, b2, kol, s * (akt ? 0.03 : 0.02));
      var sx = a.x - G.m, sy = a.y - G.m, L = Math.hypot(sx, sy) || 1;
      napis(o.P.id, a.x + sx / L * s * 0.07, a.y + sy / L * s * 0.07, kol, 0.05);
    });
  }
  obrecze(false);
  // osie X, Y, Z ze środka: dalsza rysowana wcześniej; podpis w kółku na końcu dodatnim, pod kursorem bursztynowy
  G.osie.slice().sort(function (a, b) { return b.g - a.g; }).forEach(function (o) {
    var nad = kostkaNad && kostkaNad.typ === 'os' && kostkaNad.id === o.id, kol = nad ? '#FFB000' : KOLOR_OSI[o.id], blisko = o.g <= 0.05;
    ctx.strokeStyle = kol; ctx.globalAlpha = 0.35; ctx.lineWidth = s * 0.008;
    ctx.beginPath(); ctx.moveTo(G.m, G.m); ctx.lineTo(o.u.x, o.u.y); ctx.stroke();
    ctx.globalAlpha = blisko ? 1 : 0.6; ctx.lineWidth = s * (nad ? 0.018 : 0.013);
    ctx.beginPath(); ctx.moveTo(G.m, G.m); ctx.lineTo(o.k.x, o.k.y); ctx.stroke();
    ctx.fillStyle = kol; ctx.beginPath(); ctx.arc(o.k.x, o.k.y, s * (nad ? 0.048 : 0.04), 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#000'; ctx.font = 'bold ' + Math.round(s * 0.048) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.id, o.k.x, o.k.y + 1); ctx.globalAlpha = 1;
  });
  ctx.fillStyle = '#c8c8c0'; ctx.beginPath(); ctx.arc(G.m, G.m, s * 0.012, 0, 2 * Math.PI); ctx.fill();
  obrecze(true);
  // dom = widok startowy
  var d = G.dom, domNad = kostkaNad && kostkaNad.typ === 'dom';
  ctx.fillStyle = domNad ? '#FFB000' : '#2a2a28'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = domNad ? '#000' : '#c8c8c0'; ctx.lineWidth = 2.2; ctx.beginPath();
  ctx.moveTo(d.x - d.r * 0.55, d.y - d.r * 0.02); ctx.lineTo(d.x, d.y - d.r * 0.55); ctx.lineTo(d.x + d.r * 0.55, d.y - d.r * 0.02);
  ctx.moveTo(d.x - d.r * 0.38, d.y - d.r * 0.12); ctx.lineTo(d.x - d.r * 0.38, d.y + d.r * 0.5); ctx.lineTo(d.x + d.r * 0.38, d.y + d.r * 0.5); ctx.lineTo(d.x + d.r * 0.38, d.y - d.r * 0.12);
  ctx.stroke();
}
setInterval(rysujGizmo, 60);
// Przeciągnięcie kostki = obrót kamery wokół celu kontrolek: poziomo wokół pionu kamery, pionowo wokół jej osi „w prawo”.
// Pion kamery obraca się razem z nią, więc można przejść nad biegunem bez skoku (jak trackball).
// Oś obrotu przechodzi zawsze przez środek grafu (decyzja właściciela: „oś wykresu ma być wedle jego środka”) —
// cel kamery ucieka w bok przy jeździe osiami i kółkiem, a wtedy graf kręcił się wokół „własnej”, przesuniętej osi.
// Środek = środek prostopadłościanu obejmującego wszystkie kropki; bez pozycji — cel kamery.
function srodekGrafu() {
  var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity], ile = 0;
  ostatnieW3.forEach(function (n) {
    if (typeof n.x !== 'number') return; ile++;
    var p = [n.x, n.y || 0, n.z || 0]; for (var i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], p[i]); mx[i] = Math.max(mx[i], p[i]); }
  });
  if (!ile) { var st = g3.controls(); return st && st.target ? st.target.clone() : new THREE.Vector3(); }
  return new THREE.Vector3((mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2);
}
// Obrót o kwaternion q wokół środka grafu: kamera i jej cel krążą razem, więc kadr obraca się bez skoku.
function obrocKwaternionem(q) {
  var kam = g3.camera(), ster = g3.controls(); if (!kam || !ster || !ster.target) return;
  var c = srodekGrafu(), t = ster.target;
  var off = kam.position.clone().sub(c).applyQuaternion(q), offT = t.clone().sub(c).applyQuaternion(q);
  kam.up.applyQuaternion(q).normalize(); kam.position.copy(c).add(off); t.copy(c).add(offT);
  kam.lookAt(t);
  rysujGizmo();
}
function obrocKamere(dx, dy) {
  var kam = g3.camera(); if (!kam) return;
  var kat = 0.012, prawo = new THREE.Vector3().setFromMatrixColumn(kam.matrixWorld, 0).normalize();
  var qYaw = new THREE.Quaternion().setFromAxisAngle(kam.up.clone().normalize(), -dx * kat);
  var qPitch = new THREE.Quaternion().setFromAxisAngle(prawo, -dy * kat);
  obrocKwaternionem(qYaw.multiply(qPitch));
}
// Obrót o kąt wokół osi świata przechodzącej przez środek grafu.
function obrocWokolOsi(os, kat) {
  obrocKwaternionem(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(os[0], os[1], os[2]).normalize(), kat));
}
// Przeciągnięcie obręczy = obrót tylko wokół jej osi. Ruch myszy, który obraca graf: prostopadły do osi widzianej na ekranie;
// gdy oś patrzy prawie w ekran (obręcz widać jako koło), styczny do obręczy w chwyconym punkcie — graf idzie za kursorem.
function obrocObrecza(h, dx, dy) {
  var G = geometriaKostki(), P = h.P;
  var A = { x: iloczyn(P.os, G.b.pr), y: -iloczyn(P.os, G.b.gr) }, LA = Math.hypot(A.x, A.y), kier;
  if (LA >= 0.35) kier = { x: -A.y / LA, y: A.x / LA };
  else {
    var st = kombinacja(P, -Math.sin(h.t), Math.cos(h.t));
    var T = { x: iloczyn(st, G.b.pr), y: -iloczyn(st, G.b.gr) }, LT = Math.hypot(T.x, T.y) || 1; kier = { x: T.x / LT, y: T.y / LT };
  }
  var delta = (dx * kier.x + dy * kier.y) * 0.012;
  if (delta) obrocWokolOsi(P.os, -delta);
}
// Klik w obręcz: płynny obrót o 90° wokół jej osi, w stronę grota.
function krokObreczy(h) { krokWokolOsi(h.P.os, -Math.PI / 2); }
// Płynny obrót kamery o kąt cel wokół stałej osi (350 ms, łagodny start i koniec).
function krokWokolOsi(os, cel) {
  var zrobione = 0, t0 = performance.now();
  function klatka(teraz) {
    var u = Math.min(1, (teraz - t0) / 350), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(2 - 2 * u, 2) / 2, kat = cel * e;
    obrocWokolOsi(os, kat - zrobione); zrobione = kat;
    if (u < 1) requestAnimationFrame(klatka);
  }
  requestAnimationFrame(klatka);
}
// Widok z kierunku d (np. [1,1,1] = narożnik): kamera po tej stronie środka grafu, w tej samej odległości od niego, płynny przelot.
function widokZKierunku(d) {
  if (!g3) return;
  var kam = g3.camera(), t = srodekGrafu();
  var dl = Math.hypot(d[0], d[1], d[2]), D = kam.position.distanceTo(t) || 600, k = [d[0] / dl, d[1] / dl, d[2] / dl];
  // z góry „przód” jest na dole ekranu, z dołu na górze; w pozostałych widokach oś Y w górę
  if (Math.abs(k[1]) > 0.99) kam.up.set(0, 0, k[1] > 0 ? -1 : 1); else kam.up.set(0, 1, 0);
  g3.cameraPosition({ x: t.x + k[0] * D, y: t.y + k[1] * D, z: t.z + k[2] * D }, { x: t.x, y: t.y, z: t.z }, 600);
}
function kliknijKostke(h) {
  if (!h) return;
  zapamietaj(true);
  if (h.typ === 'pierscien') krokObreczy(h); else if (h.typ === 'dom') ustawKamere('reset'); else if (h.typ === 'os') widokZKierunku(h.d);
}
function pozKostki(ev) { var c = $('gizmo'), rr = c.getBoundingClientRect(); return { x: (ev.clientX - rr.left) / rr.width * c.width, y: (ev.clientY - rr.top) / rr.height * c.height }; }
$('gizmo').addEventListener('pointerdown', function (ev) {
  if (!g3) return; var p = pozKostki(ev), h = trafKostke(p.x, p.y); if (!h) return;
  ev.preventDefault(); ev.stopPropagation();
  kulaChwycona = { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, cel: h.typ, traf: h, ruch: false };
  $('gizmo').setPointerCapture(ev.pointerId);
});
$('gizmo').addEventListener('pointermove', function (ev) {
  if (!g3) return;
  if (!kulaChwycona) {
    var p = pozKostki(ev), h = trafKostke(p.x, p.y); kostkaNad = h;
    $('gizmo').style.cursor = !h ? 'default' : h.typ === 'pierscien' ? 'grab' : 'pointer'; return;
  }
  if (kulaChwycona.cel === 'dom') return;
  if (!kulaChwycona.ruch) {
    if (Math.hypot(ev.clientX - kulaChwycona.x0, ev.clientY - kulaChwycona.y0) < 4) return;
    kulaChwycona.ruch = true; zapamietaj(true); $('gizmo').style.cursor = 'grabbing';
  }
  var dx = ev.clientX - kulaChwycona.x, dy = ev.clientY - kulaChwycona.y; kulaChwycona.x = ev.clientX; kulaChwycona.y = ev.clientY;
  if (kulaChwycona.cel === 'pierscien') obrocObrecza(kulaChwycona.traf, dx, dy); else obrocKamere(dx, dy);
});
function pusc(ev) {
  if (!kulaChwycona) return; var k = kulaChwycona; kulaChwycona = null;
  try { $('gizmo').releasePointerCapture(ev.pointerId); } catch (e) {}
  if (!k.ruch && ev.type === 'pointerup') kliknijKostke(k.traf);
  $('gizmo').style.cursor = 'default'; rysujGizmo();
}
$('gizmo').addEventListener('pointerup', pusc); $('gizmo').addEventListener('pointercancel', pusc);
$('gizmo').addEventListener('pointerleave', function () { if (!kulaChwycona) { kostkaNad = null; rysujGizmo(); } });

// --- uchwyty osi grafu na brzegach sceny: Y wzdłuż lewego brzegu (w górę), X wzdłuż dolnego (w prawo) -----
// Narzędzie do podróżowania po grafie (decyzja właściciela): osie PRZESUWAJĄ kamerę od miejsca, w którym jest, względem ekranu;
// nie obracają i nie mają związku z kostką. Y: kamera jedzie w górę / w dół, X: w lewo / w prawo, w głąb — kółko myszy (przelot).
// Kierunek patrzenia zostaje; kamera i cel kontrolek jadą razem. Klik w grot = skok o ćwierć wysokości kadru w tę stronę.
var osieNad = null, osieChwyt = null;
function plotnoOsi(c) {
  var dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight, W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
  var ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.lineCap = 'round';
  return { ctx: ctx, w: w, h: h };
}
function linia(ctx, x0, y0, x1, y1, kol, gr) { ctx.strokeStyle = kol; ctx.lineWidth = gr; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function grot(ctx, x, y, ux, uy, kol, duzy) {
  var h = duzy ? 15 : 11, w = duzy ? 8 : 6; ctx.fillStyle = kol;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * h - uy * w, y - uy * h + ux * w); ctx.lineTo(x - ux * h + uy * w, y - uy * h - ux * w); ctx.closePath(); ctx.fill();
}
// Obie osie mają groty na obu końcach (jak na szkicu właściciela): klik w grot = obrót o 90° w tę stronę.
function rysujOsie() {
  var cy = $('osY'), cx = $('osX'); cy.style.display = 'block'; cx.style.display = 'block';
  var akt = osieChwyt ? osieChwyt.traf : osieNad;
  function stan(id) { var on = !!(akt && akt.os === id); return { on: on, koniec: on ? akt.koniec : 0, kol: on ? '#FFB000' : KOLOR_OSI[id], gr: on ? 5 : 3 }; }
  var sY = stan('Y'), sX = stan('X');
  // lewy brzeg: oś Y, grot w górę i w dół
  var a = plotnoOsi(cy); if (a.w && a.h) {
    linia(a.ctx, 16, 18, 16, a.h - 18, sY.kol, sY.gr);
    grot(a.ctx, 16, 6, 0, -1, sY.kol, sY.koniec === 1); grot(a.ctx, 16, a.h - 6, 0, 1, sY.kol, sY.koniec === -1);
    a.ctx.font = 'bold 14px monospace'; a.ctx.textAlign = 'left'; a.ctx.textBaseline = 'middle'; a.ctx.fillStyle = sY.kol; a.ctx.fillText('Y', 27, 14);
    a.ctx.save(); a.ctx.translate(31, a.h / 2); a.ctx.rotate(-Math.PI / 2); a.ctx.font = '11px monospace'; a.ctx.textAlign = 'center';
    a.ctx.fillStyle = sY.on ? '#FFB000' : '#8a8a84'; a.ctx.fillText('↕ jedź w górę / w dół', 0, 0); a.ctx.restore();
  }
  // dolny brzeg: oś X, grot w lewo i w prawo
  var b = plotnoOsi(cx); if (b.w && b.h) {
    var oy = b.h - 16;
    linia(b.ctx, 18, oy, b.w - 18, oy, sX.kol, sX.gr);
    grot(b.ctx, 6, oy, -1, 0, sX.kol, sX.koniec === -1); grot(b.ctx, b.w - 6, oy, 1, 0, sX.kol, sX.koniec === 1);
    b.ctx.font = 'bold 14px monospace'; b.ctx.textAlign = 'right'; b.ctx.textBaseline = 'middle'; b.ctx.fillStyle = sX.kol; b.ctx.fillText('X', b.w - 8, oy - 14);
    b.ctx.font = '11px monospace'; b.ctx.textAlign = 'center'; b.ctx.fillStyle = sX.on ? '#FFB000' : '#8a8a84'; b.ctx.fillText('↔ jedź w lewo / w prawo', b.w / 2, oy - 12);
  }
}
// Trafienie w pikselach CSS płótna: koniec = +1 (grot w górę / w prawo), −1 (w dół / w lewo), 0 = sama linia.
function trafOsie(id, x, y, w, h) {
  if (id === 'osY') return { os: 'Y', grot: y < 30 || y > h - 30, koniec: y < 30 ? 1 : y > h - 30 ? -1 : 0 };
  return { os: 'X', grot: x < 30 || x > w - 30, koniec: x > w - 30 ? 1 : x < 30 ? -1 : 0 };
}
// Przesunięcie kamery o px pikseli ekranu wzdłuż osi ekranu (X = w prawo, Y = w górę); skala z odległości od celu,
// więc w płaszczyźnie celu obraz przesuwa się o tyle samo pikseli, ile przejechał kursor.
function jedz(id, px) {
  var kam = g3.camera(), ster = g3.controls(); if (!kam || !ster || !ster.target) return;
  var D = kam.position.distanceTo(ster.target) || 600, h = g3.renderer().domElement.clientHeight || 600;
  var naPiksel = 2 * D * Math.tan((kam.fov || 40) * Math.PI / 360) / h;
  var v = new THREE.Vector3().setFromMatrixColumn(kam.matrixWorld, id === 'X' ? 0 : 1).normalize().multiplyScalar(px * naPiksel);
  kam.position.add(v); ster.target.add(v);
}
// Ciągnięcie: Y w górę = kamera w górę, X w prawo = kamera w prawo.
function jedzUchwytem(id, dx, dy) { if (id === 'Y') jedz('Y', -dy); else jedz('X', dx); }
// Płynny skok o ćwierć wysokości kadru (300 ms).
function krokJazdy(id, znak) {
  var cel = (g3.renderer().domElement.clientHeight || 600) * 0.25 * znak, zrobione = 0, t0 = performance.now();
  function klatka(teraz) {
    var u = Math.min(1, (teraz - t0) / 300), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(2 - 2 * u, 2) / 2, px = cel * e;
    jedz(id, px - zrobione); zrobione = px;
    if (u < 1) requestAnimationFrame(klatka);
  }
  requestAnimationFrame(klatka);
}
function kliknijOsie(h) {
  if (!h || !h.grot) return;
  zapamietaj(true);
  krokJazdy(h.os, h.koniec);
}
['osY', 'osX'].forEach(function (id) {
  var c = $(id);
  function traf(ev) { var rr = c.getBoundingClientRect(); return trafOsie(id, ev.clientX - rr.left, ev.clientY - rr.top, rr.width, rr.height); }
  c.addEventListener('pointerdown', function (ev) {
    if (!g3) return; var h = traf(ev);
    ev.preventDefault(); ev.stopPropagation();
    osieChwyt = { c: c, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, traf: h, ruch: false };
    c.setPointerCapture(ev.pointerId);
  });
  c.addEventListener('pointermove', function (ev) {
    if (!g3) return;
    if (!osieChwyt) { var h = traf(ev); osieNad = h; c.style.cursor = h.grot ? 'pointer' : h.os === 'Y' ? 'ns-resize' : 'ew-resize'; rysujOsie(); return; }
    if (osieChwyt.c !== c) return;
    if (!osieChwyt.ruch) {
      if (Math.hypot(ev.clientX - osieChwyt.x0, ev.clientY - osieChwyt.y0) < 4) return;
      osieChwyt.ruch = true; zapamietaj(true); c.style.cursor = 'grabbing';
    }
    var dx = ev.clientX - osieChwyt.x, dy = ev.clientY - osieChwyt.y; osieChwyt.x = ev.clientX; osieChwyt.y = ev.clientY;
    jedzUchwytem(osieChwyt.traf.os, dx, dy);
  });
  function pusc(ev) {
    if (!osieChwyt || osieChwyt.c !== c) return; var k = osieChwyt; osieChwyt = null;
    try { c.releasePointerCapture(ev.pointerId); } catch (e) {}
    if (!k.ruch && ev.type === 'pointerup') kliknijOsie(k.traf);
    c.style.cursor = 'default'; rysujOsie();
  }
  c.addEventListener('pointerup', pusc); c.addEventListener('pointercancel', pusc);
  c.addEventListener('pointerleave', function () { if (!osieChwyt) { osieNad = null; rysujOsie(); } });
});
// Do testów: trafienie / klik w uchwyt osi (id płótna, punkt w pikselach CSS).
window.__mdOsie = function (id, x, y, klik) { var c = $(id), h = trafOsie(id, x, y, c.clientWidth, c.clientHeight); if (klik) kliknijOsie(h); return h; };
// Do testów automatycznych: obrót jak przeciągnięcie kostki, trafienie / klik w punkt płótna kostki.
window.__mdObrocKule = function (dx, dy) { obrocKamere(dx, dy); };
window.__mdKostka = function (x, y, klik) {
  var h = trafKostke(x, y); if (klik) kliknijKostke(h);
  return h ? { typ: h.typ, kierunek: h.d || null, os: h.id || null, obrecz: h.P ? h.P.id : null } : null;
};
// Do testów: punkt płótna na obręczy (id) w parametrze t.
window.__mdPunktObreczy = function (id, t) {
  var G = geometriaKostki(), o = G.ringi.filter(function (r) { return r.P.id === id; })[0]; if (!o) return null;
  var q = G.rzut(kombinacja(o.P, Math.cos(t) * KOSTKA.R, Math.sin(t) * KOSTKA.R)); return { x: q.x, y: q.y, g: q.g };
};
// Promień układu 3D (największa odległość kropki od środka ciężkości) — skala dla kroków kamery.
function promienUkladu() {
  var c = [0, 0, 0], n0 = 0, R = 0;
  ostatnieW3.forEach(function (n) { if (typeof n.x === 'number') { c[0] += n.x; c[1] += n.y || 0; c[2] += n.z || 0; n0++; } });
  if (!n0) return 300;
  c = [c[0] / n0, c[1] / n0, c[2] / n0];
  ostatnieW3.forEach(function (n) { if (typeof n.x === 'number') R = Math.max(R, Math.hypot(n.x - c[0], (n.y || 0) - c[1], (n.z || 0) - c[2])); });
  return R || 300;
}
window.__mdKamera = function () { return g3 ? g3.cameraPosition() : null; };
// Kamera ustawiana na środek układu z odległości wynikającej z jego rozmiaru.
function ustawKamere(jak) {
  if (!g3) return;
  var c = [0, 0, 0], n0 = 0, R = 0;
  ostatnieW3.forEach(function (n) { if (typeof n.x === 'number') { c[0] += n.x; c[1] += n.y || 0; c[2] += n.z || 0; n0++; } });
  if (n0) c = [c[0] / n0, c[1] / n0, c[2] / n0];
  ostatnieW3.forEach(function (n) { if (typeof n.x === 'number') R = Math.max(R, Math.hypot(n.x - c[0], (n.y || 0) - c[1], (n.z || 0) - c[2])); });
  var D = Math.max(200, R * 2.2), cel = { x: c[0], y: c[1], z: c[2] };
  var poz = jak === 'gora' ? { x: c[0], y: c[1] + D, z: c[2] + 0.01 } : jak === 'bok' ? { x: c[0] + D, y: c[1], z: c[2] } : { x: c[0], y: c[1], z: c[2] + D };
  if (jak === 'reset') { g3.camera().up.set(0, 1, 0); }
  g3.cameraPosition(poz, cel, 700);
}
document.addEventListener('click', function (e) { var b = e.target.closest ? e.target.closest('[data-kam]') : null; if (b) { zapamietaj(true); ustawKamere(b.dataset.kam); } });

// --- panel podglądu danych ---------------------------------------------------
var sortKol = 'glebokosc', sortKier = 1, podswietlony = null;
function stopnie() { var d = {}; dane.links.forEach(function (l) { var s = id_(l.source), t = id_(l.target); d[s] = (d[s] || 0) + 1; d[t] = (d[t] || 0) + 1; }); return d; }
function pasuje(q, n) { return !q || [n.nazwa, n.warstwa, NAZWA_WARSTWY[n.warstwa], n.grupa, n.poziom, n.opis].join(' ').toLowerCase().indexOf(q) >= 0; }
function rysujDane() {
  var el = $('dane'); el.style.display = konfig.panelDanych ? 'flex' : 'none'; $('bDane').className = konfig.panelDanych ? 'on' : '';
  if (!konfig.panelDanych || !graf) return;
  var q = ($('szukaj').value || '').toLowerCase().trim(), st = stopnie();
  var wiersze = dane.nodes.filter(widoczny).filter(function (n) { return pasuje(q, n); }).map(function (n) {
    return { id: n.id, nazwa: n.nazwa, warstwa: n.warstwa, glebokosc: n.glebokosc || 0, grupa: n.grupa || '', powiazania: st[n.id] || 0, ryzyko: n.poziom ? ODL_RYZYKA[n.poziom] : 4, ryzykoNazwa: n.poziom || '' };
  });
  wiersze.sort(function (a, b) { var x = a[sortKol], y = b[sortKol]; if (typeof x === 'string') return x.localeCompare(y) * sortKier; return (x - y) * sortKier; });
  var kol = [['nazwa', 'nazwa'], ['warstwa', 'kategoria'], ['glebokosc', 'kroki'], ['grupa', 'skupisko'], ['powiazania', 'powiąz.'], ['ryzyko', 'ryzyko']];
  var th = '<tr>' + kol.map(function (k) { return '<th data-sort="' + k[0] + '"' + (sortKol === k[0] ? ' class="sort"' : '') + '>' + k[1] + (sortKol === k[0] ? (sortKier > 0 ? ' ▲' : ' ▼') : '') + '</th>'; }).join('') + '</tr>';
  $('tWezly').innerHTML = th + wiersze.map(function (w) {
    return '<tr class="w' + (podswietlony === w.id ? ' pod' : '') + '" data-id="' + esc(w.id) + '"><td><i style="background:' + KOLOR_WARSTWY[w.warstwa] + '"></i>' + esc(w.nazwa) + '</td><td>' + NAZWA_WARSTWY[w.warstwa] + '</td><td>' + w.glebokosc + '</td><td>' + esc(w.grupa) + '</td><td>' + w.powiazania + '</td><td' + (w.ryzykoNazwa ? ' style="color:' + KOLOR_POZIOMU[w.ryzykoNazwa] + '"' : '') + '>' + (w.ryzykoNazwa || '') + '</td></tr>';
  }).join('');
  var kr = dane.links.filter(function (l) { var s = wezly[id_(l.source)], t = wezly[id_(l.target)]; return s && t && widoczny(s) && widoczny(t) && konfig.krawedzie[l.typ] !== false && (!q || pasuje(q, s) || pasuje(q, t) || NAZWA_TYPU[l.typ].indexOf(q) >= 0); });
  $('tKraw').innerHTML = '<tr><th>z</th><th>typ</th><th>do</th><th>waga</th></tr>' + kr.map(function (l) {
    var s = wezly[id_(l.source)], t = wezly[id_(l.target)];
    return '<tr class="w" data-id="' + esc(s.id) + '"><td>' + esc(s.nazwa) + '</td><td style="color:' + KOLOR_TYPU[l.typ] + '">' + NAZWA_TYPU[l.typ] + '</td><td>' + esc(t.nazwa) + '</td><td>' + (Math.round(l.waga * 10) / 10) + '</td></tr>';
  }).join('');
  $('dLicz').textContent = wiersze.length + ' węzłów · ' + kr.length + ' zależności';
}
function podswietlWiersz(id) {
  podswietlony = id;
  var rows = $('tWezly').querySelectorAll('tr.w'); for (var i = 0; i < rows.length; i++) rows[i].className = 'w' + (rows[i].dataset.id === id ? ' pod' : '');
  // Przewijanie tylko w pionie (scrollIntoView potrafi przesunąć tabelę w bok i ukryć kolumnę z nazwą).
  var r = $('tWezly').querySelector('tr.pod'), box = document.querySelector('#dane .tresc');
  if (r && box && konfig.panelDanych) { var g = r.offsetTop, d = g + r.offsetHeight; if (g < box.scrollTop + 30) box.scrollTop = g - 30; else if (d > box.scrollTop + box.clientHeight) box.scrollTop = d - box.clientHeight; }
}
$('bDane').onclick = function () { konfig.panelDanych = !konfig.panelDanych; zapisz(); rysujDane(); };
$('bDaneZamknij').onclick = function () { konfig.panelDanych = false; zapisz(); rysujDane(); };
$('szukaj').addEventListener('input', rysujDane);
$('dane').addEventListener('click', function (e) {
  var th = e.target.closest ? e.target.closest('th[data-sort]') : null;
  if (th) { if (sortKol === th.dataset.sort) sortKier = -sortKier; else { sortKol = th.dataset.sort; sortKier = 1; } rysujDane(); return; }
  var tr = e.target.closest ? e.target.closest('tr.w') : null;
  if (tr) { var n = wezly[tr.dataset.id]; if (n) { n.klik = true; zaznacz(n); pokazKarte(n); podswietlWiersz(n.id); } }
});

// Zamrożenie: fizyka zrobiła zdjęcie, węzły dostają stałe współrzędne; odmrożenie zwraca je symulacji.
function zamroz(wl) {
  konfig.zamrozony = !!wl; zapisz();
  dane.nodes.forEach(function (n) { if (wl) { if (typeof n.x === 'number') { n.fx = n.x; n.fy = n.y; } } else { delete n.fx; delete n.fy; } });
  ostatnieW3.forEach(function (n) { if (wl) { if (typeof n.x === 'number') { n.fx = n.x; n.fz = n.z; } } else { delete n.fx; delete n.fz; } });
  if (!wl) zastosujGrupowanie(ostatnieW3);
  if (g2) g2.d3ReheatSimulation(); if (g3) g3.d3ReheatSimulation();
  $('bZamroz').className = wl ? 'on' : ''; $('bZamroz').textContent = wl ? 'układ zamrożony' : 'zamroź układ';
}
// Lekkie przyciąganie do osi pionowej w 3D: osierocone lub słabo związane węzły nie odlatują i nie rozciągają obszarów.
function silaSrodka(k) {
  var lista = [];
  function sila(alpha) { lista.forEach(function (n) { n.vx -= (n.x || 0) * k * alpha; n.vz -= (n.z || 0) * k * alpha; }); }
  sila.initialize = function (nodes) { lista = nodes; };
  return sila;
}

// --- kwadraty obszarów w 3D -------------------------------------------------
function etykieta3d(tekst, kolor) {
  var c = document.createElement('canvas'); c.width = 512; c.height = 64; var x = c.getContext('2d');
  x.font = 'bold 30px JetBrains Mono, monospace'; x.fillStyle = kolor; x.textBaseline = 'middle'; x.fillText(tekst, 8, 32);
  var t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter;
  var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(96, 12, 1); return s;
}
function usunObszary3d() { plaszczyzny.forEach(function (p) { g3.scene().remove(p.grupa); }); plaszczyzny = []; }
function rysujObszary3d(w3) {
  if (!g3) return;
  usunObszary3d();
  if (!konfig.obszary3d || konfig.grupowanie === 'brak') return;
  var P = poziomy(), od3 = odstep();
  // Jeden sześcian na obszar: przy powiązaniach wiele skupisk na tej samej płaszczyźnie.
  var klucze = [], wgKlucza = {};
  w3.forEach(function (n) { var k = kluczObszaru(n); if (!wgKlucza[k]) { wgKlucza[k] = []; klucze.push(k); } wgKlucza[k].push(n); });
  klucze.forEach(function (p) {
    var moje = wgKlucza[p], i = indeksPoziomu(poziomKlucza(p));
    if (!moje.length || i < 0) return;
    // Obszar = przestrzeń 3D (bryła): półprzezroczysty prostopadłościan o wysokości części odstępu między poziomami.
    var kolor = kolorObszaru(p, moje), grupa = new THREE.Group(), wybrany = obszar === p || proponowany === p;
    var mat = new THREE.MeshBasicMaterial({ color: kolor, transparent: true, opacity: wybrany ? 0.22 : 0.07, side: THREE.DoubleSide, depthWrite: false });
    var kw = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat); kw.userData.poziom = p;
    var ramka = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: kolor, transparent: true, opacity: wybrany ? 0.95 : 0.5 }));
    var podpis = etykieta3d((konfig.grupowanie === 'powiazania' ? String(p).split('|')[1] : nazwaPoziomu(p)) + ' · ' + moje.length, kolor);
    kw.frustumCulled = false; ramka.frustumCulled = false; podpis.frustumCulled = false;
    grupa.add(kw); grupa.add(ramka); grupa.add(podpis);
    grupa.position.y = (P.length / 2 - i) * od3;
    g3.scene().add(grupa);
    plaszczyzny.push({ grupa: grupa, kw: kw, ramka: ramka, podpis: podpis, wezly: moje, poziom: p, indeks: i });
  });
  dopasujObszary3d();
}
// Kwadrat obejmuje swoje kropki: środek = środek ciężkości, bok = rozrzut + margines (co kilka klatek).
function dopasujObszary3d() {
  var P = poziomy(), od3 = odstep();
  plaszczyzny.forEach(function (pl) {
    // Poziom bryły = średnia wysokość jej kropek (po modulacji osiami kamery kropki mogą zejść z formuły poziomu); bez pozycji — formuła.
    var ys = []; pl.wezly.forEach(function (n) { if (typeof n.y === 'number') ys.push(n.y); });
    pl.grupa.position.y = ys.length ? ys.reduce(function (a, b) { return a + b; }, 0) / ys.length : (P.length / 2 - pl.indeks) * od3;
    var xs = [], zs = [];
    pl.wezly.forEach(function (n) { if (typeof n.x === 'number') { xs.push(n.x); zs.push(n.z || 0); } });
    if (!xs.length) return;
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), minz = Math.min.apply(null, zs), maxz = Math.max.apply(null, zs);
    var bok = Math.min(480, Math.max(konfig.grupowanie === 'powiazania' ? 40 : 60, Math.max(maxx - minx, maxz - minz) + (konfig.grupowanie === 'powiazania' ? 30 : 50))), cx = (minx + maxx) / 2, cz = (minz + maxz) / 2;
    var wys = Math.max(14, konfig.fizyka.odstepWarstw3d * 0.45);   // grubość bryły stała: rozsunięcie nie rozciąga brył
    pl.kw.position.set(cx, 0, cz); pl.kw.scale.set(bok, wys, bok);
    pl.ramka.position.set(cx, 0, cz); pl.ramka.scale.set(bok, wys, bok);
    pl.podpis.position.set(cx - bok / 2 + 48, wys / 2 + 7, cz - bok / 2 - 4);
  });
}
var klatka = 0;
function tik3d() { if (++klatka % 10 === 0) dopasujObszary3d(); }
// Kliknięcie w kwadrat (gdy nie w kropkę) = reprezentacja 2D tego obszaru.
var start3d = null;
function kliknietoScene3d(ev) {
  // Przeciągnięcie kamery to nie klik: liczy się tylko ruch poniżej 5 px między naciśnięciem a puszczeniem.
  if (start3d && Math.hypot(ev.clientX - start3d.x, ev.clientY - start3d.y) > 5) return;
  if (hover3d || !plaszczyzny.length) return;
  var r = g3.renderer().domElement.getBoundingClientRect();
  var ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  var ray = new THREE.Raycaster(); ray.setFromCamera(ndc, g3.camera());
  var traf = ray.intersectObjects(plaszczyzny.map(function (p) { return p.kw; }), false);
  if (traf.length) proponujObszar(traf[0].object.userData.poziom); else proponujObszar(null);
}
// Klik w bryłę tylko ją zaznacza; przejście do 2D wymaga potwierdzenia.
var proponowany = null;
function proponujObszar(p) {
  proponowany = p;
  var el = $('potwierdz');
  if (p === null) { el.style.display = 'none'; } else {
    var moje = dane.nodes.filter(function (x) { return widoczny(x) && kluczObszaru(x) === p; });
    el.style.display = 'flex'; $('pKolor').style.background = kolorObszaru(p, moje);
    $('pNazwa').textContent = 'obszar: ' + nazwaObszaru(p) + ' · ' + moje.length + ' węzłów';
  }
  if (g3) rysujObszary3d(Object.keys(wezly3).map(function (id) { return wezly3[id]; }).filter(function (n) { return wezly[n.id] && widoczny(n); }));
}
function potwierdzObszar() { var p = proponowany; proponujObszar(null); ustawObszar(p); przelacz('2d'); }

function ustawObszar(p) { obszar = p; zaznacz(null); pokazKarte(null); przerysuj(); if (g2) setTimeout(function () { g2.zoomToFit(400, 60); }, 600); }

// Wejścia i wyjścia obszaru jako całości: zależności przekraczające jego granicę, pogrupowane po typie.
function rysujWejWyj(w2) {
  var el = $('wejwyj');
  if (obszar === null) { el.style.display = 'none'; return; }
  var we = {}, wy = {}, wew = 0;
  dane.links.forEach(function (l) {
    var s = wezly[id_(l.source)], t = wezly[id_(l.target)];
    if (!s || !t || konfig.krawedzie[l.typ] === false || !widoczny(s) || !widoczny(t)) return;
    var sIn = wObszarze(s), tIn = wObszarze(t);
    if (sIn && tIn) { wew++; return; }
    if (tIn) (we[l.typ] = we[l.typ] || []).push(esc(s.nazwa) + ' → ' + esc(t.nazwa));
    else if (sIn) (wy[l.typ] = wy[l.typ] || []).push(esc(s.nazwa) + ' → ' + esc(t.nazwa));
  });
  function lista(m) { var k = Object.keys(m); if (!k.length) return '<div class="opis" style="color:#8a8a86;font-size:12px">brak</div>'; return k.map(function (t) { return '<li><b>' + NAZWA_TYPU[t] + '</b> (' + m[t].length + ')<ul style="padding-left:10px">' + m[t].slice(0, 12).map(function (x) { return '<li>' + x + '</li>'; }).join('') + (m[t].length > 12 ? '<li style="color:#8a8a86">… +' + (m[t].length - 12) + '</li>' : '') + '</ul></li>'; }).join(''); }
  var nWe = Object.keys(we).reduce(function (a, k) { return a + we[k].length; }, 0), nWy = Object.keys(wy).reduce(function (a, k) { return a + wy[k].length; }, 0);
  $('wTytul').innerHTML = 'obszar <span style="color:' + kolorObszaru(obszar, dane.nodes.filter(wObszarze)) + '">' + esc(nazwaObszaru(obszar)) + '</span> · wejścia ' + nWe + ' · wyjścia ' + nWy + ' · wewnątrz ' + wew;
  $('wTresc').innerHTML = '<h2>wejścia — co zależy od obszaru / zasila go</h2><ul class="we">' + lista(we) + '</ul><h2>wyjścia — dokąd obszar prowadzi</h2><ul class="wy">' + lista(wy) + '</ul>';
  el.style.display = 'block';
}
function rysujPasekObszaru(w2) {
  var el = $('obszar');
  if (obszar === null) { el.style.display = 'none'; return; }
  var moje = w2.filter(wObszarze), wl = moje.length;
  el.style.display = 'flex'; $('oKolor').style.background = kolorObszaru(obszar, moje);
  $('oNazwa').textContent = 'obszar: ' + nazwaObszaru(obszar);
  $('oOpis').textContent = wl + ' węzłów + ' + (w2.length - wl) + ' sąsiadów';
}

// --- zaznaczenie, karta ------------------------------------------------------
function zaznacz(n) {
  zaznaczony = n; sasiedzi = {}; krawSas = {};
  if (n) { sasiedzi[n.id] = true; dane.links.forEach(function (l) { var s = id_(l.source), t = id_(l.target); if (s === n.id || t === n.id) { sasiedzi[s] = true; sasiedzi[t] = true; krawSas[s + '>' + t + l.typ] = true; } }); }
  if (g2) g2.nodeColor(g2.nodeColor());
  if (g3) { g3.nodeColor(g3.nodeColor()); g3.linkColor(g3.linkColor()); }
}
function pokazKarte(n) {
  if (!n) { $('karta').style.display = 'none'; return; }
  $('karta').style.display = 'block';
  $('kNazwa').innerHTML = (n.poziom ? '<span class="znak" style="background:' + KOLOR_POZIOMU[n.poziom] + '">' + n.poziom + '</span>' : '') + esc(n.nazwa);
  $('kOpis').textContent = NAZWA_WARSTWY[n.warstwa] + ' · ' + n.opis;
  var wy = [], we = [];
  dane.links.forEach(function (l) {
    var s = id_(l.source), t = id_(l.target);
    if (s === n.id) wy.push('<li><b>' + NAZWA_TYPU[l.typ] + '</b> → ' + esc(wezly[t].nazwa) + (l.waga > 1 ? ' <span style="color:#8a8a86">×' + Math.round(l.waga) + '</span>' : '') + '</li>');
    if (t === n.id) we.push('<li>' + esc(wezly[s].nazwa) + ' <b>' + NAZWA_TYPU[l.typ] + '</b> →</li>');
  });
  $('kTresc').innerHTML = (wy.length ? '<h2>prowadzi do</h2><ul>' + wy.join('') + '</ul>' : '') + (we.length ? '<h2>zależy od</h2><ul>' + we.join('') + '</ul>' : '') + (!wy.length && !we.length ? '<div class="opis">bez powiązań</div>' : '') + '<div class="row"><button data-obszar2d="' + n.warstwa + '">obszar „' + NAZWA_WARSTWY[n.warstwa] + '” w 2D</button></div>';
}

// --- rysowanie 2D ------------------------------------------------------------
function rysujWezel2d(n, ctx, skala) {
  var r = Math.max(3, Math.sqrt(n.waga) * 3), dim = przyciemnij(n) || (obszar !== null && !wObszarze(n) && !sasiedzi[n.id]);
  ctx.globalAlpha = dim ? (obszar !== null && !zaznaczony ? 0.45 : 0.18) : 1;
  ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
  ctx.fillStyle = n.warstwa === 'ryzyka' ? kolorWezla(n) : '#050505'; ctx.fill();
  ctx.lineWidth = n.id === (zaznaczony && zaznaczony.id) ? 3 : 1.8; ctx.strokeStyle = kolorWezla(n); ctx.stroke();
  if (n.poziom && n.warstwa !== 'ryzyka') { ctx.beginPath(); ctx.arc(n.x + r * 0.8, n.y - r * 0.8, Math.max(2, r / 3), 0, 2 * Math.PI); ctx.fillStyle = KOLOR_POZIOMU[n.poziom]; ctx.fill(); }
  if (konfig.etykiety || sasiedzi[n.id] || wObszarze(n)) {
    var f = Math.max(10 / skala, 3); ctx.font = (n.warstwa === 'sesja' || wObszarze(n) ? 'bold ' : '') + f + 'px JetBrains Mono, monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = dim ? '#666' : (n.warstwa === 'ryzyka' ? '#ffb3b3' : '#f0f0ec');
    ctx.fillText(n.nazwa.length > 34 ? n.nazwa.slice(0, 32) + '…' : n.nazwa, n.x + r + 3, n.y);
  }
  ctx.globalAlpha = 1;
}
function kolorKrawedzi(l) {
  var s = id_(l.source), t = id_(l.target), k = KOLOR_TYPU[l.typ] || '#333';
  if (zaznaczony) return krawSas[s + '>' + t + l.typ] ? k : 'rgba(60,60,60,0.25)';
  if (l.waga < 0.5) return 'rgba(120,120,120,0.35)';   // słabe powiązanie (np. wyłączony plugin)
  return k;
}
function init2d() {
  g2 = ForceGraph()($('g2'))
    .backgroundColor('#000').nodeId('id').nodeVal(function (n) { return n.waga; })
    .nodeCanvasObject(rysujWezel2d).nodePointerAreaPaint(function (n, c, ctx) { var r = Math.max(3, Math.sqrt(n.waga) * 3) + 2; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 2 * Math.PI); ctx.fill(); })
    .nodeLabel(function (n) { return esc(n.nazwa) + '<br><span style="color:#8a8a86">' + esc(n.opis) + '</span>'; })
    .linkColor(kolorKrawedzi).linkWidth(function (l) { return 0.6 + Math.min(4, l.waga); })
    .linkDirectionalArrowLength(4).linkDirectionalArrowRelPos(1).linkLineDash(function (l) { return l.typ === 'dziedziczy' || l.waga < 0.5 ? [3, 3] : null; })
    .linkDirectionalParticles(function (l) { return l.typ === 'zagraza' ? 2 : 0; }).linkDirectionalParticleColor(function () { return '#ff4d4d'; }).linkDirectionalParticleWidth(2)
    .onNodeHover(function (n) { if (!zaznaczony || !zaznaczony.klik) zaznacz(n); $('g2').style.cursor = n ? 'pointer' : null; if (n) podswietlWiersz(n.id); })
    .onNodeClick(function (n) { n.klik = true; zaznacz(n); pokazKarte(n); })
    .onBackgroundClick(function () { zaznacz(null); pokazKarte(null); })
    .cooldownTicks(200).warmupTicks(60)
    .onEngineStop(function () { if (!dopasowano2d) { dopasowano2d = true; g2.zoomToFit(400, 60); } });
}
function init3d() {
  g3 = ForceGraph3D()($('g3'))
    .backgroundColor('#000').nodeId('id').nodeVal(function (n) { return n.waga; }).nodeOpacity(0.95).nodeRelSize(5)
    .nodeColor(function (n) { return przyciemnij(n) ? '#222' : kolorWezla(n); })
    .nodeLabel(function (n) { return '<div style="font:12px monospace;color:#f0f0ec">' + esc(n.nazwa) + '<br><span style="color:#8a8a86">' + esc(n.opis) + '</span></div>'; })
    .linkColor(kolorKrawedzi).linkOpacity(0.55).linkWidth(function (l) { return 0.3 + Math.min(2, l.waga / 2); })
    .linkDirectionalArrowLength(3).linkDirectionalArrowRelPos(1)
    .linkDirectionalParticles(function (l) { return l.typ === 'zagraza' ? 2 : 0; }).linkDirectionalParticleColor(function () { return '#ff4d4d'; })
    .onNodeHover(function (n) { hover3d = n; if (!zaznaczony || !zaznaczony.klik) zaznacz(n); if (n) podswietlWiersz(n.id); })
    .onNodeClick(function (n) { n.klik = true; zaznacz(n); pokazKarte(n); })
    .onBackgroundClick(function () { zaznacz(null); pokazKarte(null); })
    .onEngineTick(tik3d);
  g3.renderer().domElement.addEventListener('pointerdown', function (ev) {
    start3d = { x: ev.clientX, y: ev.clientY };
    // obrót wokół środka grafu: lewy przycisk na tle (nie na kropce, którą da się przeciągać)
    if (ev.button === 0 && !hover3d) rozgladanie = { x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, ruch: false };
  });
  window.addEventListener('pointermove', function (ev) {
    if (!rozgladanie) return;
    if (!rozgladanie.ruch) { if (Math.hypot(ev.clientX - rozgladanie.x0, ev.clientY - rozgladanie.y0) < 4) return; rozgladanie.ruch = true; zapamietaj(true); }
    var dx = ev.clientX - rozgladanie.x, dy = ev.clientY - rozgladanie.y; rozgladanie.x = ev.clientX; rozgladanie.y = ev.clientY;
    obrocKamere(dx, dy);
  });
  window.addEventListener('pointerup', function () { rozgladanie = null; });
  // obracanie biblioteki krąży wokół celu kamery, nie wokół środka grafu — wyłączone, obraca kod wyżej
  g3.controls().noRotate = true;
  g3.renderer().domElement.addEventListener('click', kliknietoScene3d);
  // Kółko = przelot: kamera i jej cel jadą wzdłuż kierunku patrzenia o stały krok, w przód i w tył tak samo
  // (domyślny zoom sterowania zbliża się do celu coraz wolniej i w przód „grzęźnie”).
  g3.renderer().domElement.addEventListener('wheel', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    var kam = g3.camera(), ster = g3.controls(); if (!kam || !ster || !ster.target) return;
    var kier = ster.target.clone().sub(kam.position).normalize();
    var krok = (ev.deltaY < 0 ? 1 : -1) * Math.max(25, promienUkladu() * 0.08);
    kam.position.addScaledVector(kier, krok); ster.target.addScaledVector(kier, krok);
  }, { capture: true, passive: false });
}
// Najpierw pokazać kontener, dopiero potem inicjować scenę: inicjacja w ukrytym (zerowym) elemencie psuje sterowanie kamerą.
function przelacz(w) {
  konfig.widok = w; zapisz();
  $('g2').style.display = w === '2d' ? '' : 'none'; $('g3').style.display = w === '3d' ? '' : 'none';
  $('b2d').className = w === '2d' ? 'on' : ''; $('b3d').className = w === '3d' ? 'on' : '';
  if (w === '3d' && !g3) { init3d(); dopasuj(); if (graf) przerysuj(); }
  if (w === '2d' && !g2) { init2d(); dopasuj(); if (graf) przerysuj(); }
  dopasuj(); rysujGizmo();
}
function dopasuj() {
  var el = $('scena'), sz = el.clientWidth, wy = el.clientHeight;
  if (g2) g2.width(sz).height(wy);
  if (g3) { g3.width(sz).height(wy); var c = g3.controls(); if (c && c.handleResize) c.handleResize(); }
}

// --- panel -------------------------------------------------------------------
function rysujPanel() {
  if (!graf) return;
  var liczby = {}; dane.nodes.forEach(function (n) { liczby[n.warstwa] = (liczby[n.warstwa] || 0) + 1; });
  $('warstwy').innerHTML = graf.warstwy.map(function (w) {
    return '<label class="w"><input type="checkbox" data-w="' + w + '"' + (konfig.warstwy[w] !== false ? ' checked' : '') + '><i style="background:' + KOLOR_WARSTWY[w] + '"></i>' + NAZWA_WARSTWY[w] + ' <span style="color:#8a8a86">' + (liczby[w] || 0) + '</span><button type="button" data-obszar2d="' + w + '"' + (obszar === w ? ' class="on"' : '') + '>2D</button></label>';
  }).join('');
  var lk = {}; dane.links.forEach(function (l) { lk[l.typ] = (lk[l.typ] || 0) + 1; });
  $('typy').innerHTML = graf.typy.map(function (t) {
    return '<label class="k"><input type="checkbox" data-t="' + t + '"' + (konfig.krawedzie[t] !== false ? ' checked' : '') + '><i style="border-color:' + KOLOR_TYPU[t] + '"></i>' + NAZWA_TYPU[t] + ' <span style="color:#8a8a86">' + (lk[t] || 0) + '</span></label>';
  }).join('');
  var ryz = dane.nodes.filter(function (n) { return n.warstwa === 'ryzyka'; }), wys = ryz.filter(function (n) { return n.poziom === 'wysokie'; }).length;
  $('stat').innerHTML = '<span>węzły <b>' + dane.nodes.length + '</b></span><span>zależności <b>' + dane.links.length + '</b></span><span>ryzyka <b style="color:' + (wys ? '#ff4d4d' : '#7bd88f') + '">' + wys + ' wysokie</b> / ' + ryz.length + '</span>';
  $('meta').textContent = 'skan ' + new Date(graf.czas).toLocaleString('pl-PL') + ' · /dostepy = nowy skan';
  $('bEtyk').className = konfig.etykiety ? 'on' : ''; $('bObsz').className = konfig.obszary3d ? 'on' : ''; $('grup').value = konfig.grupowanie;
  $('odp').value = konfig.fizyka.odpychanie; $('dl').value = konfig.fizyka.dlugosc; $('odw').value = konfig.rozsuniecie || 1;
  $('vOdp').textContent = konfig.fizyka.odpychanie; $('vDl').textContent = konfig.fizyka.dlugosc; $('vOdw').textContent = '×' + (konfig.rozsuniecie || 1).toFixed(1);
  $('bZamroz').className = konfig.zamrozony ? 'on' : ''; $('bZamroz').textContent = konfig.zamrozony ? 'układ zamrożony' : 'zamroź układ';
  rysujSciage();
}

document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.id !== 'odw' && t.id !== 'szukaj') zapamietaj(true);
  if (t.dataset.w) { konfig.warstwy[t.dataset.w] = t.checked; }
  else if (t.dataset.t) { konfig.krawedzie[t.dataset.t] = t.checked; }
  else if (t.id === 'grup') { konfig.grupowanie = t.value; obszar = null; }
  else if (t.id === 'odp') { konfig.fizyka.odpychanie = +t.value; }
  else if (t.id === 'dl') { konfig.fizyka.dlugosc = +t.value; }
  else if (t.id === 'odw') { zapisz(); return; }
  else return;
  zapisz(); przerysuj();
});
document.addEventListener('click', function (e) {
  var b = e.target.closest ? e.target.closest('[data-obszar2d]') : null;
  if (!b) return;
  e.preventDefault();
  var w = b.dataset.obszar2d;
  if (konfig.grupowanie !== 'warstwa') { konfig.grupowanie = 'warstwa'; zapisz(); }   // przyciski „2D” przy warstwach = obszary kategorii
  ustawObszar(obszar === w ? null : w); przelacz('2d');
});
document.addEventListener('input', function (e) {
  var t = e.target; if (t.type !== 'range') return;
  if (t.id === 'odw') { zapamietaj(false); konfig.rozsuniecie = Math.max(1, +t.value); odswiezOdstep(); return; }
  $('v' + t.id.charAt(0).toUpperCase() + t.id.slice(1)).textContent = t.value;
});
$('bZamroz').onclick = function () { zapamietaj(true); zamroz(!konfig.zamrozony); };
$('b2d').onclick = function () { przelacz('2d'); }; $('b3d').onclick = function () { przelacz('3d'); };
$('bEtyk').onclick = function () { konfig.etykiety = !konfig.etykiety; zapisz(); przerysuj(); };
$('bObsz').onclick = function () { konfig.obszary3d = !konfig.obszary3d; zapisz(); przerysuj(); };
$('bCalosc').onclick = function () { ustawObszar(null); };
$('bPotwierdz').onclick = potwierdzObszar; $('bAnuluj').onclick = function () { proponujObszar(null); };
$('bZamknij').onclick = function () { zaznacz(null); pokazKarte(null); };
$('bReset').onclick = function () { try { localStorage.removeItem('md-konfig'); } catch (e) {} wczytajKonfig(baza); obszar = null; przerysuj(); przelacz(konfig.widok); };
$('bKopiuj').onclick = function () { var s = JSON.stringify(konfig, null, 2); if (navigator.clipboard) navigator.clipboard.writeText(s); $('stan').textContent = 'konfiguracja skopiowana do schowka'; };
window.addEventListener('resize', dopasuj);

function pobierz() {
  fetch('graf.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (g) {
    if (!graf || g.czas !== graf.czas) { scal(g); $('stan').textContent = 'dane z ' + new Date(g.czas).toLocaleTimeString('pl-PL'); }
  }).catch(function () { $('stan').textContent = 'brak połączenia z serwerem monitora — uruchom /dostepy'; });
}
fetch('konfig.json?t=' + Date.now()).then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (k) {
  baza = k; wczytajKonfig(k);
  fetch('graf.json?t=' + Date.now()).then(function (r) { return r.json(); }).then(function (g) {
    graf = g; przelacz(konfig.widok); scal(g);
    if (konfig.zamrozony) { konfig.zamrozony = false; setTimeout(function () { zamroz(true); }, 5000); }   // zdjęcie po ułożeniu
    setInterval(pobierz, Math.max(5, konfig.odswiezanieSek || 15) * 1000);
  });
});
</script></body></html>`
