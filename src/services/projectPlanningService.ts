import Anthropic from '@anthropic-ai/sdk'
import type { ProjectPlan, ProjectSchema, TechnicalStack, ProjectPhase, Milestone, DesignSystemSpec, ComponentArchitecture } from '../types/schema'

export interface ProjectPlanRequest {
  projectName: string
  projectDescription: string
  requirements?: {
    businessGoals: string
    targetAudience: string
    keyProblems: string
    successMetrics?: string
    constraints?: string
  }
  targetUsers: string[]
  coreFeatures: string[]
  preferences?: {
    framework?: 'react' | 'vue' | 'svelte'
    styling?: 'tailwind' | 'styled-components' | 'emotion'
    complexity?: 'simple' | 'moderate' | 'complex'
    timeline?: 'quick' | 'standard' | 'thorough'
  }
}

export class ProjectPlanningService {
  private static getAnthropic(): Anthropic {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not configured')
    }
    
    return new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }
  
  static async generateProjectPlan(request: ProjectPlanRequest): Promise<ProjectPlan> {
    const anthropic = this.getAnthropic()

    const systemPrompt = `You are an expert software architect and project manager. Your task is to create focused, actionable project plans for web applications. 

You should analyze the project requirements and create a streamlined plan that includes:
1. Technical architecture and stack recommendations
2. 3-4 key development phases (no more) with realistic timelines
3. Component architecture and design system specifications
4. 2-3 major milestones (no more) with clear success criteria
5. Task breakdown with dependencies and priorities

Be concise and practical. Focus on the essential phases and milestones rather than overly detailed planning. Keep the plan achievable and not overwhelming.`

    const userPrompt = `Create a focused and streamlined project plan for the following project:

**Project Details:**
- Name: ${request.projectName}
- Description: ${request.projectDescription}
- Target Users: ${request.targetUsers.join(', ')}
- Core Features: ${request.coreFeatures.join(', ')}

${request.requirements ? `**Requirements Analysis:**
- Business Goals: ${request.requirements.businessGoals}
- Target Audience: ${request.requirements.targetAudience}
- Key Problems: ${request.requirements.keyProblems}
${request.requirements.successMetrics ? `- Success Metrics: ${request.requirements.successMetrics}` : ''}
${request.requirements.constraints ? `- Constraints: ${request.requirements.constraints}` : ''}
` : ''}

**Preferences:**
${request.preferences ? Object.entries(request.preferences).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'No specific preferences'}

Please provide a detailed JSON response following this exact structure:
{
  "title": "Comprehensive title for the project plan",
  "overview": "Detailed project overview (2-3 paragraphs)",
  "targetUsers": ["array", "of", "user", "types"],
  "coreFeatures": ["array", "of", "core", "features"],
  "technicalStack": {
    "frontend": {
      "framework": "react",
      "styling": "tailwind",
      "stateManagement": "zustand",
      "routing": "react-router",
      "testing": "vitest"
    },
    "deployment": {
      "hosting": "vercel",
      "cicd": "github-actions"
    },
    "dependencies": {
      "dependency-name": "version"
    }
  },
  "phases": [
    {
      "name": "Phase name",
      "description": "Phase description",
      "duration": "2 weeks",
      "order": 1,
      "tasks": [
        {
          "title": "Task title",
          "description": "Task description",
          "type": "component",
          "estimatedHours": 8,
          "priority": "high",
          "assignee": "agent",
          "dependencies": [],
          "acceptanceCriteria": ["criteria1", "criteria2"]
        }
      ],
      "deliverables": ["deliverable1", "deliverable2"],
      "prerequisites": ["prerequisite1"]
    }
  ],
  "milestones": [
    {
      "name": "Milestone name",
      "description": "Milestone description",
      "targetDate": "2024-02-15",
      "achievements": ["achievement1", "achievement2"],
      "success_criteria": ["criteria1", "criteria2"]
    }
  ],
  "designSystem": {
    "colorPalette": {
      "primary": ["#3B82F6", "#1D4ED8", "#1E40AF"],
      "secondary": ["#6B7280", "#4B5563", "#374151"],
      "neutral": ["#F9FAFB", "#F3F4F6", "#E5E7EB"],
      "semantic": {
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#3B82F6"
      }
    },
    "typography": {
      "fontFamilies": ["Inter", "system-ui", "sans-serif"],
      "scales": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem"
      }
    },
    "spacing": {
      "unit": 4,
      "scale": [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
    },
    "components": {
      "baseComponents": ["Button", "Input", "Card", "Modal"],
      "patterns": ["Navigation", "Forms", "DataDisplay"],
      "layouts": ["Grid", "Flex", "Container"]
    }
  },
  "componentArchitecture": {
    "patterns": {
      "stateManagement": "global-store",
      "componentComposition": "atomic",
      "dataFlow": "unidirectional"
    },
    "structure": {
      "directories": ["components", "pages", "hooks", "utils", "services"],
      "namingConventions": {
        "components": "PascalCase",
        "files": "kebab-case",
        "props": "camelCase"
      },
      "importStrategy": "absolute"
    },
    "componentHierarchy": [
      {
        "name": "App",
        "type": "layout",
        "description": "Root application component",
        "children": [],
        "props": [],
        "responsibilities": ["Routing", "Global state"],
        "dependencies": []
      }
    ]
  }
}

Make the plan realistic and achievable. Keep it focused with 3-4 phases maximum and 2-3 major milestones. Include proper task dependencies and realistic time estimates, but avoid overwhelming detail.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      // Extract text content from response
      let textContent = ''
      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text
        }
      }
      
      if (!textContent) {
        throw new Error('No text content received from Anthropic')
      }

      const planData = JSON.parse(textContent)

      // Generate IDs and timestamps for the plan
      const projectPlan: ProjectPlan = {
        id: `plan-${Date.now()}`,
        projectId: '', // Will be set when attached to project
        ...planData,
        phases: planData.phases.map((phase: any, index: number) => ({
          id: `phase-${Date.now()}-${index}`,
          ...phase,
          status: 'not-started' as const,
          tasks: phase.tasks.map((task: any, taskIndex: number) => ({
            id: `task-${Date.now()}-${index}-${taskIndex}`,
            ...task,
            status: 'todo' as const
          }))
        })),
        milestones: planData.milestones.map((milestone: any, index: number) => ({
          id: `milestone-${Date.now()}-${index}`,
          ...milestone,
          status: 'upcoming' as const
        })),
        generatedBy: 'claude-3-5-sonnet' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft' as const
      }

      return projectPlan
    } catch (error) {
      console.error('Error generating project plan:', error)
      throw new Error(`Failed to generate project plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  static async updateTaskStatus(
    plan: ProjectPlan, 
    taskId: string, 
    status: 'todo' | 'in-progress' | 'review' | 'done',
    agentNotes?: string
  ): Promise<ProjectPlan> {
    const updatedPhases = plan.phases.map(phase => ({
      ...phase,
      tasks: phase.tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status, 
              agentNotes: agentNotes || task.agentNotes,
              completedAt: status === 'done' ? new Date().toISOString() : task.completedAt
            }
          : task
      )
    }))

    return {
      ...plan,
      phases: updatedPhases,
      updatedAt: new Date().toISOString()
    }
  }

  static async updateMilestoneStatus(
    plan: ProjectPlan,
    milestoneId: string,
    status: 'upcoming' | 'in-progress' | 'completed' | 'missed'
  ): Promise<ProjectPlan> {
    const updatedMilestones = plan.milestones.map(milestone =>
      milestone.id === milestoneId
        ? {
            ...milestone,
            status,
            completedAt: status === 'completed' ? new Date().toISOString() : milestone.completedAt
          }
        : milestone
    )

    return {
      ...plan,
      milestones: updatedMilestones,
      updatedAt: new Date().toISOString()
    }
  }

  static getNextTasks(plan: ProjectPlan, limit: number = 5): typeof plan.phases[0]['tasks'] {
    const allTasks = plan.phases.flatMap(phase => phase.tasks)
    const availableTasks = allTasks.filter(task => {
      // Task is not done and all dependencies are completed
      if (task.status === 'done') return false
      
      return task.dependencies.every(depId => {
        const depTask = allTasks.find(t => t.id === depId)
        return depTask?.status === 'done'
      })
    })

    // Sort by priority and estimated hours
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return availableTasks
      .sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return a.estimatedHours - b.estimatedHours // Prefer smaller tasks when priority is equal
      })
      .slice(0, limit)
  }

  static getProjectProgress(plan: ProjectPlan): {
    overall: number
    phases: { [phaseId: string]: number }
    milestones: { completed: number; total: number }
  } {
    const allTasks = plan.phases.flatMap(phase => phase.tasks)
    const completedTasks = allTasks.filter(task => task.status === 'done')
    const overall = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0

    const phases: { [phaseId: string]: number } = {}
    plan.phases.forEach(phase => {
      const phaseTasks = phase.tasks
      const phaseCompletedTasks = phaseTasks.filter(task => task.status === 'done')
      phases[phase.id] = phaseTasks.length > 0 ? (phaseCompletedTasks.length / phaseTasks.length) * 100 : 0
    })

    const completedMilestones = plan.milestones.filter(m => m.status === 'completed').length
    const milestones = { completed: completedMilestones, total: plan.milestones.length }

    return { overall, phases, milestones }
  }
}