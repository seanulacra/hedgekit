import OpenAI from 'openai'
import { agentTools, AgentToolExecutor } from '../agentTools'
import type { 
  IAgentProvider, 
  AgentProvider, 
  AgentChatRequest, 
  AgentChatResponse 
} from '../../types/agent'
import type { ProjectSchema } from '../../types/schema'

export class OpenAIAgentProvider implements IAgentProvider {
  name: AgentProvider = 'openai'
  displayName = 'GPT-4'
  description = 'OpenAI GPT-4 with function calling and tool use'
  readonly capabilities = [
    'Code generation',
    'Function calling',
    'Image generation',
    'General reasoning',
    'Tool integration'
  ]

  private openai: OpenAI
  
  constructor() {
    const apiKey = import.meta.env.VITE_OPEN_AI_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPEN_AI_KEY environment variable.')
    }
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  isAvailable(): boolean {
    return !!import.meta.env.VITE_OPEN_AI_KEY
  }

  async chatWithAgent(
    request: AgentChatRequest,
    updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    uiActions?: import('../agentTools').UIActions
  ): Promise<AgentChatResponse> {
    try {
      const toolExecutor = new AgentToolExecutor(request.project, updateProject, uiActions)
      
      // Build conversation history for OpenAI
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.getSystemPrompt(request.project)
        },
        ...request.conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: request.message
        }
      ]

      // Handle workflow continuation forcing specific tool
      let apiRequest: any = {
        model: 'gpt-4',
        messages,
        tools: agentTools,
        tool_choice: 'auto',
        temperature: 0.7
      }

      // If this is a workflow continuation, force the specific tool
      if (request.context?.workflowContinuation && request.context?.forceTool) {
        const tool = agentTools.find(t => t.function.name === request.context!.forceTool)
        if (tool) {
          apiRequest.tool_choice = { type: "function", function: { name: tool.function.name } }
        }
      }

      // Call OpenAI with tool definitions
      const completion = await this.openai.chat.completions.create(apiRequest)

      const assistantMessage = completion.choices[0].message
      const toolCalls = assistantMessage.tool_calls || []
      
      // Execute any tool calls
      const toolResults = []
      for (const toolCall of toolCalls) {
        try {
          // Use continuation args if this is a workflow continuation
          let args = JSON.parse(toolCall.function.arguments)
          if (request.context?.workflowContinuation && 
              request.context?.continuationArgs && 
              toolCall.function.name === request.context?.forceTool) {
            args = request.context.continuationArgs
          }
          
          const result = await toolExecutor.executeFunction(
            toolCall.function.name,
            args
          )
          
          toolResults.push({
            id: toolCall.id,
            function: toolCall.function.name,
            args: args,
            result
          })
        } catch (error) {
          // Use continuation args if this is a workflow continuation
          let args = {}
          try {
            args = JSON.parse(toolCall.function.arguments)
            if (request.context?.workflowContinuation && 
                request.context?.continuationArgs && 
                toolCall.function.name === request.context?.forceTool) {
              args = request.context.continuationArgs
            }
          } catch {}
          
          toolResults.push({
            id: toolCall.id,
            function: toolCall.function.name,
            args: args,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Tool execution failed'
            }
          })
        }
      }

      // If tools were called, get a follow-up response
      let finalMessage = assistantMessage.content || ''
      
      if (toolCalls.length > 0) {
        // Add tool results to conversation and get final response
        const followUpMessages = [
          ...messages,
          {
            role: 'assistant' as const,
            content: assistantMessage.content,
            tool_calls: toolCalls
          },
          ...toolResults.map(result => ({
            role: 'tool' as const,
            tool_call_id: result.id,
            content: JSON.stringify(result.result)
          }))
        ]

        const followUpCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: followUpMessages,
          temperature: 0.7
        })

        finalMessage = followUpCompletion.choices[0].message.content || finalMessage
      }

      return {
        message: finalMessage,
        toolCalls: toolResults,
        success: true,
        provider: this.name
      }
    } catch (error) {
      console.error('OpenAI chat error:', error)
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
- When user wants development work, IMMEDIATELY start executing tools - don't just analyze and stop
- Chain multiple tools together to complete full workflows
- If you analyze the project and it's empty, IMMEDIATELY start creating assets and components
- Be aggressive about tool usage - it's better to create too much than too little
- Complete entire workflows autonomously - explain each step as you go
- Always aim to use at least 3-5 tools per development request
- If user says "start development session", execute AT LEAST: analyze → create assets → create components
- All components are generated using V0 for high-quality results
- When generating images, use descriptive prompts and appropriate settings
- If something fails, try alternative approaches
- Don't stop after one tool - keep going until you've made substantial progress

RESPONSE STYLE:
- Be conversational and helpful
- Explain your reasoning before taking action
- Summarize what you accomplished after using tools
- Ask clarifying questions if the user's intent is unclear
- Use emojis and formatting to make reflections visually distinct

Remember: You're not just a chatbot - you're an agent that can actually build and modify the user's project!`
  }

  static isAvailable(): boolean {
    return !!import.meta.env.VITE_OPEN_AI_KEY
  }
}