import type { ComponentSchema, ProjectSchema, GenerationRequest } from '../types/schema'

export class ComponentGenerator {
  private openaiApiKey: string | null = null

  setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey
  }

  async generateComponent(request: GenerationRequest): Promise<ComponentSchema> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not set')
    }

    const prompt = this.buildGenerationPrompt(request)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert React component generator. Generate clean, functional React components with TypeScript based on user requirements. Always return valid JSON with the component schema and code.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const generatedContent = data.choices[0].message.content

      return this.parseGeneratedComponent(generatedContent, request)
    } catch (error) {
      console.error('Error generating component:', error)
      throw error
    }
  }

  async modifyComponent(
    component: ComponentSchema, 
    modifications: string,
    projectSchema: ProjectSchema
  ): Promise<ComponentSchema> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not set')
    }

    const prompt = this.buildModificationPrompt(component, modifications, projectSchema)
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert React component modifier. Update existing components based on user requirements while maintaining existing functionality and structure where possible.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const modifiedContent = data.choices[0].message.content

      return this.parseModifiedComponent(modifiedContent, component)
    } catch (error) {
      console.error('Error modifying component:', error)
      throw error
    }
  }

  private buildGenerationPrompt(request: GenerationRequest): string {
    const existingComponents = request.projectSchema.components
      .map(c => `- ${c.name}: ${Object.keys(c.props).join(', ')}`)
      .join('\n')

    return `
Generate a React component based on this requirement: "${request.prompt}"

Project Context:
- Framework: React with TypeScript
- Styling: Tailwind CSS with Shadcn UI components
- Existing components: ${existingComponents || 'None'}

Requirements:
1. Create a functional React component with TypeScript
2. Use Tailwind CSS for styling
3. Include proper prop definitions with types
4. Make it responsive and accessible
5. Use Shadcn UI components where appropriate

Please respond with a JSON object containing:
{
  "componentSchema": {
    "id": "unique-id",
    "name": "ComponentName",
    "type": "component", 
    "framework": "react",
    "props": {
      "propName": {
        "type": "string|number|boolean|object|array|function",
        "required": true|false,
        "defaultValue": "value",
        "description": "description"
      }
    },
    "source": "local",
    "filePath": "src/components/ComponentName.tsx"
  },
  "code": "// React component code here"
}

IMPORTANT: 
- Component name must be PascalCase (e.g., "UserCard", "SubmitButton")
- Component name cannot be "App" or "app" 
- filePath must be "src/components/[ComponentName].tsx"
`
  }

  private buildModificationPrompt(
    component: ComponentSchema,
    modifications: string,
    projectSchema: ProjectSchema
  ): string {
    return `
Modify this existing React component based on the requirements: "${modifications}"

Current Component Schema:
${JSON.stringify(component, null, 2)}

Project Context:
- Framework: React with TypeScript  
- Styling: Tailwind CSS with Shadcn UI components
- Available components: ${projectSchema.components.map(c => c.name).join(', ')}

Requirements:
1. Apply the requested modifications
2. Maintain existing functionality where not affected
3. Update prop definitions if needed
4. Ensure TypeScript compatibility
5. Keep responsive and accessible design

Please respond with a JSON object containing:
{
  "componentSchema": {
    // Updated component schema
  },
  "code": "// Updated React component code"
}
`
  }

  private parseGeneratedComponent(
    generatedContent: string,
    request: GenerationRequest
  ): ComponentSchema {
    try {
      const cleanContent = this.extractJsonFromResponse(generatedContent)
      const parsed = JSON.parse(cleanContent)
      
      if (!parsed.componentSchema || !parsed.code) {
        throw new Error('Invalid response format')
      }

      const component = parsed.componentSchema as ComponentSchema
      component.id = this.generateComponentId()
      component.generatedCode = parsed.code
      component.generationMethod = 'openai'
      
      // Ensure component name is not "App" to avoid conflicts
      if (component.name.toLowerCase() === 'app') {
        component.name = 'CustomComponent'
        component.filePath = 'src/components/CustomComponent.tsx'
      }
      
      return component
    } catch (error) {
      console.error('Error parsing generated component:', error)
      return this.createFallbackComponent(request)
    }
  }

  private parseModifiedComponent(
    modifiedContent: string,
    originalComponent: ComponentSchema
  ): ComponentSchema {
    try {
      const cleanContent = this.extractJsonFromResponse(modifiedContent)
      const parsed = JSON.parse(cleanContent)
      
      if (!parsed.componentSchema) {
        throw new Error('Invalid response format')
      }

      const component = parsed.componentSchema as ComponentSchema
      component.id = originalComponent.id
      
      return component
    } catch (error) {
      console.error('Error parsing modified component:', error)
      return originalComponent
    }
  }

  private extractJsonFromResponse(content: string): string {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    return jsonMatch ? jsonMatch[0] : content
  }

  private generateComponentId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createFallbackComponent(request: GenerationRequest): ComponentSchema {
    let componentName = this.extractComponentName(request.prompt) || 'GeneratedComponent'
    
    // Ensure component name is not "App" to avoid conflicts
    if (componentName.toLowerCase() === 'app') {
      componentName = 'CustomComponent'
    }
    
    return {
      id: this.generateComponentId(),
      name: componentName,
      type: 'component',
      framework: 'react',
      props: {},
      source: 'local',
      filePath: `src/components/${componentName}.tsx`,
      generatedCode: `// Fallback component for: ${request.prompt}\nexport default function ${componentName}() {\n  return (\n    <div className="p-4 border rounded">\n      <h2>${componentName}</h2>\n      <p>Component generation failed. Please try again.</p>\n    </div>\n  )\n}`,
      generationMethod: 'openai'
    }
  }

  private extractComponentName(prompt: string): string {
    const words = prompt.split(' ')
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with', 'that', 'this'].includes(word.toLowerCase())
    )
    
    if (meaningfulWords.length > 0) {
      return meaningfulWords[0].charAt(0).toUpperCase() + meaningfulWords[0].slice(1) + 'Component'
    }
    
    return 'GeneratedComponent'
  }
}