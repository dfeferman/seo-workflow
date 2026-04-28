import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface HubNodeData {
  label: string
  status: PageStatus
  dimmed?: boolean
  searchMatch?: boolean
}

export function HubNode({ data }: { data: HubNodeData }) {
  const isDashed = data.status === 'planned'
  const dimmed = data.dimmed === true
  const match = data.searchMatch === true

  return (
    <div className={`flex flex-col items-center transition-opacity ${dimmed ? 'opacity-35' : ''}`}>
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div
        className={[
          'rounded-full bg-blue-100 border-2 border-blue-500',
          isDashed ? 'border-dashed' : '',
          match ? 'ring-4 ring-amber-400 ring-offset-2' : '',
        ].join(' ')}
        style={{ width: 60, height: 60 }}
      />
      <div className="mt-2 max-w-28 text-center text-xs font-semibold leading-tight text-slate-700">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  )
}
