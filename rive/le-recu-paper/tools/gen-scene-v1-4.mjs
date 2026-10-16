// Generates scene.rml for "The Paper Remembers" from one authored place so the two
// explored directions share exactly the same view-model contract and state machine.
//
//   node tools/gen-scene.mjs <fiber|press> <outDir> [--backdrop]
//
// The shipped scene is generated WITHOUT a backdrop (transparent, layered over the
// HTML paper). --backdrop adds an ivory plate used only for CLI screenshots.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const direction = process.argv[2] ?? 'fiber'
const outDir = process.argv[3] ?? '.'
const backdrop = process.argv.includes('--backdrop')
if (!['fiber', 'press'].includes(direction)) throw new Error('direction must be fiber|press')

// ---- palette (matches src/styles.css Paper Under Pressure) -----------------
const INK = '1C1612'
const RED = 'A32018'
const IVORY = 'F3ECDF'
const c = (a, hex) => a.toString(16).toUpperCase().padStart(2, '0') + hex

// ---- id allocation -----------------------------------------------------------
let seq = 100
const nid = () => `0:${seq++}`

// ---- fixed contract ids ------------------------------------------------------
const AB = '0:2', AB_STYLE = '0:5', SM = '0:7', LAYER = '0:8'
const VM = '0:40', VM_INST = '0:41'
const P_PHASE = '0:42', P_OUTCOME = '0:43', P_PROX = '0:44', P_KEPT = '0:45'
const CONV_BRISTLE = '0:60', CONV_GHOST = '0:61'
const W = 360, H = 240, CX = 180, CY = 120

// phase codes -- keep in sync with src/lib/rive-paper-contract.ts
export const PHASE = { idle: 0, ink: 1, pending: 2, sealed: 3, waiting: 4, reveal: 5, failed: 6, unavailable: 7 }
export const OUTCOME = { none: 0, same: 1, different: 2 }

// ---- tiny RML builders -------------------------------------------------------
const f = (n) => Number(n.toFixed(3))
const objs = {} // name -> id, for animations

function named(name) { const id = nid(); objs[name] = id; return id }

function ring(name, r, thick, color, extra = '') {
  return `<Shape name="${name}"><Ellipse width="${r * 2}" height="${r * 2}" originX="0.5" originY="0.5" name="Path"/>` +
    `<Stroke thickness="${thick}" ${extra} name="Stroke"><SolidColor colorValue="${color}" name="C"/></Stroke></Shape>`
}

// deterministic PRNG so the paper is identical on every build
let rs = 0x1f2e3d4c
const rnd = () => ((rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0) / 4294967296)

// ---- art ---------------------------------------------------------------------
function paperTexture() {
  if (direction === 'fiber') {
    // ivory fibres: short hair-thin rotated bars, mostly horizontal grain
    const parts = []
    for (let i = 0; i < 70; i++) {
      const len = 14 + rnd() * 46, x = rnd() * W, y = rnd() * H
      const rot = (rnd() - 0.5) * 1.2 + (rnd() < 0.2 ? 1.2 : 0)
      const a = Math.floor(14 + rnd() * 30)
      const tone = rnd() < 0.5 ? '6B4E2E' : INK
      parts.push(`<Shape x="${f(x)}" y="${f(y)}" rotation="${f(rot)}" name="Fibre ${i}"><Rectangle width="${f(len)}" height="${f(0.6 + rnd() * 0.7)}" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(a, tone)}" name="C"/></Fill></Shape>`)
    }
    return parts.join('\n            ')
  }
  // press: topographic pressure contours -- the page as a pressure map
  const parts = []
  for (let i = 0; i < 9; i++) {
    const r = 26 + i * 15
    parts.push(`<Shape x="${CX}" y="${CY}" scaleX="${f(1 + (i % 3) * 0.04)}" scaleY="${f(0.78 + (i % 2) * 0.05)}" rotation="${f(i * 0.17)}" name="Contour ${i}"><Ellipse width="${r * 2}" height="${r * 2}" originX="0.5" originY="0.5" name="P"/><Stroke thickness="0.7" name="S"><SolidColor colorValue="${c(26 - i, INK)}" name="C"/><DashPath name="D"><Dash length="${6 + i * 2}" name="on"/><Dash length="${3 + i}" name="off"/></DashPath></Stroke></Shape>`)
  }
  return parts.join('\n            ')
}

