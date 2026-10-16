// LE RECU V1.5 "One continuous gesture": generates scene.rml for the inline-ink Rive overlay.
//
//   node tools/gen-scene.mjs <dry|marker> <outDir> [--backdrop] [--mock]
//
// The artboard is a transparent overlay laid over the real cost list. React measures the real text
// line boxes of the chosen row(s) and writes them as plain numbers into the view model; the scene
// only draws ink at those coordinates. It contains no text, no cost labels, no identity, no script,
// no listener. Two directions share one state machine so they can be compared like for like:
//   dry    : irregular red dry-brush strike, red double-ring seal, black overprint for the 2nd impression
//   marker : bold translucent marker band (multiply), solid knocked-out disc seal, overprint
// (the V1.4 stage generator is kept as gen-scene-v1-4.mjs for provenance)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const direction = process.argv[2] ?? 'dry'
const outDir = process.argv[3] ?? '.'
const backdrop = process.argv.includes('--backdrop')
const mock = process.argv.includes('--mock') // preview-only: grey text-like bars so CLI frames show a row
if (!['dry', 'marker'].includes(direction)) throw new Error('direction must be dry|marker')

const INK = '1C1612', RED = 'A32018', IVORY = 'F3ECDF'
const c = (a, hex) => a.toString(16).toUpperCase().padStart(2, '0') + hex
let seq = 100
const nid = () => `0:${seq++}`
const f = (n) => Number(n.toFixed(3))
const objs = {}
const named = (name) => (objs[name] = nid())

let rs = 0x2b3c4d5e
const rnd = () => ((rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0) / 4294967296)

// ---- contract ------------------------------------------------------------------------------
const PHASE = { idle: 0, ink: 1, pending: 2, sealed: 3, waiting: 4, reveal: 5, failed: 6, unavailable: 7 }
const OUTCOME = { none: 0, same: 1, different: 2 }
const SEGS = 3 // up to three measured text lines per label
const MARKS = ['a', 'b', 'g'] // a = first/red, b = second/ink, g = hover ghost
const AB = '0:2', AB_STYLE = '0:5', SM = '0:7', LAYER = '0:8', VM = '0:40', VM_INST = '0:41'
const props = {}
const propNames = ['phase', 'outcome', 'viewerFirst', 'proximity', 's1x', 's1y', 's2x', 's2y', 'cx', 'cy', 'ch']
for (const m of MARKS) for (let i = 0; i < SEGS; i++) for (const k of ['x', 'y', 'w']) propNames.push(`${m}${i}${k}`)
propNames.forEach((n, i) => (props[n] = `0:${1000 + i}`))
const CONV_VISIBLE = '0:30', CONV_GHOST = '0:31'
const W = 390, H = 720

const bind = (prop, key, conv = '') => `<DataBindContext sourcePathIds="${VM}-${props[prop]}" propertyKey="${key}"${conv ? ` converterId="${conv}"` : ''}/>`

