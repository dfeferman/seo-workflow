import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface SpokeNodeData {
  label: string
  status: PageStatus
}

export function SpokeNode({ data }: { data: SpokeNodeData }) {
  const isDashed = data.status === 'planned'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div
        className={[
          'rounded-full bg-green-100 border-2 border-green-500',
          isDashed ? 'border-dashed' : '',
        ].join(' ')}
        style={{ width: 50, height: 50 }}
      />
      <div className="mt-2 max-w-28 text-center text-xs font-semibold leading-tight text-slate-700">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  )
}