function inkRig() {
  // returns RML for the cross-out: ghost guide, wet bloom, ink line, sheen and brush
  const pts = direction === 'fiber'
    ? [[-132, 6], [-64, -5], [8, 4], [78, -4], [132, 3]]
    : [[-132, 0], [-60, 0], [10, 0], [80, 0], [132, 0]]
  const verts = pts.map(([x, y]) => `<StraightVertex x="${x}" y="${y}" radius="${direction === 'fiber' ? 14 : 0}"/>`).join('')
  const path = (n) => `<PointsPath isClosed="false" name="${n}">${verts}</PointsPath>`
  const thick = direction === 'fiber' ? 7 : 15
  const cap = direction === 'fiber' ? 'round' : 'butt'
  const trimBloom = named('trimBloom'), trimInk = named('trimInk'), trimSheen = named('trimSheen')
  const bloomFeather = named('bloomFeather')
  // brush head: a fan of fine bristles hanging from the tip, bending with finger proximity
  const bristles = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16 - 0.5
    return `<Shape x="${f(t * 15)}" y="0" rotation="${f(t * 0.95 + (rnd() - 0.5) * 0.08)}" name="Bristle ${i}"><Rectangle width="${f(0.7 + rnd() * 0.7)}" height="${f(15 + rnd() * 11)}" originX="0.5" originY="0" name="P"/><Fill name="F"><SolidColor colorValue="${c(Math.floor(70 + rnd() * 90), INK)}" name="C"/></Fill></Shape>`
  }).join('')
  return `
        <Node x="${CX}" y="${CY}" name="InkRig" id="${named('inkRig')}">
            <Node name="BristleHead" id="${named('head')}" x="-132" y="6" opacity="0">
                <Node name="BristleBind" id="${named('bristleBind')}">
                    <DataBindContext sourcePathIds="${VM}-${P_PROX}" propertyKey="15" converterId="${CONV_BRISTLE}"/>
                    <Node name="BristleSway" id="${named('bristleSway')}" rotation="0">${bristles}</Node>
                </Node>
            </Node>
            <Shape name="DryStreaks" id="${named('streaks')}" y="1.6" opacity="1">
                ${path('P1')}
                <Stroke thickness="1.1" cap="round" join="round" name="S1"><SolidColor colorValue="${c(direction === 'fiber' ? 120 : 0, IVORY)}" name="C"/><TrimPath start="0" end="0" id="${named('trimStreakA')}" name="Trim"/></Stroke>
            </Shape>
            <Shape name="Ink" id="${named('ink')}">
                ${path('Path')}
                <Stroke thickness="${thick}" cap="${cap}" join="round" name="Ink">
                    <SolidColor colorValue="${c(255, INK)}" name="C"/>
                    <TrimPath start="0" end="0" id="${trimInk}" name="Trim"/>
                </Stroke>
            </Shape>
            <Shape name="Sheen" id="${named('sheen')}" y="-2" opacity="0">
                ${path('Path')}
                <Stroke thickness="2" cap="round" join="round" name="Sheen">
                    <SolidColor colorValue="${c(150, 'FFFFFF')}" name="C"/>
                    <TrimPath start="0" end="0" id="${trimSheen}" name="Trim"/>
                </Stroke>
            </Shape>
            <Shape name="Bloom" id="${named('bloom')}" opacity="0">
                ${path('Path')}
                <Stroke thickness="${thick + 9}" cap="round" join="round" name="Bloom">
                    <SolidColor colorValue="${c(120, INK)}" name="C"/>
                    <Feather strength="8" id="${bloomFeather}" name="Feather"/>
                    <TrimPath start="0" end="0" id="${trimBloom}" name="Trim"/>
                </Stroke>
            </Shape>
            <Shape name="GhostGuide" id="${named('ghost')}" opacity="0">
                <DataBindContext sourcePathIds="${VM}-${P_PROX}" propertyKey="18" converterId="${CONV_GHOST}"/>
                ${path('Path')}
                <Stroke thickness="${direction === 'fiber' ? 3 : 9}" cap="${cap}" join="round" name="Guide">
                    <SolidColor colorValue="${c(255, INK)}" name="C"/>
                    <DashPath name="D"><Dash length="9" name="on"/><Dash length="7" name="off"/></DashPath>
                </Stroke>
            </Shape>
        </Node>`
}

