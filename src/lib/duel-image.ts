type PosterInput = {
  desire: string
  mine: string
  theirs: string
  timestamp: number
  number: string
}

/** An original image generated from the two committed choices, never a fake vote graphic. */
export function makeDuplexPoster({ desire, mine, theirs, timestamp, number }: PosterInput): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext("2d")
  if (!ctx) return Promise.reject(new Error("Ce navigateur ne peut pas générer l'image."))
  const ink = "#1c1612"
  const paper = "#f3ecdf"
  const red = "#a32018"
  ctx.fillStyle = "#141210"
  ctx.fillRect(0, 0, 1080, 1350)
  ctx.fillStyle = paper
  ctx.fillRect(64, 54, 952, 1238)
  ctx.fillStyle = ink
  ctx.textAlign = "left"
  ctx.font = 'bold 83px "Fraunces", Georgia, serif'
  ctx.fillText("LE REÇU", 122, 170)
  ctx.font = '24px "IBM Plex Mono", monospace'
  ctx.fillText(`Nº ${number}  ·  ${new Date(timestamp).toLocaleDateString("fr-CA")}`, 125, 213)
  ctx.fillStyle = "#a6a098"
  ctx.fillRect(120, 252, 840, 2)
  ctx.fillStyle = ink
  ctx.font = 'italic 76px "Fraunces", Georgia, serif'
  let y = drawWrapped(ctx, `« ${desire} »`, 122, 343, 810, 82, 3)
  y = Math.max(y + 45, 525)
  ctx.font = '22px "IBM Plex Mono", monospace'
  ctx.fillText("MÊME ENVIE   /   DEUX LIMITES", 124, y)
  ctx.strokeStyle = "#c7beb2"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(122, y + 28)
  ctx.lineTo(958, y + 28)
  ctx.stroke()
  const top = y + 98
  ctx.fillStyle = ink
  ctx.font = '22px "IBM Plex Mono", monospace'
  ctx.fillText("01 / MOI", 124, top)
  ctx.font = 'italic 57px "Fraunces", Georgia, serif'
  const mineEnd = drawWrapped(ctx, mine, 123, top + 85, 814, 62, 2)
  ctx.strokeStyle = red
  ctx.lineWidth = 9
  ctx.beginPath()
  ctx.moveTo(121, top + 98)
  ctx.lineTo(Math.min(955, 123 + ctx.measureText(mine).width + 14), top + 98)
  ctx.stroke()
  let otherTop = Math.max(mineEnd + 58, top + 220)
  ctx.fillStyle = ink
  ctx.font = '22px "IBM Plex Mono", monospace'
  ctx.fillText("02 / L'AUTRE", 124, otherTop)
  ctx.font = 'italic 57px "Fraunces", Georgia, serif'
  drawWrapped(ctx, theirs, 123, otherTop + 83, 814, 62, 2)
  ctx.fillStyle = red
  ctx.textAlign = "center"
  ctx.font = 'bold 30px "IBM Plex Mono", monospace'
  const same = mine === theirs
  ctx.fillText(same ? "MÊME REFUS" : "PAS LA MÊME LIGNE", 540, 1114)
  ctx.strokeStyle = red
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(540, 1080, 112, 0, 2 * Math.PI)
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.font = '21px "IBM Plex Mono", monospace'
  ctx.fillText("PAS UN CONSEIL · UN PRIX", 540, 1217)
  ctx.fillStyle = "#141210"
  for (let x = 64; x < 1016; x += 22) {
    ctx.beginPath()
    ctx.arc(x, 1292, 11, 0, Math.PI * 2)
    ctx.fill()
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Export PNG impossible.")), "image/png")
  })
}

function drawWrapped(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number,
  width: number, height: number, maxLines: number,
): number {
  const words = text.trim().split(/\s+/)
  let line = ""
  let count = 0
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width > width && line) {
      ctx.fillText(line, x, y)
      y += height
      count++
      line = word
      if (count >= maxLines - 1) break
    } else line = attempt
  }
  if (line) { ctx.fillText(line, x, y); y += height }
  return y
}
