/**
 * Motor de la nebulosa del Inicio: un vórtice de dos brazos en espiral, dibujado en una grilla fija con caracteres de
 * densidad y katakana. El campo se precalcula por celda y cada glifo se copia desde un atlas, así cada cuadro solo hace
 * unos pocos cosenos y `drawImage` por celda visible. La grilla la manda el Canvas, no la fuente: los katakana miden
 * distinto en cada dispositivo y aun así quedan alineados.
 */
export const CELL_W = 8
export const CELL_H = 14
const FONT_PX = 12
// Si el dispositivo no trae una fuente japonesa mono, los katakana caen en la que tenga el sistema.
const FONT_STACK = "'JetBrains Mono Variable', 'Noto Sans Mono CJK JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'MS Gothic', monospace"

const DENSITY = ['·', ':', '+', '*', '#', '@']
const KANA = [...'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ']
export const GLYPHS = [...DENSITY, ...KANA]
/** Tonos de la gradiente: del borde de la nebulosa a su núcleo. */
export const SHADES = 12

const ARMS = 2
const TWIST = 3.6
const TILT = -0.42
/** La galaxia se ve inclinada: su eje menor mide esta fracción del mayor. */
const SQUASH = 0.68

export interface NebulaField {
  cols: number
  rows: number
  radius: Float32Array
  angle: Float32Array
  logRadius: Float32Array
  nx: Float32Array
  ny: Float32Array
  envelope: Float32Array
  core: Float32Array
  seed: Float32Array
}

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function buildField(width: number, height: number): NebulaField {
  const cols = Math.ceil(width / CELL_W)
  const rows = Math.ceil(height / CELL_H)
  const count = cols * rows
  const field: NebulaField = {
    cols,
    rows,
    radius: new Float32Array(count),
    angle: new Float32Array(count),
    logRadius: new Float32Array(count),
    nx: new Float32Array(count),
    ny: new Float32Array(count),
    envelope: new Float32Array(count),
    core: new Float32Array(count),
    seed: new Float32Array(count),
  }
  // Escala para que la elipse llene el panel sea cual sea su proporción.
  const scale = Math.max(1, Math.min(width / 2, height / 2 / SQUASH) * 1.12)
  const cos = Math.cos(TILT)
  const sin = Math.sin(TILT)
  for (let row = 0, i = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++, i++) {
      const dx = (col + 0.5) * CELL_W - width / 2
      const dy = (row + 0.5) * CELL_H - height / 2
      const x = (dx * cos - dy * sin) / scale
      const y = (dx * sin + dy * cos) / (scale * SQUASH)
      const r = Math.hypot(x, y)
      field.radius[i] = r
      field.angle[i] = Math.atan2(y, x)
      field.logRadius[i] = Math.log(r + 0.05)
      field.nx[i] = x
      field.ny[i] = y
      field.envelope[i] = Math.exp(-r * r * 2.2)
      field.core[i] = Math.exp(-r * r * 34)
      field.seed[i] = hash(col, row)
    }
  }
  return field
}

export type CellEmitter = (col: number, row: number, glyph: number, shade: number, alpha: number) => void

/** Recorre las celdas visibles en el instante `t` (segundos). Sin asignar memoria por cuadro. */
export function sampleField(f: NebulaField, t: number, emit: CellEmitter) {
  for (let row = 0, i = 0; row < f.rows; row++) {
    for (let col = 0; col < f.cols; col++, i++) {
      const seed = f.seed[i]
      const r = f.radius[i]
      if (r > 1.12) {
        // Estrellas sueltas: el vacío alrededor también titila.
        if (seed > 0.982) emit(col, row, 0, 2, 0.3 + 0.25 * Math.sin(t * 1.3 + seed * 80))
        continue
      }
      const arm = 0.5 + 0.5 * Math.cos(ARMS * f.angle[i] - TWIST * f.logRadius[i] + t * 0.38)
      const wisp = Math.sin(f.nx[i] * 6.1 + t * 0.31) * Math.sin(f.ny[i] * 7.3 - t * 0.23 + f.nx[i] * 2.1)
      const density = f.envelope[i] * (0.14 + 0.86 * arm * arm + 0.2 * wisp) + f.core[i] + (seed - 0.5) * 0.08
      if (density < 0.07) continue

      let glyph = Math.min(DENSITY.length - 1, Math.floor(density * DENSITY.length * 1.1))
      // Los katakana aparecen por zonas que van cambiando y cada uno muta un par de veces por segundo.
      if (density > 0.16 && (seed * 5.7 + t * 0.05) % 1 < 0.36) {
        glyph = DENSITY.length + Math.floor(((seed * 97 + Math.floor(t * 1.4 + seed * 11) * 7.3) % 1) * KANA.length)
      }
      const tone = 0.5 * density + 0.55 * (1 - r) + 0.1 * Math.sin(f.angle[i] + t * 0.22)
      const shade = Math.max(0, Math.min(SHADES - 1, Math.round(tone * (SHADES - 1))))
      emit(col, row, glyph, shade, Math.min(1, 0.28 + density))
    }
  }
}

export interface NebulaColors {
  /** Borde de la nebulosa. */
  rim: string
  mid: string
  /** Núcleo. */
  core: string
}

const parseHex = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

/** Gradiente de `SHADES` colores: borde → medio en el primer 60 %, medio → núcleo en el resto. */
export function shadeRamp({ rim, mid, core }: NebulaColors): string[] {
  const [a, b, c] = [rim, mid, core].map(parseHex)
  return Array.from({ length: SHADES }, (_, i) => {
    const p = i / (SHADES - 1)
    const [from, to, k] = p < 0.6 ? [a, b, p / 0.6] : [b, c, (p - 0.6) / 0.4]
    return `rgb(${from.map((v, n) => Math.round(v + (to[n] - v) * k)).join(' ')})`
  })
}

export function createNebula(canvas: HTMLCanvasElement, colors: NebulaColors) {
  const ctx = canvas.getContext('2d')
  const atlas = document.createElement('canvas')
  let dpr = 1
  let width = 0
  let height = 0
  let field = buildField(0, 0)

  const buildAtlas = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    atlas.width = GLYPHS.length * CELL_W * dpr
    atlas.height = SHADES * CELL_H * dpr
    const g = atlas.getContext('2d')
    if (!g) return
    g.scale(dpr, dpr)
    g.font = `500 ${FONT_PX}px ${FONT_STACK}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    shadeRamp(colors).forEach((color, shade) => {
      g.fillStyle = color
      GLYPHS.forEach((glyph, n) => g.fillText(glyph, (n + 0.5) * CELL_W, (shade + 0.5) * CELL_H))
    })
  }

  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w === width && h === height) return
    width = w
    height = h
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    field = buildField(w, h)
  }

  const emit: CellEmitter = (col, row, glyph, shade, alpha) => {
    if (!ctx) return
    ctx.globalAlpha = alpha
    ctx.drawImage(
      atlas,
      glyph * CELL_W * dpr, shade * CELL_H * dpr, CELL_W * dpr, CELL_H * dpr,
      col * CELL_W, row * CELL_H, CELL_W, CELL_H,
    )
  }

  const draw = (t: number) => {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    sampleField(field, t, emit)
    ctx.globalAlpha = 1
  }

  buildAtlas()
  return { resize, draw, rebuildGlyphs: buildAtlas }
}