function sealShape(prefix) {
  if (direction === 'fiber') {
    // physical double-ring wax-less ink seal
    const feather = named(prefix + 'Feather')
    return `
            <Shape name="Wash" id="${named(prefix + 'Wash')}"><Ellipse width="86" height="86" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(22, RED)}" name="C"/></Fill></Shape>
            <Shape name="OuterRing" id="${named(prefix + 'Outer')}"><Ellipse width="92" height="92" originX="0.5" originY="0.5" name="P"/><Stroke thickness="3.4" name="S"><SolidColor colorValue="${c(255, RED)}" name="C"/><Feather strength="0" id="${feather}" name="Feather"/></Stroke></Shape>
            <Shape name="InnerRing" id="${named(prefix + 'Inner')}"><Ellipse width="74" height="74" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.3" name="S"><SolidColor colorValue="${c(255, RED)}" name="C"/></Stroke></Shape>
            <Shape name="Ticks" id="${named(prefix + 'Ticks')}"><Ellipse width="83" height="83" originX="0.5" originY="0.5" name="P"/><Stroke thickness="5" name="S"><SolidColor colorValue="${c(170, RED)}" name="C"/><DashPath name="D"><Dash length="1.6" name="on"/><Dash length="5.2" name="off"/></DashPath></Stroke></Shape>
            <Shape name="Core" id="${named(prefix + 'Core')}"><Ellipse width="7" height="7" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(255, RED)}" name="C"/></Fill></Shape>`
  }
  // press: solid disc with knocked-out rings (even-odd)
  const feather = named(prefix + 'Feather')
  return `
            <Shape name="Disc" id="${named(prefix + 'Outer')}">
                <Ellipse width="96" height="96" originX="0.5" originY="0.5" name="P"/>
                <Ellipse width="76" height="76" originX="0.5" originY="0.5" name="Hole1"/>
                <Ellipse width="62" height="62" originX="0.5" originY="0.5" name="Hole2"/>
                <Fill fillRule="evenOdd" name="F"><SolidColor colorValue="${c(255, RED)}" name="C"/></Fill>
            </Shape>
            <Shape name="Plug" id="${named(prefix + 'Inner')}"><Ellipse width="40" height="40" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(255, RED)}" name="C"/></Fill><Stroke thickness="0" name="S"><SolidColor colorValue="${c(0, RED)}" name="C"/><Feather strength="0" id="${feather}" name="Feather"/></Stroke></Shape>
            <Shape name="Wash" id="${named(prefix + 'Wash')}"><Ellipse width="96" height="96" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(0, RED)}" name="C"/></Fill></Shape>
            <Shape name="Ticks" id="${named(prefix + 'Ticks')}" opacity="0"><Ellipse width="69" height="69" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1" name="S"><SolidColor colorValue="${c(0, RED)}" name="C"/></Stroke></Shape>
            <Shape name="Core" id="${named(prefix + 'Core')}" opacity="0"><Ellipse width="2" height="2" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(0, RED)}" name="C"/></Fill></Shape>`
}

function secondImpression() {
  // the *second* print: ink-black double ring, multiplied onto the first
  const blend = direction === 'press' ? 'blendModeValue="multiply"' : ''
  const body = direction === 'fiber'
    ? `<Shape name="B1" id="${named('dxOuter')}"><Ellipse width="92" height="92" originX="0.5" originY="0.5" name="P"/><Stroke thickness="3.4" ${blend} name="S"><SolidColor colorValue="${c(235, INK)}" name="C"/></Stroke></Shape>
                <Shape name="B2" id="${named('dxInner')}"><Ellipse width="74" height="74" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.3" name="S"><SolidColor colorValue="${c(235, INK)}" name="C"/></Stroke></Shape>`
    : `<Shape name="B1" id="${named('dxOuter')}"><Ellipse width="96" height="96" originX="0.5" originY="0.5" name="P"/><Ellipse width="76" height="76" originX="0.5" originY="0.5" name="H"/><Fill fillRule="evenOdd" ${blend} name="F"><SolidColor colorValue="${c(235, INK)}" name="C"/></Fill></Shape>
                <Shape name="B2" id="${named('dxInner')}"><Ellipse width="46" height="46" originX="0.5" originY="0.5" name="P"/><Fill ${blend} name="F"><SolidColor colorValue="${c(120, INK)}" name="C"/></Fill></Shape>`
  return body
}