// ---- ink segment ---------------------------------------------------------------------------
const dry = direction === 'dry'
const thick = dry ? 9.5 : 20
const cap = dry ? 'round' : 'butt'
function segment(mark, i, color, alpha) {
  const p = `${mark}${i}`
  const wob = [0, 1, 2, 3, 4].map(() => f(dry ? (rnd() - 0.5) * 3.2 : 0))
  const verts = wob.map((y, k) => `<StraightVertex x="${k * 25}" y="${y}" radius="${dry ? 20 : 0}"/>`).join('')
  const path = (n) => `<PointsPath isClosed="false" name="${n}">${verts}</PointsPath>`
  const trim = named(`trim_${p}`)
  const group = nid()
  const blend = !dry || mark === 'b' ? 'blendModeValue="multiply"' : ''
  // the second (black) impression is thinner and translucent so a struck label stays legible under both marks
  const th = dry && mark === 'b' ? 6.5 : thick
  return `
            <Node name="Seg ${p}" id="${named('seg_' + p)}" opacity="0" scaleX="0">
                ${bind(`${p}x`, 13)}${bind(`${p}y`, 14)}${bind(`${p}w`, 16)}${bind(`${p}w`, 18, CONV_VISIBLE)}
                <GroupEffect name="Reveal ${p}" id="${group}"><TrimPath start="0" end="0" id="${trim}" name="Trim"/></GroupEffect>
                <Shape name="Bloom ${p}">
                    ${path('Path')}
                    <Stroke thickness="${thick + 7}" cap="${cap}" join="round" transformAffectsStroke="false" name="Bloom"><SolidColor colorValue="${c(dry ? 64 : 0, color)}" name="C"/><Feather strength="6" name="F"/><TargetEffect targetId="${group}" name="T"/></Stroke>
                </Shape>
                <Shape name="Ink ${p}">
                    ${path('Path')}
                    <Stroke thickness="${th}" cap="${cap}" join="round" transformAffectsStroke="false" ${blend} name="Ink"><SolidColor colorValue="${c(alpha, color)}" name="C"/><TargetEffect targetId="${group}" name="T"/></Stroke>
                </Shape>
                ${dry
    ? `<Shape name="Streak ${p}" y="1.7">
                    ${path('Path')}
                    <Stroke thickness="1.1" cap="round" join="round" transformAffectsStroke="false" name="Streak"><SolidColor colorValue="${c(110, IVORY)}" name="C"/><TargetEffect targetId="${group}" name="T"/></Stroke>
                </Shape>`
    : `<Shape name="Edge ${p}" y="${-thick / 2}"><PointsPath isClosed="false" name="P"><StraightVertex x="0" y="0"/><StraightVertex x="100" y="0"/></PointsPath><Stroke thickness="1.2" transformAffectsStroke="false" name="E"><SolidColor colorValue="${c(230, color)}" name="C"/><TargetEffect targetId="${group}" name="T"/></Stroke></Shape>`}
            </Node>`
}

function ghostSegment(i) {
  const p = `g${i}`
  const verts = [0, 25, 50, 75, 100].map((x) => `<StraightVertex x="${x}" y="0"/>`).join('')
  return `
            <Node name="Ghost ${p}" id="${named('seg_' + p)}" opacity="0" scaleX="0">
                ${bind(`${p}x`, 13)}${bind(`${p}y`, 14)}${bind(`${p}w`, 16)}${bind(`${p}w`, 18, CONV_VISIBLE)}
                <Shape name="Guide ${p}"><PointsPath isClosed="false" name="P">${verts}</PointsPath><Stroke thickness="${dry ? 3 : 14}" cap="${cap}" transformAffectsStroke="false" name="S"><SolidColor colorValue="${c(255, RED)}" name="C"/><DashPath name="D"><Dash length="9" name="on"/><Dash length="7" name="off"/></DashPath></Stroke></Shape>
            </Node>`
}

