import { observer, useObservable, useObserve } from '@legendapp/state/react'
import { taskQueue } from '@renderer/core/state/taskQueue'
import { useCallback } from 'react'
import ReactFlow, { addEdge, Background, useNodesState, useEdgesState, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { STaskQueue, StopType, TQTask, TaskQueue } from 'src/shared'
import dagre from 'dagre'
import { initialEdges, initialNodes } from '@renderer/core/state'
import { scrapeTaskQueue } from '@renderer/core/state/scrapeQueue'
import { Box, Button, CheckboxGroup, DropdownMenu, Flex, Text } from '@radix-ui/themes'
import { CHANNELS } from '../../../../shared/util'
import { forkState$ } from '@renderer/core/state/fork'
import { ObservableObject, batch } from '@legendapp/state'

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

export const Diagram = observer(() => {
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)
  const checked = useObservable({
    force: [],
    waitAll: [],
    waitPs: []
  })

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    []
  )

  useObserve(() => {
    const [newTNodes, newTEdges] = addNodes(taskQueue.get())
    const [newSNodes, newSEdges] = addNodes(scrapeTaskQueue.get())
    const nnodes = [...newTNodes, ...newSNodes]
    const eedges = [...newTEdges, ...newSEdges]

    setNodes([...nodes, ...nnodes])
    setEdges([...edges, ...eedges])
  })

  const handleStartFork = () => {
    if (forkState$.createInProcess.get()) return
    window['fork'][CHANNELS.fork_create]()
    forkState$.createInProcess.set((c) => c + 1)
    // keep track
  }

  const handleStopFork = (stopType: StopType) => {
    if (forkState$.stopInProcess.get().length) return
    const forkIDs = checked[stopType].get()
    window['fork'][CHANNELS.fork_stop]({
      forkIDs,
      stopType
    })
    batch(() => {
      for (const id of forkIDs) {
        forkState$.stopInProcess.push([id, stopType])
      }
    })
    checked[stopType].set([])
  }

  return (
    <Flex>
      <Flex direction="column">
        <Button
          className={`${forkState$.createInProcess.get() ? 'fieldBlink' : ''}`}
          // disabled={!!forkState$.createInProcess.get()}
          onClick={() => {
            console.log(forkState$.get())
          }}
        >
          <Text>log fork state </Text>
        </Button>

        <Button
          className={`${forkState$.createInProcess.get() ? 'fieldBlink' : ''}`}
          disabled={!!forkState$.createInProcess.get()}
          onClick={() => {
            handleStartFork()
          }}
        >
          <Text>Start fork</Text>
        </Button>

        <StopForkDropDown handleStopFork={handleStopFork} checked={checked} />
      </Flex>
      <Box className="w-[25rem] h-[15rem]">
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
      </Box>
    </Flex>
  )
})

type StopForkDropDownProps = {
  handleStopFork: (stopType: StopType) => void
  checked: ObservableObject<{
    force: string[]
    waitAll: string[]
    waitPs: string[]
  }>
}

const StopForkDropDown = ({ handleStopFork, checked }: StopForkDropDownProps) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={!!forkState$.stopInProcess.get().length}>
        <Button variant="soft">
          Stop fork
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Force Stop</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <CheckboxGroup.Root
              value={checked.force.get()}
              onValueChange={(e) => checked.force.set(e)}
            >
              {forkState$.get().forks.map((f, idx) => (
                <CheckboxGroup.Item value={f} key={idx}>
                  {f}
                </CheckboxGroup.Item>
              ))}
            </CheckboxGroup.Root>
            <Button onClick={() => handleStopFork('force')}>Execute</Button>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            Wait for tasks currently running to finish
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <CheckboxGroup.Root
              value={checked.waitPs.get()}
              onValueChange={(e) => checked.waitPs.set(e)}
            >
              {forkState$.get().forks.map((f, idx) => (
                <CheckboxGroup.Item value={f} key={idx}>
                  {f}
                </CheckboxGroup.Item>
              ))}
            </CheckboxGroup.Root>
            <Button onClick={() => handleStopFork('waitPs')}>Execute</Button>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Wait for all tasks to finish</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <CheckboxGroup.Root
              value={checked.waitAll.get()}
              onValueChange={(e) => checked.waitAll.set(e)}
            >
              {forkState$.get().forks.map((f, idx) => (
                <CheckboxGroup.Item value={f} key={idx}>
                  {f}
                </CheckboxGroup.Item>
              ))}
            </CheckboxGroup.Root>
            <Button onClick={() => handleStopFork('waitAll')}>Execute</Button>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
