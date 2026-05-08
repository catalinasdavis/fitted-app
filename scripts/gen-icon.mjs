import sharp from '../node_modules/sharp/lib/index.js'
import { writeFileSync } from 'fs'

// 512x512 icon — dark bg, serif "f" + taupe dot
// Using a standalone circle for the dot so size/position are pixel-perfect

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="114" ry="114" fill="#1a1a1f"/>

  <!-- "f" — Georgia serif, off-white, baseline at y=370 -->
  <text
    x="148"
    y="370"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="310"
    font-weight="400"
    fill="#faf9f6"
    dominant-baseline="auto"
  >f</text>

  <!-- Dot — taupe circle, positioned at baseline right of the "f" -->
  <circle cx="310" cy="360" r="24" fill="#b8a99a"/>
</svg>`

const buf = Buffer.from(svg)

sharp(buf, { density: 144 })
  .png()
  .toBuffer()
  .then(data => {
    writeFileSync('public/icon.png', data)
    console.log('Written public/icon.png', data.length, 'bytes')
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
