export type AgentProvider = 'openai' | 'claude-sonnet-4' | 'claude-opus-4'

export interface ToolCall {
  id: string
  function: string
  args: any
  result: any
}

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  toolResults?: any[]
}

export interface AgentChatRequest {
  message: string
  project: any // ProjectSchema
  conversationHistory: AgentMessage[]
  provider?: AgentProvider
}

export interface AgentChatResponse {
  message: string
  toolCalls: ToolCall[]
  success: boolean
  error?: string
  provider: AgentProvider
}

export interface IAgentProvider {
  name: AgentProvider
  displayName: string
  description: string
  readonly capabilities: string[]
  
  isAvailable(): boolean
  chatWithAgent(
    request: AgentChatRequest,
    updateProject: (updater: (prev: any) => any) => void,
    uiActions?: import('../services/agentTools').UIActions
  ): Promise<AgentChatResponse>
}

export interface AgentTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
}