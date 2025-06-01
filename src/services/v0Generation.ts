import { generateText } from 'ai'
import { createVercel } from '@ai-sdk/vercel'

export interface V0GenerationRequest {
  prompt: string
  projectContext?: {
    framework: string
    components: string[]
    dependencies: Record<string, string>
  }
}

export interface V0GenerationResponse {
  code: string
  componentName: string
}

export class V0GenerationService {
  static async generateComponent(request: V0GenerationRequest): Promise<V0GenerationResponse> {
    const apiKey = import.meta.env.VITE_VERCEL_TOKEN
    
    if (!apiKey) {
      throw new Error('Vercel API token not configured. Please set VITE_VERCEL_TOKEN environment variable.')
    }

    try {
      const contextPrompt = request.projectContext ? `
Project Context:
- Framework: ${request.projectContext.framework}
- Existing components: ${request.projectContext.components.join(', ')}
- Dependencies: ${Object.keys(request.projectContext.dependencies).join(', ')}
` : ''

      const vercel = createVercel({
        apiKey: apiKey
      })

      const { text } = await generateText({
        model: vercel('v0-1.0-md'),
        prompt: `
SYSTEM:
You are v0, an AI assistant created by Vercel that generates React components.
Generate a single, complete React component based on the user's request.
Return only the component code - no imports, no exports, no markdown formatting.
Use modern React with TypeScript and functional components with hooks.
Use Tailwind CSS for styling.
Make the component self-contained and production-ready.

${contextPrompt}

USER REQUEST:
${request.prompt}

Return only the component code, starting with the component function definition.
`,
      })

      // Parse and clean the generated code
      const { cleanCode, componentName } = this.parseV0Response(text)

      return {
        code: cleanCode,
        componentName
      }
    } catch (error) {
      console.error('Error calling v0 API:', error)
      throw new Error(`v0 generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static parseV0Response(response: string): { cleanCode: string; componentName: string } {
    try {
      // Remove <Thinking> tags and their content
      let cleanCode = response.replace(/<Thinking>[\s\S]*?<\/Thinking>/gi, '').trim()
      
      // Remove any markdown code fences
      cleanCode = cleanCode.replace(/```(?:typescript|tsx|javascript|jsx)?\n?/g, '').replace(/```/g, '')
      
      // Split by common reasoning patterns and take the last code block
      const reasoningSeparators = [
        /^Here's.*?:/m,
        /^This.*?:/m,
        /^I'll.*?:/m,
        /^Let me.*?:/m,
        /^The.*?component.*?:/m,
        /^Below.*?:/m,
        /^\*\*.*?\*\*/m,
        /^#.*?$/m
      ]
      
      // Find the last substantial code block that looks like a React component
      const lines = cleanCode.split('\n')
      let codeStartIndex = 0
      
      // Look for the start of actual component code
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Skip empty lines and comments at the start
        if (!line || line.startsWith('//') || line.startsWith('/*')) continue
        
        // If we find reasoning text, mark this as a potential start point
        const isReasoningLine = reasoningSeparators.some(pattern => pattern.test(line))
        if (isReasoningLine) {
          codeStartIndex = i + 1
          continue
        }
        
        // If we find import statements or function/const declarations, this is likely code
        if (line.startsWith('import ') || 
            line.includes('function ') || 
            line.includes('const ') || 
            line.includes('export ')) {
          codeStartIndex = i
          break
        }
      }
      
      // Extract the code portion
      cleanCode = lines.slice(codeStartIndex).join('\n').trim()
      
      // Remove any trailing explanatory text after the component
      const codeLines = cleanCode.split('\n')
      let codeEndIndex = codeLines.length
      
      // Look for patterns that indicate explanatory text
      for (let i = codeLines.length - 1; i >= 0; i--) {
        const line = codeLines[i].trim()
        
        if (!line) continue
        
        // If we find a closing bracket or brace, this is likely the end of code
        if (line === '}' || line === '};' || line.endsWith('}')) {
          codeEndIndex = i + 1
          break
        }
        
        // If we find explanatory text patterns, exclude them
        if (line.startsWith('This component') || 
            line.startsWith('The component') ||
            line.startsWith('Note:') ||
            line.includes('explanation') ||
            line.includes('features:')) {
          codeEndIndex = i
        }
      }
      
      cleanCode = codeLines.slice(0, codeEndIndex).join('\n').trim()
      
      // Extract component name
      const componentNameMatch = cleanCode.match(/(?:function|const)\s+(\w+)/) ||
                                cleanCode.match(/export\s+(?:default\s+)?(?:function\s+)?(\w+)/)
      const componentName = componentNameMatch ? componentNameMatch[1] : 'GeneratedComponent'
      
      // If we couldn't find proper component code, return the original
      if (!cleanCode || (!cleanCode.includes('function') && !cleanCode.includes('const') && !cleanCode.includes('return'))) {
        return {
          cleanCode: response.trim(),
          componentName: 'GeneratedComponent'
        }
      }
      
      return {
        cleanCode,
        componentName
      }
    } catch (error) {
      console.warn('Failed to parse v0 response, using raw output:', error)
      
      // Fallback: try to extract component name from raw response
      const componentNameMatch = response.match(/(?:function|const)\s+(\w+)/)
      const componentName = componentNameMatch ? componentNameMatch[1] : 'GeneratedComponent'
      
      return {
        cleanCode: response.trim(),
        componentName
      }
    }
  }

  static isV0Available(): boolean {
    return !!import.meta.env.VITE_VERCEL_TOKEN
  }
}