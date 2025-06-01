import type { 
  IAgentProvider, 
  AgentProvider, 
  AgentChatRequest, 
  AgentChatResponse 
} from '../types/agent'
import { OpenAIAgentProvider } from './providers/openaiProvider'
import { ClaudeAgentProvider, ClaudeOpusProvider } from './providers/claudeProvider'
import type { ProjectSchema } from '../types/schema'
import type { UIActions } from './agentTools'
import { agentTools } from './agentTools'

export class AgentOrchestrator {
  private providers: Map<AgentProvider, IAgentProvider> = new Map()
  private currentProvider: AgentProvider = 'claude-sonnet-4'
  
  // Action budget system
  private actionBudget: number = 7  // Optimal range for thoughtful execution
  private actionsBudgetUsed: number = 0
  private sessionStartTime: number = Date.now()

  constructor() {
    this.initializeProviders()
  }

  // Budget management
  getActionBudget(): { total: number, used: number, remaining: number } {
    return {
      total: this.actionBudget,
      used: this.actionsBudgetUsed,
      remaining: this.actionBudget - this.actionsBudgetUsed
    }
  }

  setActionBudget(budget: number) {
    this.actionBudget = budget
  }

  resetActionBudget() {
    this.actionsBudgetUsed = 0
    this.sessionStartTime = Date.now()
  }

  private consumeActionBudget(toolCalls: number): boolean {
    if (this.actionsBudgetUsed + toolCalls > this.actionBudget) {
      return false // Budget exceeded
    }
    this.actionsBudgetUsed += toolCalls
    return true
  }

  private shouldNudgeAboutBudget(): string | null {
    const remaining = this.actionBudget - this.actionsBudgetUsed
    if (remaining <= 2 && remaining > 0) {
      return `⚠️ Action budget low: ${remaining} tools remaining`
    }
    if (remaining <= 0) {
      return `🛑 Action budget exhausted: ${this.actionsBudgetUsed}/${this.actionBudget} tools used`
    }
    return null
  }

  private initializeProviders() {
    // Initialize all available providers
    try {
      if (OpenAIAgentProvider.isAvailable()) {
        this.providers.set('openai', new OpenAIAgentProvider())
      }
    } catch (error) {
      console.warn('OpenAI provider not available:', error)
    }

    try {
      if (ClaudeAgentProvider.isAvailable()) {
        this.providers.set('claude-sonnet-4', new ClaudeAgentProvider())
      }
    } catch (error) {
      console.warn('Claude Sonnet 4 provider not available:', error)
    }

    try {
      if (ClaudeAgentProvider.isAvailable()) {
        this.providers.set('claude-opus-4', new ClaudeOpusProvider())
      }
    } catch (error) {
      console.warn('Claude Opus 4 provider not available:', error)
    }

    // Set default provider to first available
    const availableProviders = Array.from(this.providers.keys())
    if (availableProviders.length > 0) {
      this.currentProvider = availableProviders.includes('claude-sonnet-4') 
        ? 'claude-sonnet-4' 
        : availableProviders[0]
    }
  }

  getAvailableProviders(): Array<{ provider: AgentProvider; info: IAgentProvider }> {
    return Array.from(this.providers.entries()).map(([provider, info]) => ({
      provider,
      info
    }))
  }

  getCurrentProvider(): AgentProvider {
    return this.currentProvider
  }

  setCurrentProvider(provider: AgentProvider): boolean {
    if (this.providers.has(provider)) {
      this.currentProvider = provider
      return true
    }
    return false
  }

  getProviderInfo(provider: AgentProvider): IAgentProvider | undefined {
    return this.providers.get(provider)
  }

  async chatWithAgent(
    request: AgentChatRequest,
    updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    uiActions?: UIActions
  ): Promise<AgentChatResponse> {
    return await this.chatWithWorkflow(request, updateProject, uiActions, request.message)
  }


