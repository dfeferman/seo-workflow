import { useEffect, useRef } from 'react'
import { useReactFlow } from '@xyflow/react'

type Props = {
  /** Bei Änderung (inkl. nonce) wird auf diese Knoten gezoomt. */
  request: { nodeIds: string[]; nonce: number } | null
}

export function LinkGraphFitView({ request }: Props) {
  const { fitView } = useReactFlow()
  const lastNonce = useRef<number | null>(null)

  useEffect(() => {
    if (!request || request.nodeIds.length === 0) {
      lastNonce.current = null
      return
    }
    if (lastNonce.current === request.nonce) return
    lastNonce.current = request.nonce
    const t = window.setTimeout(() => {
      fitView({
        nodes: request.nodeIds.map((id) => ({ id })),
        padding: 0.35,
        duration: 450,
      })
    }, 50)
    return () => window.clearTimeout(t)
  }, [request, fitView])

  return null
}