// ---- seals ----------------------------------------------------------------------------------
function seal(n, color, second) {
  const feather = named(`${n.toLowerCase()}Feather`)
  const blend = second ? 'blendModeValue="multiply"' : ''
  const body = dry
    ? `<Shape name="Wash"><Ellipse width="40" height="40" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(second ? 18 : 26, color)}" name="C"/></Fill></Shape>
                <Shape name="Outer"><Ellipse width="42" height="42" originX="0.5" originY="0.5" name="P"/><Stroke thickness="2.8" ${blend} name="S"><SolidColor colorValue="${c(second ? 235 : 255, color)}" name="C"/><Feather strength="0" id="${feather}" name="Feather"/></Stroke></Shape>
                <Shape name="Inner"><Ellipse width="33" height="33" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.1" name="S"><SolidColor colorValue="${c(255, color)}" name="C"/></Stroke></Shape>
                <Shape name="Ticks"><Ellipse width="37.5" height="37.5" originX="0.5" originY="0.5" name="P"/><Stroke thickness="3.4" name="S"><SolidColor colorValue="${c(150, color)}" name="C"/><DashPath name="D"><Dash length="1.2" name="on"/><Dash length="3.6" name="off"/></DashPath></Stroke></Shape>
                <Shape name="Core"><Ellipse width="4.5" height="4.5" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(255, color)}" name="C"/></Fill></Shape>`
    : `<Shape name="Disc"><Ellipse width="44" height="44" originX="0.5" originY="0.5" name="P"/><Ellipse width="35" height="35" originX="0.5" originY="0.5" name="H1"/><Ellipse width="29" height="29" originX="0.5" originY="0.5" name="H2"/><Fill fillRule="evenOdd" ${blend} name="F"><SolidColor colorValue="${c(second ? 215 : 255, color)}" name="C"/></Fill></Shape>
                <Shape name="Plug"><Ellipse width="18" height="18" originX="0.5" originY="0.5" name="P"/><Fill name="F"><SolidColor colorValue="${c(second ? 130 : 255, color)}" name="C"/></Fill><Stroke thickness="0" name="S"><SolidColor colorValue="${c(0, color)}" name="C"/><Feather strength="0" id="${feather}" name="Feather"/></Stroke></Shape>`
  const px = second ? 's2x' : 's1x', py = second ? 's2y' : 's1y'
  return `
        <Node name="${n}" id="${named(n.toLowerCase())}" opacity="1">
            ${bind(px, 13)}${bind(py, 14)}
            <Node name="${n} fx" id="${named(n.toLowerCase() + 'fx')}" opacity="0" rotation="-0.14">
                ${body}
            </Node>
        </Node>`
}

// ---- artboard --------------------------------------------------------------------------------
const mockRow = mock ? `
        <Shape x="30" y="120" name="MOCK row text (CLI preview only)" id="${nid()}"><Rectangle width="230" height="16" originX="0" originY="0.5" cornerRadiusTL="3" name="P"/><Fill name="F"><SolidColor colorValue="FF5A4F44" name="C"/></Fill></Shape>
        <Shape x="30" y="146" name="MOCK sub" id="${nid()}"><Rectangle width="300" height="9" originX="0" originY="0.5" cornerRadiusTL="3" name="P"/><Fill name="F"><SolidColor colorValue="FFB8AE9F" name="C"/></Fill></Shape>
        <Shape x="30" y="262" name="MOCK row text 2" id="${nid()}"><Rectangle width="170" height="16" originX="0" originY="0.5" cornerRadiusTL="3" name="P"/><Fill name="F"><SolidColor colorValue="FF5A4F44" name="C"/></Fill></Shape>
        <Shape x="30" y="288" name="MOCK sub 2" id="${nid()}"><Rectangle width="260" height="9" originX="0" originY="0.5" cornerRadiusTL="3" name="P"/><Fill name="F"><SolidColor colorValue="FFB8AE9F" name="C"/></Fill></Shape>` : ''