  private async chatWithWorkflow(
    request: AgentChatRequest,
    updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    uiActions?: UIActions,
    originalUserMessage?: string
  ): Promise<AgentChatResponse> {
    // Use specified provider or default to current
    const targetProvider = request.provider || this.currentProvider
    const provider = this.providers.get(targetProvider)

    if (!provider) {
      return {
        message: `Agent provider "${targetProvider}" is not available. Please check your API keys.`,
        toolCalls: [],
        success: false,
        error: `Provider ${targetProvider} not available`,
        provider: targetProvider
      }
    }

    // Check action budget before proceeding
    const budgetNudge = this.shouldNudgeAboutBudget()
    if (this.actionsBudgetUsed >= this.actionBudget) {
      return {
        message: `${budgetNudge}\n\nSession paused. Use resetActionBudget() to continue or increase budget with setActionBudget().`,
        toolCalls: [],
        success: false,
        error: 'Action budget exhausted',
        provider: targetProvider
      }
    }

    // Capture the updated project state during execution
    let currentProject = request.project
    const captureUpdateProject = (updater: (prev: ProjectSchema) => ProjectSchema) => {
      currentProject = updater(currentProject)
      updateProject(updater)
    }

    // Set the user intent for tool executor workflow decisions
    const toolExecutor = new (await import('./agentTools')).AgentToolExecutor(currentProject, captureUpdateProject, uiActions)
    toolExecutor.setUserIntent(originalUserMessage || request.message)
    
    // Execute the initial request
    const initialResponse = await provider.chatWithAgent(request, captureUpdateProject, uiActions)
    
    // Track action budget consumption
    if (initialResponse.toolCalls) {
      this.consumeActionBudget(initialResponse.toolCalls.length)
    }

    // Check for workflow continuation
    if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0 && initialResponse.success) {
      const lastTool = initialResponse.toolCalls[initialResponse.toolCalls.length - 1]
      const workflowDecision = this.shouldContinueWorkflow(lastTool.function, originalUserMessage || request.message)
      
      if (workflowDecision.shouldContinue && workflowDecision.nextTool) {
        // Check if we have budget for continuation
        if (this.actionsBudgetUsed < this.actionBudget) {
          try {
            // Create continuation request
            const continuationArgs = this.createContinuationArgs(lastTool, workflowDecision.nextTool)
            console.log('Continuation args created:', continuationArgs)
            
            // Create a message that includes the tool call with the continuation args
            const continuationMessage = `Execute ${workflowDecision.nextTool} with: ${JSON.stringify(continuationArgs)}`
            
            const continuationRequest: AgentChatRequest = {
              message: continuationMessage,
              project: currentProject, // Use the updated project state
              conversationHistory: request.conversationHistory || [],
              context: {
                ...request.context,
                workflowContinuation: true,
                previousTool: lastTool.function,
                nextTool: workflowDecision.nextTool,
                continuationArgs,
                forceTool: workflowDecision.nextTool
              },
              provider: targetProvider
            }

            // Recursively continue the workflow
            const continuationResponse = await this.chatWithWorkflow(
              continuationRequest, 
              updateProject, 
              uiActions, 
              originalUserMessage
            )

            // Merge responses
            return {
              message: `${initialResponse.message}\n\n${continuationResponse.message}`,
              toolCalls: [...(initialResponse.toolCalls || []), ...(continuationResponse.toolCalls || [])],
              success: initialResponse.success && continuationResponse.success,
              error: continuationResponse.error || initialResponse.error,
              provider: targetProvider
            }
          } catch (error) {
            // If continuation fails, return the initial response with a note about the failure
            console.warn('Workflow continuation failed:', error)
            return {
              ...initialResponse,
              message: `${initialResponse.message}\n\n⚠️ Workflow continuation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          }
        }
      }
    }

    // Add budget nudge to response if needed
    let finalMessage = initialResponse.message
    if (budgetNudge) {
      finalMessage = `${budgetNudge}\n\n${finalMessage}`
    }

    return {
      ...initialResponse,
      message: finalMessage
    }
  }

  private shouldContinueWorkflow(toolName: string, userMessage: string): { shouldContinue: boolean, nextTool?: string } {
    const tool = agentTools.find(t => t.function.name === toolName)
    const workflow = tool?.workflow?.continueOnSuccess
    
    if (!workflow) return { shouldContinue: false }
    
    // Check continuation condition
    const shouldContinue = this.evaluateWorkflowCondition(workflow.condition || 'always', userMessage)
    
    return {
      shouldContinue,
      nextTool: shouldContinue ? workflow.nextTool : undefined
    }
  }

  private evaluateWorkflowCondition(condition: string, userMessage: string): boolean {
    const lowerMessage = userMessage.toLowerCase()
    
    switch (condition) {
      case 'always':
        return true
      case 'if_component_requested':
        return lowerMessage.includes('component') || 
               lowerMessage.includes('card') ||
               lowerMessage.includes('create') ||
               lowerMessage.includes('build') ||
               lowerMessage.includes('wizard') ||
               lowerMessage.includes('generate') ||
               lowerMessage.includes('iterate')
      case 'if_user_intent_complete':
        return false // TODO: Implement completion detection
      default:
        return false
    }
  }

  private createContinuationArgs(lastTool: any, nextToolName: string): any {
    // Extract relevant information from the last tool execution for the next tool
    console.log('Creating continuation args for:', nextToolName, 'from tool:', lastTool?.function, 'result:', lastTool?.result)
    
    switch (nextToolName) {
      case 'generate_component':
        // Extract CDN URL from generate_image_asset result (now includes CDN URL directly)
        if (lastTool?.function === 'generate_image_asset' && lastTool?.result?.success) {
          const data = lastTool.result.data
          if (data?.cdnUrl) {
            return {
              name: `${data.name || 'Image'}Component`,
              description: `Component featuring the generated image: ${data.name || 'custom image'}`,
              requirements: `Create a React component that displays the image at: ${data.cdnUrl}. Make it visually appealing with proper styling.`
            }
          }
        }
        break
        
      case 'reflect_on_artifact':
        // Reflect on the artifact that was just created
        if (lastTool?.result?.success && lastTool?.result?.data) {
          const data = lastTool.result.data
          
          // Determine artifact type and ID from the last tool
          if (lastTool.function === 'generate_component' && data.component) {
            return {
              artifactType: 'component',
              artifactId: data.component.id,
              aspectsToReview: ['code quality', 'project fit', 'theme alignment', 'reusability']
            }
          } else if (lastTool.function === 'capture_preview_screenshot' && data.componentId) {
            // From screenshot to reflection
            return {
              artifactType: 'component',
              artifactId: data.componentId,
              aspectsToReview: ['visual design', 'aesthetics', 'user experience', 'theme consistency'],
              screenshotData: {
                quality: data.quality,
                dimensions: data.dimensions,
                suggestions: data.suggestions
              }
            }
          } else if (lastTool.function === 'generate_image_asset' && data.assetId) {
            return {
              artifactType: 'image',
              artifactId: data.assetId,
              aspectsToReview: ['style consistency', 'theme alignment', 'visual quality']
            }
          } else if (lastTool.function === 'generate_project_plan' && data.plan) {
            return {
              artifactType: 'plan',
              artifactId: data.plan.id,
              aspectsToReview: ['completeness', 'feasibility', 'scope alignment']
            }
          } else if (lastTool.function === 'execute_task' && data.taskId) {
            return {
              artifactType: 'task',
              artifactId: data.taskId,
              aspectsToReview: ['completion quality', 'acceptance criteria', 'integration']
            }
          }
        }
        break
      
      case 'capture_preview_screenshot':
        // Capture screenshot of the just-created component
        if (lastTool?.function === 'generate_component' && lastTool?.result?.success) {
          const data = lastTool.result.data
          if (data?.component?.id) {
            return {
              componentId: data.component.id,
              captureMode: 'component'
            }
          }
        }
        break
    }
    
    return {}
  }

  isAnyProviderAvailable(): boolean {
    return this.providers.size > 0
  }

  // Agent loop functionality - can switch providers mid-conversation
  async runAgentLoop(
    initialRequest: AgentChatRequest,
    updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    options: {
      maxIterations?: number
      autoSwitchProvider?: boolean
      preferredProviders?: AgentProvider[]
    } = {}
  ): Promise<{
    responses: AgentChatResponse[]
    finalResponse: AgentChatResponse
    iterationsUsed: number
  }> {
    const {
      maxIterations = 5,
      autoSwitchProvider = false,
      preferredProviders = ['claude-sonnet-4', 'claude-opus-4', 'openai']
    } = options

    const responses: AgentChatResponse[] = []
    let currentRequest = initialRequest
    let iteration = 0

    while (iteration < maxIterations) {
      // Auto-switch provider if enabled and previous failed
      if (autoSwitchProvider && responses.length > 0 && !responses[responses.length - 1].success) {
        const nextProvider = preferredProviders.find(p => 
          p !== currentRequest.provider && this.providers.has(p)
        )
        if (nextProvider) {
          currentRequest.provider = nextProvider
        }
      }

      const response = await this.chatWithAgent(currentRequest, updateProject)
      responses.push(response)

      // Break if successful or no more tools to execute
      if (response.success && (response.toolCalls || []).length === 0) {
        break
      }

      // Continue the conversation with tool results
      if ((response.toolCalls || []).length > 0) {
        const toolSummary = (response.toolCalls || [])
          .map(tc => `${tc.function}: ${tc.result.success ? 'success' : 'failed'}`)
          .join(', ')
        
        currentRequest = {
          ...currentRequest,
          message: `Continue with the task. Tools executed: ${toolSummary}`,
          conversationHistory: [
            ...currentRequest.conversationHistory,
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: response.message,
              timestamp: new Date(),
              toolCalls: response.toolCalls
            }
          ]
        }
      }

      iteration++
    }

    const finalResponse = responses[responses.length - 1] || {
      message: 'No response generated',
      toolCalls: [],
      success: false,
      error: 'Agent loop failed to generate response',
      provider: this.currentProvider
    }

    return {
      responses,
      finalResponse,
      iterationsUsed: iteration
    }
  }
}