// ---- assemble artboard -------------------------------------------------------
const trimLink = named('trimLink')
const art = `
    <Artboard defaultStateMachineId="${SM}" viewModelId="${VM}" viewModelInstanceId="${VM_INST}" clip="true" width="${W}" height="${H}" styleId="${AB_STYLE}" name="PaperStage" id="${AB}">
        ${backdrop ? `<Fill name="Backdrop"><SolidColor colorValue="${c(255, IVORY)}" name="Ivory"/></Fill>` : ''}
        <LayoutComponentStyle name="Artboard Style" id="${AB_STYLE}"/>
        <Node name="Root" id="${named('root')}">
        <!-- second impression + registration marks (revealed only on a verified complete duel) -->
        <Node x="${CX}" y="${CY}" name="Duplex" id="${named('duplex')}" opacity="0">
            <Node name="Second" id="${named('second')}" x="0" y="0" opacity="0">
                ${secondImpression()}
            </Node>
            <Shape name="RegH" id="${named('regH')}" opacity="0"><PointsPath isClosed="false" name="P"><StraightVertex x="-64" y="0"/><StraightVertex x="64" y="0"/></PointsPath><Stroke thickness="0.8" name="S"><SolidColor colorValue="${c(200, INK)}" name="C"/></Stroke></Shape>
            <Shape name="RegV" id="${named('regV')}" opacity="0"><PointsPath isClosed="false" name="P"><StraightVertex x="0" y="-64"/><StraightVertex x="0" y="64"/></PointsPath><Stroke thickness="0.8" name="S"><SolidColor colorValue="${c(200, INK)}" name="C"/></Stroke></Shape>
            <Shape name="Tension" id="${named('tension')}" opacity="0"><PointsPath isClosed="false" name="P"><StraightVertex x="-26" y="0"/><StraightVertex x="58" y="-8"/></PointsPath><Stroke thickness="1" name="S"><SolidColor colorValue="${c(210, INK)}" name="C"/><DashPath name="D"><Dash length="3" name="on"/><Dash length="4" name="off"/></DashPath></Stroke></Shape>
        </Node>
        <!-- first impression: the confirmed seal -->
        <Node x="${CX}" y="${CY}" rotation="-0.14" opacity="0" name="Seal" id="${named('seal')}">
            ${sealShape('s')}
        </Node>
        <!-- the empty slot where a second impression would land (waiting) -->
        <Shape x="${CX}" y="${CY}" opacity="0" name="Slot" id="${named('slot')}"><Ellipse width="108" height="108" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1" name="S"><SolidColor colorValue="${c(150, INK)}" name="C"/><DashPath name="D"><Dash length="2" name="on"/><Dash length="6" name="off"/></DashPath></Stroke></Shape>
        <!-- pressure waves -->
        <Shape x="${CX}" y="${CY}" opacity="0" scaleX="0.4" scaleY="0.4" name="Shock1" id="${named('shock1')}"><Ellipse width="120" height="120" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.6" name="S"><SolidColor colorValue="${c(150, INK)}" name="C"/></Stroke></Shape>
        <Shape x="${CX}" y="${CY}" opacity="0" scaleX="0.4" scaleY="0.4" name="Shock2" id="${named('shock2')}"><Ellipse width="120" height="120" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1" name="S"><SolidColor colorValue="${c(110, INK)}" name="C"/></Stroke></Shape>
        <!-- failure: the paper reopens -->
        <Shape x="${CX}" y="${CY}" opacity="0" name="Slit" id="${named('slit')}"><PointsPath isClosed="false" name="P"><StraightVertex x="-3" y="-72"/><StraightVertex x="4" y="-26"/><StraightVertex x="-4" y="22"/><StraightVertex x="2" y="74"/></PointsPath><Stroke thickness="1.4" cap="round" join="round" name="S"><SolidColor colorValue="${c(220, INK)}" name="C"/><TrimPath start="0" end="0" id="${trimLink}" name="Trim"/></Stroke></Shape>
        ${inkRig()}
        <!-- pending: ambiguous, neither sealed nor refused -->
        <Shape x="${CX}" y="${CY}" opacity="0" name="Pending" id="${named('pendingRing')}"><Ellipse width="100" height="100" originX="0.5" originY="0.5" name="P"/><Stroke thickness="2" name="S"><SolidColor colorValue="${c(170, INK)}" name="C"/><DashPath name="D"><Dash length="4" name="on"/><Dash length="9" name="off"/></DashPath></Stroke></Shape>
        <!-- paper dent: compression under pressure -->
        <Shape x="${CX}" y="${CY}" opacity="0" name="Dent" id="${named('dent')}"><Ellipse width="190" height="150" originX="0.5" originY="0.5" name="P"/><Fill fillRule="clockwise" name="F"><SolidColor colorValue="${c(80, INK)}" name="C"/><Feather strength="34" name="Feather"/></Fill></Shape>
        ${paperTexture()}
        </Node>
@@INSIDE@@    </Artboard>`

