import { t, type Locale } from "./locale"

type PosterInput = {
  desire: string
  first: string
  second: string
  timestamp: number
  number: string
  locale: Locale
}

/** Original 4:5 artefact drawn only from two committed choices. No artificial stats. */
export async function makeDuplexPoster({ desire, first, second, timestamp, number, locale }: PosterInput): Promise<Blob> {
  // Canvas needs the actual loaded typefaces; otherwise an early iPhone export
  // can produce a fallback-font poster with different line wrapping.
  try {
    await Promise.all([
      document.fonts.load('600 76px "Fraunces"'),
      document.fonts.load('italic 500 64px "Fraunces"'),
      document.fonts.load('500 22px "IBM Plex Mono"'),
    ])
  } catch { /* The poster still has built-in serif/monospace fallbacks. */ }
  const canvas=document.createElement("canvas")
  canvas.width=1080
  canvas.height=1350
  const ctx=canvas.getContext("2d")
  if (!ctx) return Promise.reject(new Error("Canvas unavailable"))
  const paper="#f3ecdf", ink="#1c1612",red="#a32018",carbon="#141210"
  const words=t(locale)
  const serif='"Fraunces", Georgia, serif'
  const mono='"IBM Plex Mono", monospace'
  ctx.fillStyle=carbon
  ctx.fillRect(0,0,1080,1350)
  ctx.fillStyle=paper
  ctx.fillRect(64,54,952,1238)
  drawPaperGrain(ctx,seedPoster(number,desire,first,second))
  ctx.fillStyle=ink
  ctx.textAlign="left"
  ctx.font=`600 ${locale==="en"?72:83}px ${serif}`
  ctx.fillText(words.title,122,166)
  ctx.font=`24px ${mono}`
  ctx.fillText(`Nº ${number}  ·  ${new Date(timestamp).toLocaleDateString(locale==="fr"?"fr-CA":"en-CA")}`,125,213)
  ctx.strokeStyle="#a6a098"
  ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(120,250);ctx.lineTo(960,250);ctx.stroke()
  ctx.font=`italic 500 76px ${serif}`
  writeLines(ctx,locale==="en"?`“${desire}”`:`« ${desire} »`,122,345,816,79,2,false)
  ctx.fillStyle=ink
  ctx.font=`22px ${mono}`
  ctx.fillText(words.twoLimits,124,503)
  ctx.strokeStyle="#c7beb2"
  ctx.beginPath();ctx.moveTo(122,532);ctx.lineTo(958,532);ctx.stroke()
  ctx.font=`22px ${mono}`
  ctx.fillText(words.first,124,595)
  drawRefusal(ctx,first,123,680,815,70,serif,red,31)
  ctx.font=`22px ${mono}`
  ctx.fillStyle=ink
  ctx.fillText(words.second,124,836)
  drawRefusal(ctx,second,123,920,815,70,serif,red,73)
  // Two slightly imperfect rings and an inset verdict give a deliberate
  // physical ink-stamp effect. No transcript or result is fabricated.
  const same=first===second
  const seal=locale==="en"?(same?["SAME","REFUSAL"]:["NOT THE","SAME LINE"]):(same?["MÊME","REFUS"]:["PAS LA MÊME","LIGNE"])
  drawVerdictSeal(ctx,seal,red,mono)
  ctx.fillStyle=ink
  ctx.font=`500 20px ${mono}`
  drawTracked(ctx,words.posterQuestion,540,1263,3.1,820)
  ctx.fillStyle=carbon
  for(let x=64;x<1016;x+=22){ctx.beginPath();ctx.arc(x,1292,11,0,Math.PI*2);ctx.fill()}
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("PNG export failed")),"image/png")
  })
}

function drawRefusal(
  ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,size:number,font:string,red:string,seed:number,
):void {
  ctx.font=`italic 500 ${size}px ${font}`
  ctx.textAlign="left"
  ctx.fillStyle="#1c1612"
  writeLines(ctx,text,x,y,maxWidth,69,2,false)
  // Refusal is a gesture: a textured, near-straight red ink pass over the
  // letterforms, not a tidy underline or unrestricted random paint splatter.
  const words=text.trim().split(/\s+/)
  let chunks:string[]=[]
  let line=""
  for(const word of words) {
    const proposed=line ? line+" "+word : word
    if(line && ctx.measureText(proposed).width>maxWidth && chunks.length<1) {chunks.push(line);line=word}
    else line=proposed
  }
  if(line) chunks.push(line)
  for(let i=0;i<chunks.length;i++){
    const width=Math.min(maxWidth,ctx.measureText(chunks[i]).width)
    drawInkStrike(ctx,x-12,y+i*69-23,width+24,red,seed+i*17)
  }
}

