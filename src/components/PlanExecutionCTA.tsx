import React from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { 
  Play, 
  Bot, 
  Clock, 
  Target, 
  ArrowRight,
  Zap,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import type { ProjectPlan, ProjectTask } from '../types/schema'

interface PlanExecutionCTAProps {
  plan: ProjectPlan
  nextTasks: ProjectTask[]
  progress: {
    overall: number
    phases: { [phaseId: string]: number }
    milestones: { completed: number; total: number }
  }
  onStartDevelopmentSession?: () => void
  onExecuteNextTask?: () => void
  onReviewPlan?: () => void
}

export function PlanExecutionCTA({ 
  plan, 
  nextTasks, 
  progress, 
  onStartDevelopmentSession,
  onExecuteNextTask,
  onReviewPlan 
}: PlanExecutionCTAProps) {
  const isJustGenerated = plan.status === 'draft'
  const hasAvailableTasks = nextTasks.length > 0
  const isNearComplete = progress.overall > 80

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              {isJustGenerated ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Plan Generated Successfully!
                </>
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  Ready for Development
                </>
              )}
            </CardTitle>
            <CardDescription className="text-blue-700">
              {isJustGenerated 
                ? "Your comprehensive project plan is ready. Choose how to proceed:"
                : `${progress.overall.toFixed(0)}% complete • ${nextTasks.length} tasks available`
              }
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
            {plan.phases.reduce((total, phase) => total + phase.tasks.length, 0)} total tasks
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary CTAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hasAvailableTasks && (
            <Button 
              onClick={onStartDevelopmentSession}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-12"
            >
              <Bot className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Start AI Development Session</div>
                <div className="text-xs opacity-90">Let the agent work on multiple tasks</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
          
          {hasAvailableTasks && (
            <Button 
              onClick={onExecuteNextTask}
              variant="outline"
              className="flex items-center gap-2 border-blue-300 hover:bg-blue-50 h-12"
            >
              <Play className="h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">Execute Next Task</div>
                <div className="text-xs text-gray-600">Work on one task at a time</div>
              </div>
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onReviewPlan}
            variant="ghost" 
            size="sm"
            className="flex items-center gap-2 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
          >
            <RefreshCw className="h-3 w-3" />
            Review & Iterate Plan
          </Button>
          
          {!hasAvailableTasks && !isNearComplete && (
            <Badge variant="outline" className="text-orange-700 border-orange-300 bg-orange-50">
              <Clock className="h-3 w-3 mr-1" />
              Waiting for dependencies
            </Badge>
          )}
          
          {isNearComplete && (
            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Almost complete!
            </Badge>
          )}
        </div>

        {/* Quick Stats */}
        {hasAvailableTasks && (
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Next Available Tasks:</h4>
            <div className="space-y-1">
              {nextTasks.slice(0, 3).map((task, index) => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      task.priority === 'high' || task.priority === 'critical' 
                        ? 'border-red-300 text-red-700' 
                        : 'border-gray-300'
                    }`}
                  >
                    {task.priority}
                  </Badge>
                  <span className="font-medium">{task.title}</span>
                  <span className="text-gray-500">({task.estimatedHours}h)</span>
                </div>
              ))}
              {nextTasks.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{nextTasks.length - 3} more tasks available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Insight */}
        {isJustGenerated && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-xs">
                <p className="font-medium text-green-900 mb-1">🎯 Plan Analysis Complete</p>
                <p className="text-green-800">
                  Generated {plan.phases.length} phases, {plan.milestones.length} milestones, 
                  and {plan.phases.reduce((total, phase) => total + phase.tasks.length, 0)} actionable tasks. 
                  The agent can start working immediately on {nextTasks.length} available tasks.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 