const connGroup = nid()
const art = `
    <Artboard defaultStateMachineId="${SM}" viewModelId="${VM}" viewModelInstanceId="${VM_INST}" clip="true" width="${W}" height="${H}" styleId="${AB_STYLE}" name="InkOverlay" id="${AB}">
        ${backdrop ? `<Fill name="Backdrop"><SolidColor colorValue="${c(255, IVORY)}" name="Ivory"/></Fill>` : ''}
        <LayoutComponentStyle name="Artboard Style" id="${AB_STYLE}"/>
        <Node name="Root" id="${named('root')}">
        ${seal('Seal2', INK, true)}
        ${seal('Seal1', RED, false)}
        <Node name="Pending ring pos">
            ${bind('s1x', 13)}${bind('s1y', 14)}
            <Shape opacity="0" name="Pending ring" id="${named('pendingRing')}"><Ellipse width="52" height="52" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.6" name="S"><SolidColor colorValue="${c(190, INK)}" name="C"/><DashPath name="D"><Dash length="3" name="on"/><Dash length="6" name="off"/></DashPath></Stroke></Shape>
        </Node>
        <Node name="Shock pos">
            ${bind('s1x', 13)}${bind('s1y', 14)}
            <Shape opacity="0" scaleX="0.4" scaleY="0.4" name="Shock1" id="${named('shock1')}"><Ellipse width="64" height="64" originX="0.5" originY="0.5" name="P"/><Stroke thickness="1.4" name="S"><SolidColor colorValue="${c(150, INK)}" name="C"/></Stroke></Shape>
            <Shape opacity="0" scaleX="0.4" scaleY="0.4" name="Shock2" id="${named('shock2')}"><Ellipse width="64" height="64" originX="0.5" originY="0.5" name="P"/><Stroke thickness="0.9" name="S"><SolidColor colorValue="${c(110, INK)}" name="C"/></Stroke></Shape>
        </Node>
        <Node name="Connector" id="${named('conn')}" opacity="0" scaleY="0">
            ${bind('cx', 13)}${bind('cy', 14)}${bind('ch', 17)}${bind('ch', 18, CONV_VISIBLE)}
            <GroupEffect name="Reveal conn" id="${connGroup}"><TrimPath start="0" end="0" id="${named('trimConn')}" name="Trim"/></GroupEffect>
            <Shape name="Line"><PointsPath isClosed="false" name="P"><StraightVertex x="0" y="0"/><StraightVertex x="0" y="100"/></PointsPath><Stroke thickness="1.2" transformAffectsStroke="false" name="S"><SolidColor colorValue="${c(200, INK)}" name="C"/><TargetEffect targetId="${connGroup}" name="T"/></Stroke></Shape>
        </Node>
        <Node name="Marks B" id="${named('markB')}">
            ${Array.from({ length: SEGS }, (_, i) => segment('b', i, INK, 175)).join('')}
        </Node>
        <Node name="Marks A" id="${named('markA')}">
            ${Array.from({ length: SEGS }, (_, i) => segment('a', i, RED, 236)).join('')}
        </Node>
        <Node name="Ghost" id="${named('ghostGroup')}" opacity="0">
            ${bind('proximity', 18, CONV_GHOST)}
            ${Array.from({ length: SEGS }, (_, i) => ghostSegment(i)).join('')}
        </Node>
        ${mockRow}
        </Node>
        @@INSIDE@@
    </Artboard>`

