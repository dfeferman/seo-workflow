import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface SpokeNodeData {
  label: string
  status: PageStatus
  dimmed?: boolean
  searchMatch?: boolean
}

export function SpokeNode({ data }: { data: SpokeNodeData }) {
  const isDashed = data.status === 'planned'
  const dimmed = data.dimmed === true
  const match = data.searchMatch === true

  return (
    <div className={`flex flex-col items-center transition-opacity ${dimmed ? 'opacity-35' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div
        className={[
          'rounded-full bg-green-100 border-2 border-green-500',
          isDashed ? 'border-dashed' : '',
          match ? 'ring-4 ring-amber-400 ring-offset-2' : '',
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
