import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
// Simple progress component inline
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { 
  CheckCircle, 
  Clock, 
  Target, 
  Users, 
  Code, 
  Palette, 
  Layers,
  ArrowRight,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import type { ProjectPlan, ProjectPhase, ProjectTask, Milestone } from '../types/schema'

interface ProjectPlanViewProps {
  plan: ProjectPlan
  progress: {
    overall: number
    phases: { [phaseId: string]: number }
    milestones: { completed: number; total: number }
  }
  nextTasks: ProjectTask[]
  onUpdateTaskStatus?: (taskId: string, status: ProjectTask['status'], notes?: string) => void
}

export function ProjectPlanView({ plan, progress, nextTasks, onUpdateTaskStatus }: ProjectPlanViewProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)
  const [taskNotes, setTaskNotes] = useState<{ [taskId: string]: string }>({})

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'upcoming':
      case 'todo':
        return <Target className="h-4 w-4 text-gray-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'upcoming':
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'blocked':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTaskStatusUpdate = (taskId: string, newStatus: ProjectTask['status']) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, newStatus, taskNotes[taskId])
      setTaskNotes(prev => ({ ...prev, [taskId]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {plan.title}
          </CardTitle>
          <CardDescription>{plan.overview}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{progress.overall.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress.overall}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Milestones</span>
                <span className="font-medium">{progress.milestones.completed}/{progress.milestones.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${(progress.milestones.completed / progress.milestones.total) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
              </div>
            </div>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Users
              </h4>
              <div className="flex flex-wrap gap-1">
                {plan.targetUsers.map((user, index) => (
                  <Badge key={index} variant="outline" className="text-xs">{user}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Code className="h-4 w-4" />
                Tech Stack
              </h4>
              <div className="text-sm text-gray-600">
                {plan.technicalStack.frontend.framework} + {plan.technicalStack.frontend.styling}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="next-tasks">Next Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-4">
          {plan.phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader className="cursor-pointer" onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getStatusIcon(phase.status)}
                    Phase {phase.order}: {phase.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(phase.status)}>{phase.status}</Badge>
                    <span className="text-sm text-gray-500">{progress.phases[phase.id]?.toFixed(1) || 0}%</span>
                    <ArrowRight className={`h-4 w-4 transition-transform ${expandedPhase === phase.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <CardDescription>{phase.description}</CardDescription>
              </CardHeader>

              {expandedPhase === phase.id && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Duration</h5>
                      <p className="text-sm text-gray-600">{phase.duration}</p>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Deliverables</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {phase.deliverables.map((deliverable, index) => (
                          <li key={index}>• {deliverable}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div>
                    <h5 className="font-medium mb-3">Tasks ({phase.tasks.length})</h5>
                    <div className="space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(task.status)}
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className="text-xs">{task.type}</Badge>
                              <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{task.estimatedHours}h</span>
                              {onUpdateTaskStatus && (
                                <select
                                  value={task.status}
                                  onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value as ProjectTask['status'])}
                                  className="text-xs border rounded px-2 py-1"
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="review">Review</option>
                                  <option value="done">Done</option>
                                </select>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{task.description}</p>
                          {task.acceptanceCriteria.length > 0 && (
                            <div>
                              <span className="text-xs font-medium">Acceptance Criteria:</span>
                              <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                {task.acceptanceCriteria.map((criteria, index) => (
                                  <li key={index}>• {criteria}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Next Tasks Tab */}
        <TabsContent value="next-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Tasks ({nextTasks.length})
              </CardTitle>
              <CardDescription>Tasks ready to be worked on (no pending dependencies)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No tasks available. All current tasks may have dependencies.</p>
              ) : (
                nextTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.title}</span>
                        <Badge variant="outline" className="text-xs">{task.type}</Badge>
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{task.estimatedHours}h</span>
                        {onUpdateTaskStatus && (
                          <Button
                            size="sm"
                            onClick={() => handleTaskStatusUpdate(task.id, 'in-progress')}
                            disabled={task.status !== 'todo'}
                          >
                            Start Task
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    {task.acceptanceCriteria.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Success Criteria:</span>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          {task.acceptanceCriteria.map((criteria, index) => (
                            <li key={index}>• {criteria}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          {plan.milestones.map((milestone) => (
            <Card key={milestone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(milestone.status)}
                    {milestone.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {milestone.targetDate}
                    </div>
                  </div>
                </div>
                <CardDescription>{milestone.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Achievements</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {milestone.achievements.map((achievement, index) => (
                        <li key={index}>• {achievement}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Success Criteria</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {milestone.success_criteria.map((criteria, index) => (
                        <li key={index}>• {criteria}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technical Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h5 className="font-medium">Frontend</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Framework: {plan.technicalStack.frontend.framework}</li>
                    <li>Styling: {plan.technicalStack.frontend.styling}</li>
                    {plan.technicalStack.frontend.stateManagement && <li>State: {plan.technicalStack.frontend.stateManagement}</li>}
                    {plan.technicalStack.frontend.routing && <li>Routing: {plan.technicalStack.frontend.routing}</li>}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">Deployment</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Hosting: {plan.technicalStack.deployment.hosting}</li>
                    {plan.technicalStack.deployment.cicd && <li>CI/CD: {plan.technicalStack.deployment.cicd}</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Design System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Design System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h5 className="font-medium mb-2">Color Palette</h5>
                  <div className="flex gap-2">
                    {plan.designSystem.colorPalette.primary.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium">Typography</h5>
                  <p className="text-sm text-gray-600">
                    {plan.designSystem.typography.fontFamilies.join(', ')}
                  </p>
                </div>
                <div>
                  <h5 className="font-medium">Components</h5>
                  <div className="flex flex-wrap gap-1">
                    {plan.designSystem.components.baseComponents.map((comp, index) => (
                      <Badge key={index} variant="outline" className="text-xs">{comp}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Component Architecture */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Component Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h5 className="font-medium">Patterns</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>State: {plan.componentArchitecture.patterns.stateManagement}</li>
                    <li>Composition: {plan.componentArchitecture.patterns.componentComposition}</li>
                    <li>Data Flow: {plan.componentArchitecture.patterns.dataFlow}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">Structure</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.componentArchitecture.structure.directories.map((dir, index) => (
                      <li key={index}>/{dir}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">Conventions</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Components: {plan.componentArchitecture.structure.namingConventions.components}</li>
                    <li>Files: {plan.componentArchitecture.structure.namingConventions.files}</li>
                    <li>Props: {plan.componentArchitecture.structure.namingConventions.props}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}