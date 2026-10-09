import { t, type Locale } from "./locale"

type PosterInput = {
  desire: string
  mine: string
  theirs: string
  timestamp: number
  number: string
  locale: Locale
}

/** Original 4:5 artefact drawn only from two committed choices. No artificial stats. */
export function makeDuplexPoster({ desire, mine, theirs, timestamp, number, locale }: PosterInput): Promise<Blob> {
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
  ctx.fillStyle=ink
  ctx.textAlign="left"
  ctx.font=`600 ${locale==="en"?72:83}px ${serif}`
  ctx.fillText(words.title,122,166)
  ctx.font=`24px ${mono}`
  ctx.fillText(`Nº ${number}  ·  ${new Date(timestamp).toLocaleDateString(locale==="fr"?"fr-CA":"en-CA")}`,125,213)
  ctx.strokeStyle="#a6a098"
  ctx.lineWidth=2
  ctx.beginPath();ctx.moveTo(120,250);ctx.lineTo(960,250);ctx.stroke()
  ctx.font=`italic 76px ${serif}`
  writeLines(ctx,locale==="en"?`“${desire}”`:`« ${desire} »`,122,345,816,79,2,false)
  ctx.fillStyle=ink
  ctx.font=`22px ${mono}`
  ctx.fillText(words.twoLimits,124,503)
  ctx.strokeStyle="#c7beb2"
  ctx.beginPath();ctx.moveTo(122,532);ctx.lineTo(958,532);ctx.stroke()
  ctx.font=`22px ${mono}`
  ctx.fillText(words.me,124,595)
  drawRefusal(ctx,mine,123,682,815,56,serif,red)
  ctx.font=`22px ${mono}`
  ctx.fillStyle=ink
  ctx.fillText(words.them,124,836)
  drawRefusal(ctx,theirs,123,922,815,56,serif,red)
  // Text always fits within this seal; the older one-line verdict overflowed it.
  ctx.strokeStyle=red
  ctx.lineWidth=4
  ctx.beginPath();ctx.arc(540,1120,107,0,Math.PI*2);ctx.stroke()
  ctx.fillStyle=red
  ctx.textAlign="center"
  ctx.font=`bold 24px ${mono}`
  const same=mine===theirs
  const seal=locale==="en"?(same?["SAME","REFUSAL"]:["NOT THE","SAME LINE"]):(same?["MÊME","REFUS"]:["PAS LA MÊME","LIGNE"])
  ctx.fillText(seal[0],540,1115)
  ctx.fillText(seal[1],540,1150)
  ctx.fillStyle=ink
  ctx.font=`21px ${mono}`
  ctx.fillText(words.posterQuestion,540,1261)
  ctx.fillStyle=carbon
  for(let x=64;x<1016;x+=22){ctx.beginPath();ctx.arc(x,1292,11,0,Math.PI*2);ctx.fill()}
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("PNG export failed")),"image/png")
  })
}

function drawRefusal(
  ctx:CanvasRenderingContext2D,text:string,x:number,y:number,maxWidth:number,size:number,font:string,red:string,
):void {
  ctx.font=`italic ${size}px ${font}`
  ctx.textAlign="left"
  ctx.fillStyle="#1c1612"
  ctx.strokeStyle=red
  ctx.lineWidth=5
  ctx.lineCap="round"
  writeLines(ctx,text,x,y,maxWidth,67,2,true)
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
