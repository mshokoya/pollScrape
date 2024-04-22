import { useObserve } from '@legendapp/state/react'
import { taskQueue } from '@renderer/core/state/taskQueue'
import { useCallback } from 'react'
import ReactFlow, {
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
  Controls,
  useUpdateNodeInternals
} from 'reactflow'
import 'reactflow/dist/style.css'
import { STQTask, STaskQueue, TQTask, TaskQueue } from 'src/shared'
import dagre from 'dagre'
import { initialEdges, initialNodes } from '@renderer/core/state'
import { scrapeTaskQueue } from '@renderer/core/state/scrapeQueue'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 172
const nodeHeight = 36

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? 'left' : 'top'
    node.sourcePosition = isHorizontal ? 'right' : 'bottom'

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2
    }

    // const l = nodes.find((t) => t.id === 'q')
    // if (l) {
    //   // l.type = 'group'
    // }

    return node
  })

  return { nodes, edges }
}

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
)

const addNodes = (tq: TaskQueue | STaskQueue) => {
  const nodes: any[] = []
  const edges: any[] = []
  for (const tqType in tq) {
    tq[tqType].forEach((task: TQTask) => {
      const type = task.taskType === 'enqueue' ? 'q' : task.taskType === 'processing' ? 'p' : 't'

      nodes.push({
        id: task.taskID,
        position: { x: 10, y: 10 },
        extent: 'parent',
        data: { label: task.taskGroup },
        className: 'light',
        parentId: type
      })
    })
  }

  return [nodes, edges]
}

export const Diagram = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  )

  useObserve(() => {
    const [newTNodes, newTEdges] = addNodes(taskQueue.get())
    const [newSNodes, newSEdges] = addNodes(scrapeTaskQueue.get())
    const nodes = [...initialNodes, ...newTNodes, ...newSNodes]

    const edges = [...initialEdges, ...newTEdges, ...newSEdges]

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  })

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      className="bg-white"
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  )
}
