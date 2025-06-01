import Anthropic from '@anthropic-ai/sdk'
import { agentTools, AgentToolExecutor } from '../agentTools'
import type { 
  IAgentProvider, 
  AgentProvider, 
  AgentChatRequest, 
  AgentChatResponse,
  AgentTool 
} from '../../types/agent'
import type { ProjectSchema } from '../../types/schema'

export class ClaudeAgentProvider implements IAgentProvider {
  name: AgentProvider = 'claude-sonnet-4'
  displayName = 'Claude Sonnet 4'
  description = 'Latest Claude Sonnet 4 model with state-of-the-art reasoning and tool use'
  readonly capabilities = [
    'Advanced reasoning',
    'Complex tool orchestration', 
    'Code generation',
    'UI/UX expertise',
    'Multi-step planning',
    'Superior context understanding'
  ]

  private anthropic: Anthropic

  constructor(provider: AgentProvider = 'claude-sonnet-4') {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY environment variable.')
    }

    this.name = provider
    this.anthropic = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  isAvailable(): boolean {
    return !!import.meta.env.VITE_ANTHROPIC_API_KEY
  }

  private convertToolsToClaude(tools: AgentTool[]): Anthropic.Tool[] {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: {
        type: 'object' as const,
        properties: tool.function.parameters.properties,
        required: tool.function.parameters.required
      }
    }))
  }

  private getModelName(): string {
    switch (this.name) {
      case 'claude-opus-4':
        return 'claude-4-opus-20250514'
      case 'claude-sonnet-4':
      default:
        return 'claude-sonnet-4-20250514'
    }
  }

  async chatWithAgent(
    request: AgentChatRequest,
    updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    uiActions?: import('../agentTools').UIActions
  ): Promise<AgentChatResponse> {
    try {
      const toolExecutor = new AgentToolExecutor(request.project, updateProject, uiActions)
      
      // Build conversation history for Claude
      const messages: Anthropic.MessageParam[] = [
        ...request.conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: request.message
        }
      ]

      // Convert tools to Claude format
      const claudeTools = this.convertToolsToClaude(agentTools as AgentTool[])

      // Call Claude with tool definitions
      const response = await this.anthropic.messages.create({
        model: this.getModelName(),
        max_tokens: 4096,
        system: this.getSystemPrompt(request.project),
        messages,
        tools: claudeTools,
        temperature: 0.7
      })

      const content = response.content
      let textContent = ''
      const toolUses: any[] = []

      // Parse Claude's response content
      for (const block of content) {
        if (block.type === 'text') {
          textContent += block.text
        } else if (block.type === 'tool_use') {
          toolUses.push(block)
        }
      }

      // Execute any tool calls
      const toolResults = []
      for (const toolUse of toolUses) {
        try {
          const result = await toolExecutor.executeFunction(
            toolUse.name,
            toolUse.input
          )
          
          toolResults.push({
            id: toolUse.id,
            function: toolUse.name,
            args: toolUse.input,
            result
          })
        } catch (error) {
          toolResults.push({
            id: toolUse.id,
            function: toolUse.name,
            args: toolUse.input,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Tool execution failed'
            }
          })
        }
      }

      // If tools were called, get a follow-up response
      let finalMessage = textContent
      
      if (toolUses.length > 0) {
        // Add tool results to conversation and get final response
        const followUpMessages: Anthropic.MessageParam[] = [
          ...messages,
          {
            role: 'assistant',
            content: response.content
          },
          {
            role: 'user',
            content: toolResults.map(result => ({
              type: 'tool_result' as const,
              tool_use_id: result.id,
              content: JSON.stringify(result.result)
            }))
          }
        ]

        const followUpResponse = await this.anthropic.messages.create({
          model: this.getModelName(),
          max_tokens: 4096,
          system: this.getSystemPrompt(request.project),
          messages: followUpMessages,
          temperature: 0.7
        })

        // Extract text from follow-up response
        for (const block of followUpResponse.content) {
          if (block.type === 'text') {
            finalMessage = block.text
            break
          }
        }
      }

      return {
        message: finalMessage,
        toolCalls: toolResults,
        success: true,
        provider: this.name
      }
    } catch (error) {
      console.error('Claude chat error:', error)
      return {
        message: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        toolCalls: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name
      }
    }
  }

  private getSystemPrompt(project: ProjectSchema): string {
    return `You are an expert UI/UX agent specializing in frontend development. You help users build and improve React applications by analyzing their current project and taking action through available tools.

CURRENT PROJECT CONTEXT:
- Project: "${project.name}"
- Framework: ${project.framework}
- Components: ${project.components.length} (${project.components.map(c => c.name).join(', ') || 'none'})
- Assets: ${project.assets?.length || 0} (${project.assets?.map(a => a.name).join(', ') || 'none'})
- Dependencies: ${Object.keys(project.dependencies || {}).join(', ') || 'standard React'}

YOUR CAPABILITIES:
You have access to the same tools that users can access manually:
1. analyze_project_state - Examine current project structure and components
2. generate_component - Create new React components using OpenAI or v0
3. generate_image_asset - Create images/icons using gpt-image-1 
4. edit_image_asset - Modify existing images with AI
5. get_webcontainer_preview - Check the live preview status

BEHAVIORAL GUIDELINES:
- ONLY use tools when the user wants to BUILD, CREATE, or MODIFY something
- If user says "create", "build", "add", "generate", "make" → use tools
- If user says "what", "how", "why", "explain" → just respond conversationally
- Always analyze the project state first if you need context about existing components
- Be proactive: if user wants to "improve the UI", suggest specific actions AND execute them
- Prefer v0 for complex components, OpenAI for simple ones
- When generating images, use descriptive prompts and appropriate settings
- Explain what you're doing and why
- If something fails, try alternative approaches

RESPONSE STYLE:
- Be conversational and helpful
- Explain your reasoning before taking action
- Summarize what you accomplished after using tools
- Ask clarifying questions if the user's intent is unclear

Remember: You're Claude, an AI assistant by Anthropic. You have excellent reasoning capabilities and can handle complex multi-step tasks effectively!`
  }

  static isAvailable(): boolean {
    return !!import.meta.env.VITE_ANTHROPIC_API_KEY
  }
}

export class ClaudeOpusProvider extends ClaudeAgentProvider {
  constructor() {
    super('claude-opus-4')
    this.name = 'claude-opus-4'
    this.displayName = 'Claude Opus 4'
    this.description = 'Most capable Claude model for ultra-complex reasoning and multi-step tasks'
  }
}