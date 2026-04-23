import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'

const NODE_SIZE: Record<string, number> = {
  hub: 60,
  spoke: 50,
  blog: 50,
}

export function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return nodes

  const graph = new dagre.graphlib.Graph()
  graph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 })
  graph.setDefaultEdgeLabel(() => ({}))

  for (const node of nodes) {
    const size = NODE_SIZE[node.type ?? 'spoke'] ?? 50
    graph.setNode(node.id, { width: size, height: size })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const size = NODE_SIZE[node.type ?? 'spoke'] ?? 50
    const pos = graph.node(node.id)
    return {
      ...node,
      position: {
        x: pos.x - size / 2,
        y: pos.y - size / 2,
      },
    }
  })
}