// ---- animations ----------------------------------------------------------------
// frames @60fps. tracks: [objName, property, [[frame, value, interp?], ...]]
function kf(frame, value, interp = 'cubic') {
  return `<KeyFrameDouble value="${f(value)}" interpolationType="${interp}"${frame ? ` frame="${frame}"` : ''}/>`
}
function anim(name, id, duration, loop, tracks) {
  const byObj = new Map()
  const last = new Map()
  for (const t of tracks) last.set(t[0] + '.' + t[1], t)
  for (const [o, p, ks] of last.values()) {
    const oid = objs[o]
    if (!oid) throw new Error(`unknown animated object ${o} in ${name}`)
    if (!byObj.has(oid)) byObj.set(oid, [])
    byObj.get(oid).push(`<KeyedProperty property="${p}">${ks.map((k) => kf(...k)).join('')}</KeyedProperty>`)
  }
  const body = [...byObj].map(([oid, props]) => `<KeyedObject objectId="${oid}">${props.join('')}</KeyedObject>`).join('\n            ')
  return `
        <LinearAnimation loopValue="${loop}" duration="${duration}" name="${name}" id="${id}">
            ${body}
        </LinearAnimation>`
}

// every state re-asserts the resting values it depends on, so a state can be entered
// cold (page reload into "waiting") and still show the truthful picture.
const inkDone = [['inkRig', 'opacity', [[0, 1]]], ['trimStreakA', 'end', [[0, 1]]], ['trimInk', 'end', [[0, 1]]], ['trimBloom', 'end', [[0, 1]]], ['trimSheen', 'end', [[0, 1]]], ['sheen', 'opacity', [[0, 0]]], ['bloom', 'opacity', [[0, 0.28]]], ['head', 'opacity', [[0, 0]]], ['ghost', 'opacity', [[0, 0]]]]
const inkBlank = [['inkRig', 'opacity', [[0, 1]]], ['trimStreakA', 'end', [[0, 0]]], ['trimInk', 'end', [[0, 0]]], ['trimBloom', 'end', [[0, 0]]], ['trimSheen', 'end', [[0, 0]]], ['sheen', 'opacity', [[0, 0]]], ['bloom', 'opacity', [[0, 0]]], ['head', 'opacity', [[0, 1]]], ['head', 'x', [[0, -132]]], ['head', 'y', [[0, 6]]]]
const sealGone = [['seal', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]], ['duplex', 'opacity', [[0, 0]]], ['second', 'opacity', [[0, 0]]], ['pendingRing', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]]]
const sealHeld = [['seal', 'opacity', [[0, 1]]], ['seal', 'scaleX', [[0, 1]]], ['seal', 'scaleY', [[0, 1]]], ['seal', 'x', [[0, CX]]], ['pendingRing', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]]]
const dentOff = [['dent', 'opacity', [[0, 0]]]]

