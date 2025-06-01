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

      // Handle workflow continuation forcing specific tool
      let apiRequest: any = {
        model: this.getModelName(),
        max_tokens: 4096,
        system: this.getSystemPrompt(request.project),
        messages,
        tools: claudeTools,
        temperature: 0.7
      }

      // If this is a workflow continuation, force the specific tool
      if (request.context?.workflowContinuation && request.context?.forceTool) {
        const tool = claudeTools.find(t => t.name === request.context!.forceTool)
        if (tool) {
          apiRequest.tool_choice = { type: "tool", name: tool.name }
        }
      }

      // Call Claude with tool definitions
      const response = await this.anthropic.messages.create(apiRequest)

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
          // Use continuation args if this is a workflow continuation
          let args = toolUse.input
          if (request.context?.workflowContinuation && 
              request.context?.continuationArgs && 
              toolUse.name === request.context?.forceTool) {
            args = request.context.continuationArgs
          }
          
          const result = await toolExecutor.executeFunction(
            toolUse.name,
            args
          )
          
          toolResults.push({
            id: toolUse.id,
            function: toolUse.name,
            args: args,
            result
          })
        } catch (error) {
          // Use continuation args if this is a workflow continuation
          let args = toolUse.input
          if (request.context?.workflowContinuation && 
              request.context?.continuationArgs && 
              toolUse.name === request.context?.forceTool) {
            args = request.context.continuationArgs
          }
          
          toolResults.push({
            id: toolUse.id,
            function: toolUse.name,
            args: args,
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

DEVELOPMENT WORKFLOW:
When the user asks for development work (like "start development session"):
1. First analyze_project_state to understand what exists
2. Based on the analysis, create a development plan
3. Execute tools one at a time, explaining each step
4. After each tool, suggest the next logical action

REFLECTION & IMPROVEMENT WORKFLOW:
After creating any artifact (component, image, or plan):
1. The reflect_on_artifact tool will automatically be called
2. ALWAYS share the reflection insights in your response to the user
3. Analyze the reflection results for actionable improvements
4. If improvements are needed, CLEARLY STATE:
   - What issues were identified
   - Your rationale for taking action
   - What specific changes you will make
5. Then execute the appropriate action (edit, regenerate, etc.)

REFLECTION RESPONSE FORMAT:
When you receive reflection results, format them like this:
"🔍 **Reflection on [artifact name]:**
- Strengths: [positive aspects]
- Areas for improvement: [issues found]
- Project alignment: [how it fits the theme/vision]

💡 **Decision:** [What you will do based on the reflection]
**Rationale:** [Clear explanation of why]"

CURRENT PROJECT CONTEXT:
- Project: "${project.name}"
- Framework: ${project.framework}
- Components: ${project.components.length} (${project.components.map(c => c.name).join(', ') || 'none'})
- Assets: ${project.assets?.length || 0} (${project.assets?.map(a => a.name).join(', ') || 'none'})
- Dependencies: ${Object.keys(project.dependencies || {}).join(', ') || 'standard React'}

YOUR CAPABILITIES:
You have access to the same tools that users can access manually:
1. analyze_project_state - Examine current project structure and components
2. generate_component - Create new React components using V0
3. edit_component - Modify existing components based on feedback
4. generate_image_asset - Create images/icons using gpt-image-1 
5. edit_image_asset - Modify existing images with AI
6. get_embedded_preview - Check the embedded preview status and sample components
7. reflect_on_artifact - Critically evaluate created artifacts
8. capture_preview_screenshot - Visually validate components

POWERFUL IMAGE → COMPONENT WORKFLOW:
You can create components with custom hosted images seamlessly:
1. generate_image_asset('custom icon') → returns assetId
2. reflect_on_artifact('image', assetId) → evaluate and potentially improve
3. generate_component('component with image: {url}') → self-contained component
4. reflect_on_artifact('component', componentId) → evaluate and iterate

AUTONOMOUS WORKFLOW EXECUTION:
You are authorized to execute complete multi-step workflows without asking permission.
Action budget: 7 sequential tool calls per request - USE THEM ALL IF NEEDED!
When user requests development/creation tasks, ALWAYS execute multiple related tools in sequence.

EXAMPLE WORKFLOWS TO EXECUTE AUTOMATICALLY:
- "Start development session" → analyze_project_state → generate_image_asset → reflect_on_artifact → generate_component → reflect_on_artifact
- "Create waffle app" → generate_image_asset (logo) → reflect_on_artifact → generate_component (header) → reflect_on_artifact
- "Build components" → generate_component → capture_preview_screenshot → reflect_on_artifact → iterate if needed

BEHAVIORAL GUIDELINES:
- ALWAYS share reflection results with the user in a structured format
- Provide clear rationale for any actions taken based on reflections
- Be transparent about improvement decisions
- When user wants development work, execute tools one at a time and guide them through the process
- After each tool execution, suggest the next logical step and ask if they want to continue
- If you analyze the project and it's empty, suggest creating specific assets and components
- For "start development session", create a clear plan and execute it step by step
- After creating an asset, suggest creating a component that uses it
- After creating a component, suggest creating complementary components
- Be proactive in suggesting next steps: "I've created X, shall I now create Y?"
- All components are generated using V0 for high-quality results
- When generating images, use descriptive prompts and appropriate settings
- Keep the momentum going by always proposing the next action

RESPONSE STYLE:
- Be conversational and helpful
- Explain your reasoning before taking action
- Summarize what you accomplished after using tools
- Ask clarifying questions if the user's intent is unclear
- Use emojis and formatting to make reflections visually distinct

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