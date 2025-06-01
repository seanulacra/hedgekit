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

export class AgentOrchestrator {
  private providers: Map<AgentProvider, IAgentProvider> = new Map()
  private currentProvider: AgentProvider = 'claude-sonnet-4'

  constructor() {
    this.initializeProviders()
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

    // Forward the request to the specific provider
    return await provider.chatWithAgent(request, updateProject, uiActions)
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
      if (response.success && response.toolCalls.length === 0) {
        break
      }

      // Continue the conversation with tool results
      if (response.toolCalls.length > 0) {
        const toolSummary = response.toolCalls
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