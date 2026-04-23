import { Handle, Position } from '@xyflow/react'
import type { PageStatus } from '@/types/database.types'

interface HubNodeData {
  label: string
  status: PageStatus
}

export function HubNode({ data }: { data: HubNodeData }) {
  const isDashed = data.status === 'planned'

  return (
    <div className="flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div
        className={[
          'rounded-full bg-blue-100 border-2 border-blue-500',
          isDashed ? 'border-dashed' : '',
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