// ---- animations (frames @60fps) ---------------------------------------------------------------
const kf = (frame, value, interp = 'cubic') => `<KeyFrameDouble value="${f(value)}" interpolationType="${interp}"${frame ? ` frame="${frame}"` : ''}/>`
function anim(name, id, duration, loop, tracks) {
  const last = new Map()
  for (const t of tracks) last.set(t[0] + '.' + t[1], t)
  const byObj = new Map()
  for (const [o, p, ks] of last.values()) {
    const oid = objs[o]
    if (!oid) throw new Error(`unknown animated object ${o} in ${name}`)
    if (!byObj.has(oid)) byObj.set(oid, [])
    byObj.get(oid).push(`<KeyedProperty property="${p}">${ks.map((k) => kf(...k)).join('')}</KeyedProperty>`)
  }
  const body = [...byObj].map(([oid, ps]) => `<KeyedObject objectId="${oid}">${ps.join('')}</KeyedObject>`).join('\n            ')
  return `
        <LinearAnimation loopValue="${loop}" duration="${duration}" name="${name}" id="${id}">
            ${body}
        </LinearAnimation>`
}
const trims = (m, v) => Array.from({ length: SEGS }, (_, i) => [`trim_${m}${i}`, 'end', [[0, v]]])
const draw = (m, t0 = 0, len = 22, stagger = 12) => Array.from({ length: SEGS }, (_, i) => [`trim_${m}${i}`, 'end', [[0, 0, 'linear'], [t0 + i * stagger, 0, 'cubic'], [t0 + i * stagger + len, 1, 'cubic']]])
const retract = (m, t0 = 0) => Array.from({ length: SEGS }, (_, i) => [`trim_${m}${i}`, 'end', [[0, 1, 'linear'], [t0 + (SEGS - 1 - i) * 8, 1, 'cubic'], [t0 + (SEGS - 1 - i) * 8 + 16, 0, 'cubic']]])
const rest = [
  ['seal1fx', 'opacity', [[0, 0]]], ['seal2fx', 'opacity', [[0, 0]]], ['pendingRing', 'opacity', [[0, 0]]],
  ['shock1', 'opacity', [[0, 0]]], ['shock2', 'opacity', [[0, 0]]], ['root', 'opacity', [[0, 1]]],
  ['markA', 'x', [[0, 0]]], ['markB', 'x', [[0, 0]]], ['markB', 'y', [[0, 0]]], ['markA', 'opacity', [[0, 1]]], ['markB', 'opacity', [[0, 1]]],
  ['trimConn', 'end', [[0, 0]]], ['seal1fx', 'scaleX', [[0, 1]]], ['seal1fx', 'scaleY', [[0, 1]]], ['seal2fx', 'scaleX', [[0, 1]]], ['seal2fx', 'scaleY', [[0, 1]]],
]
const sealImpact = (n, t0, feather) => [
  [`${n}fx`, 'opacity', [[t0, 0, 'linear'], [t0 + 4, 1, 'linear']]],
  [`${n}fx`, 'scaleX', [[t0, 1.7, 'cubic'], [t0 + 9, 0.92, 'cubic'], [t0 + 18, 1, 'cubic']]],
  [`${n}fx`, 'scaleY', [[t0, 1.7, 'cubic'], [t0 + 9, 0.92, 'cubic'], [t0 + 18, 1, 'cubic']]],
  [`${n}fx`, 'rotation', [[t0, 0.3, 'cubic'], [t0 + 14, -0.14, 'cubic']]],
  [feather, 'strength', [[t0, 7, 'cubic'], [t0 + 24, 0, 'cubic']]],
]
const shock = (t0) => [
  ['shock1', 'opacity', [[0, 0, 'linear'], [t0 + 4, 0.8, 'linear'], [t0 + 44, 0, 'cubic']]],
  ['shock1', 'scaleX', [[0, 0.4], [t0, 0.4, 'cubic'], [t0 + 44, 3.2, 'cubic']]],
  ['shock1', 'scaleY', [[0, 0.4], [t0, 0.4, 'cubic'], [t0 + 44, 3.2, 'cubic']]],
  ['shock2', 'opacity', [[0, 0, 'linear'], [t0 + 10, 0.55, 'linear'], [t0 + 56, 0, 'cubic']]],
  ['shock2', 'scaleX', [[0, 0.4], [t0 + 10, 0.5, 'cubic'], [t0 + 56, 3.5, 'cubic']]],
  ['shock2', 'scaleY', [[0, 0.4], [t0 + 10, 0.5, 'cubic'], [t0 + 56, 3.5, 'cubic']]],
]
const heldA = [...trims('a', 1), ['seal1fx', 'opacity', [[0, 1]]], ['seal1fx', 'rotation', [[0, -0.14]]], ['seal1Feather', 'strength', [[0, 0]]]]
const pulse = (len) => { const k = []; for (let t = 0; t <= len; t += 60) k.push([t + 40, 0.72 + (t % 120 ? 0.28 : 0), 'cubic']); return k }

