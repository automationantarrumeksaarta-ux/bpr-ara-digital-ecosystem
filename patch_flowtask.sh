#!/bin/bash
# Rename FlowTask to FlowTaskLegacy in types/index.ts
sed -i '' 's/export interface FlowTask {/export interface FlowTaskLegacy {/g' src/types/index.ts

# AppContext imports
sed -i '' 's/FlowTask,/FlowTaskLegacy, TaskItem,/g' src/context/AppContext.tsx
sed -i '' 's/INITIAL_FLOW_TASKS/INITIAL_TASKS/g' src/context/AppContext.tsx
sed -i '' "s/from '\.\.\/mock\/initialData';/from '..\/mock\/initialData';\nimport { INITIAL_TASKS } from '..\/data\/initialData';/g" src/context/AppContext.tsx

# State
sed -i '' 's/useState<FlowTask\[\]>(INITIAL_TASKS)/useState<TaskItem\[\]>(INITIAL_TASKS)/g' src/context/AppContext.tsx
sed -i '' 's/flowTasks: FlowTask\[\];/flowTasks: TaskItem\[\];/g' src/context/AppContext.tsx

# AppContext Context Type
sed -i '' 's/createFlowTask: (taskData: Partial<FlowTask>) => void;/createFlowTask: (taskData: Partial<FlowTaskLegacy>) => void;/g' src/context/AppContext.tsx
sed -i '' "s/updateTaskStatus: (taskId: string, status: FlowTask\['status'\], progress?: number, evidenceNote?: string) => void;/updateTaskStatus: (taskId: string, status: any, progress?: number, evidenceNote?: string) => void;/g" src/context/AppContext.tsx