const A = {}
A.idle = anim('idle', '0:20', 240, 'loop', [
  ...inkBlank, ...sealGone,
  ['head', 'opacity', [[0, 1]]],
  ['bristleSway', 'rotation', [[0, -0.03, 'cubic'], [120, 0.03, 'cubic'], [240, -0.03, 'cubic']]],
  ['dent', 'opacity', [[0, 0.04], [120, 0.1], [240, 0.04]]],
  ['seal', 'x', [[0, CX]]], ['seal', 'scaleX', [[0, 1]]], ['seal', 'scaleY', [[0, 1]]],
  ['shock1', 'opacity', [[0, 0]]], ['shock2', 'opacity', [[0, 0]]],
  ['trimLink', 'end', [[0, 0]]], ['second', 'x', [[0, 0]]], ['second', 'y', [[0, 0]]],
  ['regH', 'opacity', [[0, 0]]], ['regV', 'opacity', [[0, 0]]], ['tension', 'opacity', [[0, 0]]],
  ['root', 'opacity', [[0, 1]]],
])
A.ink = anim('ink', '0:21', 66, 'oneShot', [
  ...sealGone,
  ['bristleSway', 'rotation', [[0, 0, 'cubic'], [34, -0.22, 'cubic']]],
  ['head', 'opacity', [[0, 1], [48, 1, 'linear'], [66, 0, 'linear']]],
  ['head', 'x', [[0, -132, 'cubic'], [34, 132, 'cubic']]],
  ['head', 'y', [[0, 6], [8, -5], [17, 4], [26, -4], [34, 3]]],
  ['trimInk', 'end', [[0, 0, 'cubic'], [34, 1, 'cubic']]],
  ['trimStreakA', 'end', [[0, 0, 'cubic'], [34, 0.98, 'cubic']]],
  ['trimSheen', 'end', [[0, 0, 'cubic'], [34, 1, 'cubic']]],
  ['trimBloom', 'end', [[0, 0, 'cubic'], [34, 1, 'cubic']]],
  ['sheen', 'opacity', [[0, 0, 'linear'], [10, 1, 'linear'], [66, 0, 'cubic']]],
  ['bloom', 'opacity', [[0, 0, 'linear'], [14, 0.55, 'linear'], [66, 0.28, 'cubic']]],
  ['bloomFeather', 'strength', [[0, 5, 'linear'], [66, 1.5, 'cubic']]],
  ['dent', 'opacity', [[0, 0.1], [20, 0.14], [66, 0.04]]],
])
A.pending = anim('pending', '0:22', 240, 'loop', [
  ...inkDone, ['seal', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]], ['duplex', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]],
  ['pendingRing', 'opacity', [[0, 0, 'cubic'], [20, 0.9, 'cubic']]],
  ['pendingRing', 'rotation', [[0, 0, 'linear'], [240, 6.2832, 'linear']]],
  ['dent', 'opacity', [[0, 0.1], [60, 0.22, 'cubic'], [120, 0.1, 'cubic'], [180, 0.22, 'cubic'], [240, 0.1, 'cubic']]],
])
A.sealed = anim('sealed', '0:23', 70, 'oneShot', [
  ...inkDone, ['duplex', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]],
  ['pendingRing', 'opacity', [[0, 0.5, 'cubic'], [6, 0, 'cubic']]],
  ['seal', 'opacity', [[0, 0, 'linear'], [4, 1, 'linear']]],
  ['seal', 'scaleX', [[0, 1.6, 'cubic'], [9, 0.93, 'cubic'], [18, 1.0, 'cubic']]],
  ['seal', 'scaleY', [[0, 1.6, 'cubic'], [9, 0.93, 'cubic'], [18, 1.0, 'cubic']]],
  ['seal', 'rotation', [[0, 0.3, 'cubic'], [14, -0.14, 'cubic']]],
  ['sFeather', 'strength', [[0, 9, 'cubic'], [26, 0, 'cubic']]],
  ['shock1', 'opacity', [[0, 0, 'linear'], [4, 0.8, 'linear'], [44, 0, 'cubic']]],
  ['shock1', 'scaleX', [[0, 0.4, 'cubic'], [44, 3.6, 'cubic']]],
  ['shock1', 'scaleY', [[0, 0.4, 'cubic'], [44, 3.6, 'cubic']]],
  ['shock2', 'opacity', [[0, 0, 'linear'], [10, 0.6, 'linear'], [56, 0, 'cubic']]],
  ['shock2', 'scaleX', [[0, 0.4, 'linear'], [10, 0.5, 'cubic'], [56, 3.9, 'cubic']]],
  ['shock2', 'scaleY', [[0, 0.4, 'linear'], [10, 0.5, 'cubic'], [56, 3.9, 'cubic']]],
  ['dent', 'opacity', [[0, 0.1], [5, 0.42, 'cubic'], [40, 0.07, 'cubic']]],
  ['dent', 'scaleX', [[0, 1.0], [5, 1.18, 'cubic'], [40, 1.0, 'cubic']]],
  ['dent', 'scaleY', [[0, 1.0], [5, 1.18, 'cubic'], [40, 1.0, 'cubic']]],
])
A.waiting = anim('waiting', '0:24', 360, 'loop', [
  ...inkDone, ...sealHeld.slice(0, 4), ['duplex', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]], ['pendingRing', 'opacity', [[0, 0]]],
  ['seal', 'rotation', [[0, -0.14]]],
  ['sFeather', 'strength', [[0, 0]]],
  ['slot', 'opacity', [[0, 0.1, 'cubic'], [180, 0.42, 'cubic'], [360, 0.1, 'cubic']]],
  ['slot', 'rotation', [[0, 0, 'linear'], [360, 6.2832, 'linear']]],
  ['seal', 'scaleX', [[0, 1, 'cubic'], [180, 1.012, 'cubic'], [360, 1, 'cubic']]],
  ['seal', 'scaleY', [[0, 1, 'cubic'], [180, 1.012, 'cubic'], [360, 1, 'cubic']]],
  ['dent', 'opacity', [[0, 0.07]]],
])
const revealCommon = [
  ...inkDone, ['slot', 'opacity', [[0, 0.3, 'cubic'], [20, 0, 'cubic']]], ['pendingRing', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]],
  ['seal', 'opacity', [[0, 1]]], ['seal', 'rotation', [[0, -0.14]]], ['sFeather', 'strength', [[0, 0]]],
  ['duplex', 'opacity', [[0, 0, 'linear'], [3, 1, 'linear']]],
  ['second', 'opacity', [[0, 0, 'linear'], [5, 1, 'linear']]],
  ['shock1', 'opacity', [[0, 0, 'linear'], [10, 0.7, 'linear'], [52, 0, 'cubic']]],
  ['shock1', 'scaleX', [[0, 0.4], [10, 0.5, 'cubic'], [52, 3.4, 'cubic']]],
  ['shock1', 'scaleY', [[0, 0.4], [10, 0.5, 'cubic'], [52, 3.4, 'cubic']]],
  ['dent', 'opacity', [[0, 0.07], [12, 0.38, 'cubic'], [60, 0.06, 'cubic']]],
]
A.revealSame = anim('revealSame', '0:25', 110, 'oneShot', [
  ...revealCommon,
  ['seal', 'x', [[0, CX]]],
  ['second', 'x', [[0, 74, 'cubic'], [26, 0, 'cubic']]],
  ['second', 'y', [[0, -14, 'cubic'], [26, 0, 'cubic']]],
  ['second', 'rotation', [[0, 0.28, 'cubic'], [26, 0, 'cubic']]],
  ['second', 'scaleX', [[0, 1.5, 'cubic'], [18, 0.96, 'cubic'], [30, 1, 'cubic']]],
  ['second', 'scaleY', [[0, 1.5, 'cubic'], [18, 0.96, 'cubic'], [30, 1, 'cubic']]],
  ['regH', 'opacity', [[0, 0, 'linear'], [30, 0, 'linear'], [52, 1, 'cubic']]],
  ['regV', 'opacity', [[0, 0, 'linear'], [30, 0, 'linear'], [52, 1, 'cubic']]],
  ['tension', 'opacity', [[0, 0]]],
])
A.revealDifferent = anim('revealDifferent', '0:26', 110, 'oneShot', [
  ...revealCommon,
  ['seal', 'x', [[0, CX, 'cubic'], [44, CX - 28, 'cubic']]],
  ['second', 'x', [[0, 74, 'cubic'], [26, 56, 'cubic'], [60, 58, 'cubic']]],
  ['second', 'y', [[0, -14, 'cubic'], [26, -8, 'cubic']]],
  ['second', 'rotation', [[0, 0.28, 'cubic'], [30, 0.12, 'cubic']]],
  ['second', 'scaleX', [[0, 1.5, 'cubic'], [18, 0.96, 'cubic'], [30, 1, 'cubic']]],
  ['second', 'scaleY', [[0, 1.5, 'cubic'], [18, 0.96, 'cubic'], [30, 1, 'cubic']]],
  ['tension', 'opacity', [[0, 0, 'linear'], [40, 0, 'linear'], [66, 1, 'cubic']]],
  ['regH', 'opacity', [[0, 0]]], ['regV', 'opacity', [[0, 0]]],
])
A.failedKept = anim('failedKept', '0:27', 90, 'oneShot', [
  ...inkDone, ['duplex', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]],
  ['seal', 'opacity', [[0, 0]]],
  ['pendingRing', 'opacity', [[0, 0.8, 'cubic'], [14, 0, 'cubic']]],
  ['slit', 'opacity', [[0, 0, 'linear'], [4, 1, 'linear'], [60, 0.8, 'linear'], [90, 0, 'cubic']]],
  ['trimLink', 'end', [[0, 0, 'cubic'], [22, 1, 'cubic']]],
  ['dent', 'opacity', [[0, 0.24, 'cubic'], [50, 0, 'cubic']]],
])
A.failedReleased = anim('failedReleased', '0:29', 90, 'oneShot', [
  ...inkDone, ['duplex', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]],
  ['seal', 'opacity', [[0, 0]]],
  ['pendingRing', 'opacity', [[0, 0.8, 'cubic'], [14, 0, 'cubic']]],
  ['slit', 'opacity', [[0, 0, 'linear'], [4, 1, 'linear'], [60, 0.8, 'linear'], [90, 0, 'cubic']]],
  ['trimLink', 'end', [[0, 0, 'cubic'], [22, 1, 'cubic']]],
  ['inkRig', 'opacity', [[0, 1, 'cubic'], [48, 0, 'cubic']]],
  ['dent', 'opacity', [[0, 0.24, 'cubic'], [50, 0, 'cubic']]],
])
A.unavailable = anim('unavailable', '0:28', 40, 'oneShot', [
  ...inkDone, ['duplex', 'opacity', [[0, 0]]], ['slot', 'opacity', [[0, 0]]], ['pendingRing', 'opacity', [[0, 0]]], ['slit', 'opacity', [[0, 0]]],
  ['seal', 'opacity', [[0, 0]]],
  ['root', 'opacity', [[0, 1, 'cubic'], [30, 0.35, 'cubic']]],
  ['dent', 'opacity', [[0, 0]]],
])

