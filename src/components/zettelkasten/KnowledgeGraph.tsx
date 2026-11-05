import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from 'react-force-graph-2d'
import { THEME_BY_ID } from '@/data/themes'
import type { ThemeId } from '@/types/user'
import type { KLink, KnowledgeGraphData, KNode } from '@/utils/knowledgeGraph'

const SANS = '"Geist Variable", "Inter", ui-sans-serif, system-ui, sans-serif'
const MONO = '"JetBrains Mono Variable", ui-monospace, monospace'

type GNode = NodeObject<KNode>
type GLink = LinkObject<KNode, KLink>
const endId = (end: GLink['source']) => (typeof end === 'object' && end ? String((end as GNode).id) : String(end))

/** Zoom mínimo a partir del cual se dibuja la etiqueta de cada tipo de nodo. */
const LABEL_ZOOM: Record<KNode['kind'], number> = { subject: 0, axis: 0.95, subtopic: 1.6, concept: 2.4, question: 3.4 }

interface Props {
  data: KnowledgeGraphData
  width: number
  height: number
  theme: ThemeId
  selectedId: string | null
  onSelect: (node: KNode | null) => void
}

/** Grafo de fuerzas en Canvas (react-force-graph-2d); toma sus colores del tema activo. */
export function KnowledgeGraph({ data, width, height, theme, selectedId, onSelect }: Props) {
  const fgRef = useRef<ForceGraphMethods<GNode, GLink> | undefined>(undefined)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const fitted = useRef(false)
  const { graph: colors, dark } = THEME_BY_ID[theme]
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  /** Vecinos directos de cada nodo: al pasar el mouse o seleccionar, el resto se atenúa. */
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const l of data.links) {
      const s = endId(l.source as GLink['source'])
      const t = endId(l.target as GLink['target'])
      if (!map.has(s)) map.set(s, new Set())
      if (!map.has(t)) map.set(t, new Set())
      map.get(s)!.add(t)
      map.get(t)!.add(s)
    }
    return map
  }, [data])

  const focusId = hoverId ?? selectedId
  const inFocus = useCallback(
    (id: string) => !focusId || id === focusId || Boolean(neighbors.get(focusId)?.has(id)),
    [focusId, neighbors],
  )

  // Fuerzas: jerarquía compacta, preguntas pegadas a su subtema y enlaces cruzados largos y débiles.
  useEffect(() => {
    const fg = fgRef.current
    if (!fg) return
    type LinkForce = { distance: (fn: (l: GLink) => number) => LinkForce; strength: (fn: (l: GLink) => number) => LinkForce }
    type ChargeForce = { strength: (fn: (n: GNode) => number) => ChargeForce; distanceMax?: (d: number) => ChargeForce }
    const link = fg.d3Force('link') as unknown as LinkForce | undefined
    link
      ?.distance((l) => (l.kind === 'cross' ? 170 : l.kind === 'leaf' ? 9 : (l.source as GNode).kind === 'subject' ? 58 : 30))
      .strength((l) => (l.kind === 'cross' ? 0.012 : l.kind === 'leaf' ? 0.9 : 0.8))
    const charge = fg.d3Force('charge') as unknown as ChargeForce | undefined
    charge?.strength((n) => (n.kind === 'subject' ? -420 : n.kind === 'axis' ? -150 : n.kind === 'subtopic' ? -55 : -12))
    charge?.distanceMax?.(420)
    fitted.current = false
    fg.d3ReheatSimulation()
  }, [data])

  const drawNode = useCallback(
    (node: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
      const x = node.x ?? 0
      const y = node.y ?? 0
      const r = node.r
      ctx.globalAlpha = inFocus(String(node.id)) ? 1 : 0.16
      ctx.setLineDash([])

      // Cuerpo del nodo según tipo y dominio.
      ctx.beginPath()
      if (node.kind === 'concept') ctx.rect(x - r, y - r, r * 2, r * 2)
      else ctx.arc(x, y, r, 0, 2 * Math.PI)
      let fill: string = colors.surface
      let stroke: string = colors.faint
      let lineWidth = 1 / scale
      if (node.kind === 'subject') {
        fill = colors.strong
        stroke = colors.strong
      } else if (node.kind === 'axis') {
        fill = colors.surface
        stroke = colors.strong
        lineWidth = 1.4 / scale
      } else if (node.kind === 'subtopic') {
        if (node.mastery === 'dominado') fill = stroke = colors.strong
        else if (node.mastery === 'en-progreso') fill = stroke = colors.mid
        else {
          fill = colors.surface
          stroke = dark ? colors.muted : colors.faint
          lineWidth = 1.2 / scale
        }
      } else if (node.kind === 'concept') {
        fill = colors.surface
        stroke = colors.mid
      } else if (node.kind === 'question') {
        fill = node.status === 'correct' ? colors.correct : colors.surface
        stroke = node.status === 'correct' ? colors.correct : colors.incorrect
        lineWidth = (node.status === 'correct' ? 1 : 1.6) / scale
      }
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = lineWidth
      ctx.stroke()

      // Errores pendientes: anillo punteado sobrio alrededor del subtema (o concepto).
      if ((node.kind === 'subtopic' || node.kind === 'concept') && node.pending > 0) {
        ctx.beginPath()
        ctx.arc(x, y, r + 1.6, 0, 2 * Math.PI)
        ctx.setLineDash([1.2, 1])
        ctx.strokeStyle = colors.strong
        ctx.lineWidth = 0.6
        ctx.stroke()
        ctx.setLineDash([])
      }
      // Seleccionado.
      if (String(node.id) === selectedId) {
        ctx.beginPath()
        ctx.arc(x, y, r + (node.pending > 0 ? 3 : 2.2), 0, 2 * Math.PI)
        ctx.strokeStyle = colors.accent
        ctx.lineWidth = 1.5 / scale
        ctx.stroke()
      }

      // Etiquetas: aparecen según el zoom, siempre en el nodo enfocado y sus vecinos.
      const highlighted = Boolean(focusId) && inFocus(String(node.id))
      if (scale < LABEL_ZOOM[node.kind] && !highlighted) return
      const size =
        node.kind === 'subject' ? 13 : node.kind === 'axis' ? 11.5 : node.kind === 'subtopic' ? 11 : node.kind === 'concept' ? 10 : 9.5
      const weight = node.kind === 'subject' || node.kind === 'axis' || node.mastery === 'dominado' ? 600 : 450
      ctx.font = `${weight} ${size / scale}px ${node.kind === 'question' ? MONO : SANS}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const ty = y + r + 2.5 / scale + (node.pending > 0 && node.kind !== 'question' ? 1.6 : 0)
      const label = node.kind === 'subtopic' && node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label
      ctx.lineJoin = 'round'
      ctx.lineWidth = 3 / scale
      ctx.strokeStyle = colors.bg
      ctx.strokeText(label, x, ty)
      ctx.fillStyle =
        node.kind === 'subtopic' && node.mastery === 'sin-explorar' && !highlighted
          ? colors.muted
          : node.kind === 'concept' || node.kind === 'question'
            ? colors.mid
            : colors.strong
      ctx.fillText(label, x, ty)
      ctx.globalAlpha = 1
    },
    [colors, dark, focusId, inFocus, selectedId],
  )

  const paintArea = useCallback((node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x ?? 0, node.y ?? 0, node.r + 2, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  const linkColor = useCallback(
    (l: GLink) => {
      const on = !focusId || endId(l.source) === focusId || endId(l.target) === focusId
      if (!on) return colors.dim
      return l.kind === 'cross' ? colors.cross : l.kind === 'leaf' ? colors.leaf : colors.tree
    },
    [colors, focusId],
  )

  return (
    <ForceGraph2D<KNode, KLink>
      ref={fgRef}
      graphData={data as unknown as { nodes: GNode[]; links: GLink[] }}
      width={width}
      height={height}
      backgroundColor={colors.bg}
      nodeId="id"
      nodeRelSize={1}
      nodeVal={(n) => n.r * n.r}
      nodeLabel={() => ''}
      nodeCanvasObject={drawNode}
      nodePointerAreaPaint={paintArea}
      linkColor={linkColor}
      linkWidth={(l) => (l.kind === 'cross' ? 0.6 : l.kind === 'leaf' ? 0.5 : 0.8)}
      linkLineDash={(l) => (l.kind === 'cross' ? [3, 2.5] : null)}
      cooldownTicks={reducedMotion ? 0 : 220}
      warmupTicks={reducedMotion ? 220 : 40}
      d3VelocityDecay={0.32}
      minZoom={0.3}
      maxZoom={9}
      onEngineStop={() => {
        if (fitted.current) return
        fitted.current = true
        fgRef.current?.zoomToFit(reducedMotion ? 0 : 500, 36)
      }}
      onNodeHover={(n) => setHoverId(n ? String(n.id) : null)}
      onNodeClick={(n) => {
        onSelect(n as KNode)
        if (n.x !== undefined && n.y !== undefined) fgRef.current?.centerAt(n.x, n.y, reducedMotion ? 0 : 500)
      }}
      onBackgroundClick={() => onSelect(null)}
    />
  )
}