const A = {}
A.idle = anim('idle', '0:20', 60, 'loop', [...trims('a', 0), ...trims('b', 0), ...rest])
A.inkA = anim('inkA', '0:21', 70, 'oneShot', [...rest, ...trims('b', 0), ...draw('a')])
A.pendA = anim('pendA', '0:22', 240, 'loop', [...rest, ...trims('a', 1), ...trims('b', 0), ['pendingRing', 'opacity', [[0, 0, 'cubic'], [20, 0.95, 'cubic']]], ['pendingRing', 'rotation', [[0, 0, 'linear'], [240, 6.2832, 'linear']]]])
A.pendB = anim('pendB', '0:23', 1200, 'oneShot', [...rest, ...trims('a', 0), ...draw('b'), ['markB', 'opacity', [[0, 1, 'linear'], ...pulse(1160)]]])
A.sealed = anim('sealed', '0:24', 80, 'oneShot', [...rest, ...trims('a', 1), ...trims('b', 0), ...sealImpact('seal1', 0, 'seal1Feather'), ...shock(0), ['pendingRing', 'opacity', [[0, 0.6, 'cubic'], [6, 0, 'cubic']]]])
A.waiting = anim('waiting', '0:25', 360, 'loop', [...rest, ...heldA, ...trims('b', 0), ['seal1fx', 'scaleX', [[0, 1, 'cubic'], [180, 1.02, 'cubic'], [360, 1, 'cubic']]], ['seal1fx', 'scaleY', [[0, 1, 'cubic'], [180, 1.02, 'cubic'], [360, 1, 'cubic']]]])
const reveal = (nm, id, outcome, viewerFirst) => {
  const t = [...rest, ...(viewerFirst ? heldA : [...draw('a', 0, 20, 10), ...sealImpact('seal1', 34, 'seal1Feather')])]
  const b0 = viewerFirst ? 0 : 40
  t.push(...(viewerFirst ? draw('b', b0, 20, 10) : trims('b', 1)), ...sealImpact('seal2', b0 + 30, 'seal2Feather'), ...shock(b0 + 30))
  if (outcome === 'same') {
    t.push(['markB', 'y', [[0, 5, 'linear'], [b0 + 56, 0, 'cubic']]], ['markB', 'x', [[0, 6, 'linear'], [b0 + 56, 0, 'cubic']]])
  } else {
    t.push(['trimConn', 'end', [[0, 0, 'linear'], [b0 + 50, 0, 'cubic'], [b0 + 80, 1, 'cubic']]])
  }
  return anim(nm, id, b0 + 120, 'oneShot', t)
}
A.rSF1 = reveal('revealSameFirst', '0:26', 'same', true)
A.rDF1 = reveal('revealDifferentFirst', '0:27', 'different', true)
A.rSF0 = reveal('revealSameSecond', '0:28', 'same', false)
A.rDF0 = reveal('revealDifferentSecond', '0:29', 'different', false)
A.failA = anim('failedFirst', '0:50', 90, 'oneShot', [...rest, ...trims('a', 1), ...trims('b', 0), ['pendingRing', 'opacity', [[0, 0.9, 'cubic'], [14, 0, 'cubic']]],
  ['markA', 'x', [[0, 0, 'linear'], [4, -4, 'linear'], [8, 4, 'linear'], [12, -2, 'linear'], [16, 0, 'linear']]], ['markA', 'opacity', [[0, 1, 'linear'], [30, 0.62, 'cubic']]]])
A.failB = anim('failedSecond', '0:51', 90, 'oneShot', [...rest, ...trims('a', 0), ...retract('b', 6), ['pendingRing', 'opacity', [[0, 0]]],
  ['markB', 'x', [[0, 0, 'linear'], [4, -4, 'linear'], [8, 4, 'linear'], [12, 0, 'linear']]]])
A.unavailable = anim('unavailable', '0:52', 40, 'oneShot', [...rest, ...trims('a', 1), ...trims('b', 1), ['seal1fx', 'opacity', [[0, 0]]], ['root', 'opacity', [[0, 1, 'cubic'], [30, 0.35, 'cubic']]]])

