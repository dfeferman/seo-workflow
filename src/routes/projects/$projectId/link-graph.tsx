import { createFileRoute } from '@tanstack/react-router'
import { LinkGraphView } from '@/components/link-graph/LinkGraphView'
import { useProject } from '@/hooks/useProject'

export const Route = createFileRoute('/projects/$projectId/link-graph')({
  component: LinkGraphPage,
})

function LinkGraphPage() {
  const { projectId } = Route.useParams()
  const { data: project } = useProject(projectId)

  return <LinkGraphView projectId={projectId} projectName={project?.name ?? '...'} />
}