function writeLines(
  ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,lineHeight:number,maxLines:number,strike:boolean,
):void {
  const words=text.trim().split(/\s+/).filter(Boolean)
  let lines:string[]=[]
  let line=""
  for(const word of words){
    const proposal=line?`${line} ${word}`:word
    if(line && ctx.measureText(proposal).width>maxWidth && lines.length<maxLines-1){
      lines.push(line);line=word
    }else{line=proposal}
  }
  if(line)lines.push(line)
  for(let i=0;i<Math.min(maxLines,lines.length);i++){
    const label=lines[i]
    // On exceptionally wide translations, scale proportionately to prevent clipping.
    const width=ctx.measureText(label).width
    ctx.save()
    if(width>maxWidth){ctx.translate(x,y+i*lineHeight);ctx.scale(maxWidth/width,1);ctx.fillText(label,0,0)}
    else ctx.fillText(label,x,y+i*lineHeight)
    ctx.restore()
    if(strike){
      ctx.beginPath()
      ctx.moveTo(x,y+i*lineHeight-19)
      ctx.lineTo(x+Math.min(width,maxWidth),y+i*lineHeight-19)
      ctx.stroke()
    }
  }
}

function seedPoster(...parts:string[]):number {
  let h=2166136261
  for(const char of parts.join("|")){h=Math.imul(h ^ char.charCodeAt(0),16777619)}
  return h>>>0
}
function randomInk(seed:number):()=>number {
  let x=seed || 1
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296}
}
function drawPaperGrain(ctx:CanvasRenderingContext2D,seed:number):void {
  const rnd=randomInk(seed)
  ctx.save()
  for(let i=0;i<2500;i++){
    const x=65+rnd()*950,y=55+rnd()*1232
    ctx.globalAlpha=0.018+rnd()*0.037
    ctx.fillStyle=i%3===0?"#402d20":"#7b654b"
    ctx.fillRect(x,y,0.45+rnd()*1.25,0.5+rnd()*1.1)
  }
  // Wear stays on the *paper*, away from the refusal and never resembles a
  // fake handwritten participant mark.
  ctx.strokeStyle="#3a2a1c"
  for(let i=0;i<20;i++){
    const x=i%2===0?66+rnd()*10:1002+rnd()*12
    const y=58+rnd()*1228
    ctx.globalAlpha=0.06+rnd()*0.09
    ctx.lineWidth=0.4+rnd()*0.8
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(rnd()-0.5)*16,y+2+rnd()*26);ctx.stroke()
  }
  ctx.restore()
}
function drawInkStrike(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,color:string,seed:number):void {
  const rnd=randomInk(seed)
  ctx.save()
  ctx.strokeStyle=color
  ctx.lineCap="round"
  ctx.lineJoin="round"
  const end=x+width
  // Main bristle gesture: nearly horizontal, deliberately disciplined.
  ctx.lineWidth=11.5
  ctx.beginPath();ctx.moveTo(x,y+3);ctx.bezierCurveTo(x+width*0.25,y-6,x+width*0.68,y+3,end,y-4);ctx.stroke()
  ctx.globalAlpha=0.56
  ctx.lineWidth=2.8
  ctx.beginPath();ctx.moveTo(x-9,y+8);ctx.bezierCurveTo(x+width*0.25,y+1,x+width*0.65,y+8,end+11,y+1);ctx.stroke()
  ctx.globalAlpha=0.35
  ctx.lineWidth=1.25
  ctx.beginPath();ctx.moveTo(x+2,y-4);ctx.lineTo(end+13,y-9);ctx.stroke()
  // Restrained dry-ink fragments are concentrated around stroke ends.
  for(let i=0;i<14;i++){
    const right=i>7,anchor=right?end:x
    const px=anchor+(rnd()-0.5)*(right?40:32)
    const py=y+(rnd()-0.5)*23
    ctx.globalAlpha=0.15+rnd()*0.4
    ctx.fillStyle=color
    ctx.fillRect(px,py,0.8+rnd()*3,0.7+rnd()*1.8)
  }
  ctx.restore()
}
function drawVerdictSeal(ctx:CanvasRenderingContext2D,seal:string[],red:string,mono:string):void {
  ctx.save()
  ctx.translate(540,1111)
  ctx.rotate(-Math.PI/34)
  ctx.strokeStyle=red
  ctx.lineWidth=5.4
  ctx.beginPath();ctx.arc(0,0,118,0,2*Math.PI);ctx.stroke()
  ctx.globalAlpha=0.84
  ctx.lineWidth=1.8
  ctx.beginPath();ctx.arc(0,0,109,0,2*Math.PI);ctx.stroke()
  ctx.globalAlpha=1
  ctx.fillStyle=red
  ctx.textAlign="center"
  for(let i=0;i<2;i++) {
    const label=seal[i]
    let size=31
    ctx.font=`bold ${size}px ${mono}`
    while(ctx.measureText(label).width>180 && size>19){size-=1;ctx.font=`bold ${size}px ${mono}`}
    ctx.fillText(label,0,i===0?0:40)
  }
  ctx.restore()
}
function drawTracked(ctx:CanvasRenderingContext2D,text:string,center:number,y:number,spacing:number,maxWidth:number):void {
  const glyphs=Array.from(text)
  const natural=glyphs.reduce((s,ch)=>s+ctx.measureText(ch).width,0)
  const track=Math.max(0,Math.min(spacing,(maxWidth-natural)/Math.max(1,glyphs.length-1)))
  const width=natural+track*Math.max(0,glyphs.length-1)
  ctx.textAlign="left"
  let x=center-width/2
  for(const ch of glyphs){ctx.fillText(ch,x,y);x+=ctx.measureText(ch).width+track}
}