// ---- state machine -----------------------------------------------------------------------------
const P = (name) => props[name]
const states = [
  ['idle', '0:20', [[P('phase'), PHASE.idle]]],
  ['inkA', '0:21', [[P('phase'), PHASE.ink]]],
  ['pendA', '0:22', [[P('phase'), PHASE.pending], [P('viewerFirst'), 1]]],
  ['pendB', '0:23', [[P('phase'), PHASE.pending], [P('viewerFirst'), 0]]],
  ['sealed', '0:24', [[P('phase'), PHASE.sealed]]],
  ['waiting', '0:25', [[P('phase'), PHASE.waiting]]],
  ['rSF1', '0:26', [[P('phase'), PHASE.reveal], [P('outcome'), OUTCOME.same], [P('viewerFirst'), 1]]],
  ['rDF1', '0:27', [[P('phase'), PHASE.reveal], [P('outcome'), OUTCOME.different], [P('viewerFirst'), 1]]],
  ['rSF0', '0:28', [[P('phase'), PHASE.reveal], [P('outcome'), OUTCOME.same], [P('viewerFirst'), 0]]],
  ['rDF0', '0:29', [[P('phase'), PHASE.reveal], [P('outcome'), OUTCOME.different], [P('viewerFirst'), 0]]],
  ['failA', '0:50', [[P('phase'), PHASE.failed], [P('viewerFirst'), 1]]],
  ['failB', '0:51', [[P('phase'), PHASE.failed], [P('viewerFirst'), 0]]],
  ['unavailable', '0:52', [[P('phase'), PHASE.unavailable]]],
]
const stateId = (i) => `0:${70 + i}`
const cond = (prop, value) => `<TransitionViewModelCondition opValue="equal"><TransitionPropertyViewModelComparator><BindablePropertyNumber><DataBindContext sourcePathIds="${VM}-${prop}" propertyKey="636"/></BindablePropertyNumber></TransitionPropertyViewModelComparator><TransitionValueNumberComparator value="${value}"/></TransitionViewModelCondition>`
const anyTransitions = states.map(([, , conds], i) => `<StateTransition stateToId="${stateId(i)}" duration="140">${conds.map(([p, v]) => cond(p, v)).join('')}</StateTransition>`).join('\n                    ')
const stateNodes = states.map(([, a], i) => `<AnimationState x="${200 + (i % 4) * 220}" y="${Math.floor(i / 4) * 110}" animationId="${a}" id="${stateId(i)}"/>`).join('\n                ')
const machine = `
    <StateMachine name="InkMachine" id="${SM}">
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

const vmProps = propNames.map((n) => `        <ViewModelPropertyNumber name="${n}" id="${props[n]}"/>`).join('\n')
const vmVals = propNames.map((n) => `            <ViewModelInstanceNumber propertyValue="0" viewModelPropertyId="${props[n]}"/>`).join('\n')

const rml = `<Rive version="1" kind="fragment">
    <!-- LE RECU V1.5 inline ink, direction: ${direction}. GENERATED by tools/gen-scene.mjs; edit the generator, not this file.
         Contract (src/lib/rive-paper-contract.ts): numbers phase 0..7, outcome 0..2, viewerFirst 0|1, proximity 0..1,
         s1x s1y s2x s2y (seal centres), cx cy ch (connector), and per mark a|b|g (first, second, hover ghost) and
         text line i=0..2: <mark><i>x, <mark><i>y (line origin, px) and <mark><i>w (line length / 100). 0 w hides a line.
         No scripts, no listeners, no text, no cost labels, no identity, no persisted state. -->
${art.replace('@@INSIDE@@', machine)}

    <DataConverterRangeMapper minInput="0" maxInput="0.0005" minOutput="0" maxOutput="1" clampLower="true" clampUpper="true" name="PresentWhenPositive" id="${CONV_VISIBLE}"/>
    <DataConverterRangeMapper minInput="0" maxInput="1" minOutput="0" maxOutput="0.34" clampLower="true" clampUpper="true" name="ProximityToGuide" id="${CONV_GHOST}"/>

    <ViewModel defaultInstanceId="${VM_INST}" name="InkState" id="${VM}">
${vmProps}
        <ViewModelInstance exports="true" name="Default" id="${VM_INST}">
${vmVals}
        </ViewModelInstance>
    </ViewModel>
</Rive>
`
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'scene.rml'), rml)
console.log(`wrote ${join(outDir, 'scene.rml')} (${direction}${backdrop ? ', backdrop' : ''}${mock ? ', mock row' : ''}, ${rml.length} bytes, ids to ${seq}, props ${propNames.length})`)