// ---- state machine -------------------------------------------------------------
const states = [
  ['idle', '0:20', [[P_PHASE, PHASE.idle]]],
  ['ink', '0:21', [[P_PHASE, PHASE.ink]]],
  ['pending', '0:22', [[P_PHASE, PHASE.pending]]],
  ['sealed', '0:23', [[P_PHASE, PHASE.sealed]]],
  ['waiting', '0:24', [[P_PHASE, PHASE.waiting]]],
  ['revealSame', '0:25', [[P_PHASE, PHASE.reveal], [P_OUTCOME, OUTCOME.same]]],
  ['revealDifferent', '0:26', [[P_PHASE, PHASE.reveal], [P_OUTCOME, OUTCOME.different]]],
  ['failedKept', '0:27', [[P_PHASE, PHASE.failed], [P_KEPT, 1]]],
  ['failedReleased', '0:29', [[P_PHASE, PHASE.failed], [P_KEPT, 0]]],
  ['unavailable', '0:28', [[P_PHASE, PHASE.unavailable]]],
]
const stateId = (i) => `0:${70 + i}`
function cond(prop, value) {
  return `<TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator><BindablePropertyNumber><DataBindContext sourcePathIds="${VM}-${prop}" propertyKey="636"/></BindablePropertyNumber></TransitionPropertyViewModelComparator><TransitionValueNumberComparator value="${value}"/></TransitionViewModelCondition>`
}
const anyTransitions = states.map(([, , conds], i) =>
  `<StateTransition stateToId="${stateId(i)}" duration="140">${conds.map(([p, v]) => cond(p, v)).join('')}</StateTransition>`).join('\n                    ')
const stateNodes = states.map(([, anim], i) =>
  `<AnimationState x="${200 + (i % 3) * 220}" y="${Math.floor(i / 3) * 110}" animationId="${anim}" id="${stateId(i)}"/>`).join('\n                ')

const machine = `
    <StateMachine name="PaperMachine" id="${SM}">
        <StateMachineLayer name="Phase" id="${LAYER}">
            <AnyState x="0" y="-130">
                    ${anyTransitions}
            </AnyState>
            <ExitState x="0" y="-260"/>
            <EntryState x="0" y="0">
                <StateTransition stateToId="${stateId(0)}"/>
            </EntryState>
            ${stateNodes}
        </StateMachineLayer>
    </StateMachine>
${Object.values(A).join('\n')}
`

const rml = `<Rive version="1" kind="fragment">
    <!-- LE RECU / The Paper Remembers -- direction: ${direction}. GENERATED by tools/gen-scene.mjs; edit the generator, not this file.
         Contract (read by src/lib/rive-paper-contract.ts): number "phase" 0..7, number "outcome" 0..2, number "proximity" 0..1, number "markKept" 0|1.
         No scripts, no listeners, no persisted state, no cost text and no identity live in this file. -->
${art.replace('@@INSIDE@@', machine)}

    <DataConverterRangeMapper minInput="0" maxInput="1" minOutput="0" maxOutput="0.55" clampLower="true" clampUpper="true" name="ProximityToBristleBend" id="${CONV_BRISTLE}"/>
    <DataConverterRangeMapper minInput="0" maxInput="1" minOutput="0" maxOutput="0.34" clampLower="true" clampUpper="true" name="ProximityToGuide" id="${CONV_GHOST}"/>

    <ViewModel defaultInstanceId="${VM_INST}" name="PaperState" id="${VM}">
        <ViewModelPropertyNumber name="phase" id="${P_PHASE}"/>
        <ViewModelPropertyNumber name="outcome" id="${P_OUTCOME}"/>
        <ViewModelPropertyNumber name="proximity" id="${P_PROX}"/>
        <ViewModelPropertyNumber name="markKept" id="${P_KEPT}"/>
        <ViewModelInstance exports="true" name="Default" id="${VM_INST}">
            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="${P_PHASE}"/>
            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="${P_OUTCOME}"/>
            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="${P_PROX}"/>
            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="${P_KEPT}"/>
        </ViewModelInstance>
    </ViewModel>
</Rive>
`

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'scene.rml'), rml)
console.log(`wrote ${join(outDir, 'scene.rml')} (${direction}${backdrop ? ', backdrop' : ''}, ${rml.length} bytes, ids to ${seq})`)

