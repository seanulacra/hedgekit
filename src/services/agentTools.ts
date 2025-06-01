import { ComponentGenerator } from '../lib/generator'
import { V0GenerationService } from './v0Generation'
import { ImageGenerationService } from './imageGeneration'
import { BunnyCDNService } from './bunnycdnService'
import { ProjectPlanningService } from './projectPlanningService'
import type { ProjectSchema, ComponentSchema, ImageAsset, ProjectPlan } from '../types/schema'

// Tool workflow configuration
interface ToolWorkflow {
  continueOnSuccess?: {
    nextTool: string
    condition?: 'always' | 'if_component_requested' | 'if_user_intent_complete'
    maxChainLength?: number
  }
}

// Enhanced tool definition with workflow metadata
interface EnhancedTool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: any
  }
  workflow?: ToolWorkflow
}

// Tool definitions for OpenAI function calling with workflow support
export const agentTools: EnhancedTool[] = [
  {
    type: "function" as const,
    function: {
      name: "analyze_project_state",
      description: "Analyze the current project to understand components, assets, and overall structure",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_component",
      description: "Generate a new React component using AI. The component will be created with the specified name and requirements.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the component (e.g., 'CharacterCard', 'WizardProfile')"
          },
          description: {
            type: "string",
            description: "Detailed description of what the component should look like and do"
          },
          requirements: {
            type: "string",
            description: "Optional specific requirements or constraints for the component"
          }
        },
        required: ["name", "description"]
      }
    },
    workflow: {
      continueOnSuccess: {
        nextTool: "reflect_on_artifact",
        condition: "always",
        maxChainLength: 2
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "edit_component",
      description: "Edit an existing React component based on feedback or new requirements. Use this after reflection to improve components.",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "ID of the component to edit"
          },
          editInstructions: {
            type: "string",
            description: "Specific instructions for how to modify the component"
          },
          reflectionInsights: {
            type: "string",
            description: "Optional: Insights from reflection that inform the edit"
          }
        },
        required: ["componentId", "editInstructions"]
      }
    },
    workflow: {
      continueOnSuccess: {
        nextTool: "reflect_on_artifact",
        condition: "always",
        maxChainLength: 1
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_image_asset",
      description: "Generate an image asset using AI. Images are uploaded to CDN for use in components.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the image asset (e.g., 'wizard-avatar', 'magic-background')"
          },
          prompt: {
            type: "string",
            description: "Detailed description of the image to generate"
          },
          background: {
            type: "string",
            enum: ["transparent", "white", "black", "gradient"],
            description: "Background style for the image"
          },
          size: {
            type: "string",
            enum: ["1024x1024", "1024x1536", "1536x1024", "auto"],
            description: "Image dimensions (supported by gpt-image-1)"
          }
        },
        required: ["name", "prompt"]
      }
    },
    workflow: {
      continueOnSuccess: {
        nextTool: "reflect_on_artifact",
        condition: "always",
        maxChainLength: 2
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "edit_image_asset",
      description: "Edit an existing image asset using AI",
      parameters: {
        type: "object",
        properties: {
          assetId: {
            type: "string",
            description: "ID of the image asset to edit"
          },
          editPrompt: {
            type: "string",
            description: "Instructions for how to edit the image"
          }
        },
        required: ["assetId", "editPrompt"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_embedded_preview",
      description: "Get information about the current embedded preview state and sample components",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "switch_ui_tab",
      description: "Switch the UI to a specific tab (build, project, preview, or plan)",
      parameters: {
        type: "object",
        properties: {
          tab: {
            type: "string",
            enum: ["build", "project", "preview", "plan"],
            description: "The tab to switch to: 'build' for Build Tools, 'project' for Project view, 'preview' for Live Preview, 'plan' for Project Plan"
          }
        },
        required: ["tab"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "show_component_code",
      description: "Expand and show the code for a specific component in the Project view",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "ID of the component to show code for"
          }
        },
        required: ["componentId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "focus_preview_component",
      description: "Switch to live preview and focus on a specific component",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "ID of the component to focus in the preview"
          }
        },
        required: ["componentId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "create_scene",
      description: "Create a new scene layout with specified components and layout",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the scene"
          },
          description: {
            type: "string",
            description: "Description of the scene layout and purpose"
          },
          layout_type: {
            type: "string",
            enum: ["freeform", "grid", "flex"],
            description: "Type of layout for the scene"
          },
          width: {
            type: "number",
            description: "Width of the scene canvas in pixels (default: 1200)"
          },
          height: {
            type: "number", 
            description: "Height of the scene canvas in pixels (default: 800)"
          },
          components: {
            type: "array",
            description: "Array of component instances to add to the scene",
            items: {
              type: "object",
              properties: {
                componentId: {
                  type: "string",
                  description: "ID of the component to add"
                },
                x: {
                  type: "number",
                  description: "X position in pixels"
                },
                y: {
                  type: "number", 
                  description: "Y position in pixels"
                },
                props: {
                  type: "object",
                  description: "Props to pass to the component instance"
                }
              },
              required: ["componentId", "x", "y"]
            }
          }
        },
        required: ["name", "description"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "add_component_to_scene",
      description: "Add a component instance to an existing scene",
      parameters: {
        type: "object",
        properties: {
          sceneId: {
            type: "string",
            description: "ID of the scene to add component to"
          },
          componentId: {
            type: "string",
            description: "ID of the component to add"
          },
          x: {
            type: "number",
            description: "X position in pixels"
          },
          y: {
            type: "number",
            description: "Y position in pixels"
          },
          props: {
            type: "object",
            description: "Props to pass to the component instance"
          }
        },
        required: ["sceneId", "componentId", "x", "y"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_project_plan",
      description: "Generate a comprehensive project plan using a larger model for detailed planning",
      parameters: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "Name of the project to plan"
          },
          projectDescription: {
            type: "string",
            description: "Detailed description of the project requirements"
          },
          targetUsers: {
            type: "array",
            items: { type: "string" },
            description: "Target user types/personas for the project"
          },
          coreFeatures: {
            type: "array",
            items: { type: "string" },
            description: "List of core features the project should include"
          },
          preferences: {
            type: "object",
            properties: {
              framework: {
                type: "string",
                enum: ["react", "vue", "svelte"],
                description: "Preferred frontend framework"
              },
              styling: {
                type: "string",
                enum: ["tailwind", "styled-components", "emotion"],
                description: "Preferred styling approach"
              },
              complexity: {
                type: "string",
                enum: ["simple", "moderate", "complex"],
                description: "Project complexity level"
              },
              timeline: {
                type: "string",
                enum: ["quick", "standard", "thorough"],
                description: "Development timeline preference"
              }
            }
          }
        },
        required: ["projectName", "projectDescription", "targetUsers", "coreFeatures"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_project_plan",
      description: "Get the current project plan with phases, tasks, and milestones",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "update_task_status",
      description: "Update the status of a specific task in the project plan",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to update"
          },
          status: {
            type: "string",
            enum: ["todo", "in-progress", "review", "done"],
            description: "New status for the task"
          },
          notes: {
            type: "string",
            description: "Optional notes about the task progress or completion"
          }
        },
        required: ["taskId", "status"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "get_next_tasks",
      description: "Get the next available tasks from the project plan based on dependencies and priorities",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of tasks to return (default: 5)",
            minimum: 1,
            maximum: 20
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "execute_task",
      description: "Automatically execute a specific task from the project plan using appropriate tools",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "ID of the task to execute"
          },
          executionNotes: {
            type: "string",
            description: "Optional notes about the execution approach"
          }
        },
        required: ["taskId"]
      }
    },
    workflow: {
      continueOnSuccess: {
        nextTool: "get_next_tasks",
        condition: "always",
        maxChainLength: 3
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "review_and_iterate_plan",
      description: "Review the current project plan and suggest improvements based on progress and learnings",
      parameters: {
        type: "object",
        properties: {
          feedback: {
            type: "string",
            description: "User feedback or observations about the current plan"
          },
          focus_area: {
            type: "string",
            enum: ["timeline", "scope", "technical", "resources", "quality"],
            description: "Specific area to focus the review on"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "start_development_session",
      description: "Begin an automated development session that creates multiple components and assets in one go",
      parameters: {
        type: "object",
        properties: {
          project_theme: {
            type: "string",
            description: "Theme or topic for the components/assets (e.g., 'waffle', 'space', 'wizard')",
          },
          component_count: {
            type: "number",
            description: "Number of components to create (default: 3)",
            minimum: 1,
            maximum: 5
          },
          asset_count: {
            type: "number",
            description: "Number of image assets to create (default: 2)",
            minimum: 0,
            maximum: 5
          }
        },
        required: []
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "reflect_on_artifact",
      description: "Reflect on and critique a recently created artifact (component, image, or plan) to identify improvements",
      parameters: {
        type: "object",
        properties: {
          artifactType: {
            type: "string",
            enum: ["component", "image", "plan", "task"],
            description: "Type of artifact to reflect on"
          },
          artifactId: {
            type: "string",
            description: "ID of the artifact (component ID, image ID, plan ID, or task ID)"
          },
          aspectsToReview: {
            type: "array",
            items: { type: "string" },
            description: "Specific aspects to review (e.g., 'visual design', 'code quality', 'user experience', 'completeness')"
          }
        },
        required: ["artifactType", "artifactId"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "capture_preview_screenshot",
      description: "Capture a screenshot of the current preview to visually review the created components",
      parameters: {
        type: "object",
        properties: {
          componentId: {
            type: "string",
            description: "Optional: specific component to focus on in the preview"
          },
          captureMode: {
            type: "string",
            enum: ["full", "component", "viewport"],
            description: "What to capture: full preview, specific component, or current viewport"
          }
        },
        required: []
      }
    },
    workflow: {
      continueOnSuccess: {
        nextTool: "reflect_on_artifact",
        condition: "always",
        maxChainLength: 1
      }
    }
  }
]

// UI action callbacks type
export interface UIActions {
  switchTab?: (tab: 'build' | 'project' | 'preview' | 'plan') => void
  showComponentCode?: (componentId: string) => void
  focusPreviewComponent?: (componentId: string) => void
  createScene?: (name: string, description: string) => void
  addComponentToScene?: (sceneId: string, componentId: string, x: number, y: number, props?: any) => void
}

// Tool execution functions
export class AgentToolExecutor {
  private originalUserIntent: string = ''
  private chainLength: number = 0
  
  constructor(
    private project: ProjectSchema,
    private updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    private uiActions?: UIActions
  ) {}

  setUserIntent(userMessage: string) {
    this.originalUserIntent = userMessage.toLowerCase()
    this.chainLength = 0
  }

  shouldContinueWorkflow(toolName: string, success: boolean): { shouldContinue: boolean, nextTool?: string } {
    if (!success) return { shouldContinue: false }
    
    const tool = agentTools.find(t => t.function.name === toolName)
    const workflow = tool?.workflow?.continueOnSuccess
    
    if (!workflow) return { shouldContinue: false }
    
    // Check chain length limit
    if (this.chainLength >= (workflow.maxChainLength || 5)) {
      return { shouldContinue: false }
    }
    
    // Check continuation condition
    const shouldContinue = this.evaluateCondition(workflow.condition || 'always')
    
    return {
      shouldContinue,
      nextTool: shouldContinue ? workflow.nextTool : undefined
    }
  }

  private evaluateCondition(condition: string): boolean {
    switch (condition) {
      case 'always':
        return true
      case 'if_component_requested':
        return this.originalUserIntent.includes('component') || 
               this.originalUserIntent.includes('card') ||
               this.originalUserIntent.includes('create')
      case 'if_user_intent_complete':
        // Add logic to check if user's original intent is satisfied
        return false
      default:
        return false
    }
  }

  async executeFunction(functionName: string, args: any): Promise<any> {
    this.chainLength++
    
    switch (functionName) {
      case "analyze_project_state":
        return this.analyzeProjectState()
      
      case "generate_component":
        return this.generateComponent(args)
      
      case "edit_component":
        return this.editComponent(args)
      
      case "generate_image_asset":
        return this.generateImageAsset(args)
      
      case "edit_image_asset":
        return this.editImageAsset(args)
      
      case "get_embedded_preview":
        return this.getEmbeddedPreview()
      
      case "switch_ui_tab":
        return this.switchUITab(args)
      
      case "show_component_code":
        return this.showComponentCode(args)
      
      case "focus_preview_component":
        return this.focusPreviewComponent(args)
      
      case "create_scene":
        return this.createScene(args)
      
      case "add_component_to_scene":
        return this.addComponentToScene(args)
      
      case "generate_project_plan":
        return this.generateProjectPlan(args)
      
      case "get_project_plan":
        return this.getProjectPlan()
      
      case "update_task_status":
        return this.updateTaskStatus(args)
      
      case "get_next_tasks":
        return this.getNextTasks(args)
      
      case "execute_task":
        return this.executeTask(args)
      
      case "review_and_iterate_plan":
        return this.reviewAndIteratePlan(args)
      
      case "start_development_session":
        return this.startDevelopmentSession(args)
      
      case "reflect_on_artifact":
        return this.reflectOnArtifact(args)
      
      case "capture_preview_screenshot":
        return this.capturePreviewScreenshot(args)
      
      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  }

  private analyzeProjectState() {
    const analysis = {
      project_name: this.project.name,
      framework: this.project.framework,
      total_components: this.project.components.length,
      components: this.project.components.map(c => ({
        name: c.name,
        has_generated_code: !!c.generatedCode,
        generation_method: c.generationMethod,
        source: c.source
      })),
      total_assets: this.project.assets?.length || 0,
      assets: (this.project.assets || []).map(a => ({
        name: a.name,
        type: 'image',
        format: a.format,
        prompt: a.prompt,
        created_at: a.createdAt
      })),
      dependencies: Object.keys(this.project.dependencies || {}),
      last_updated: this.project.updatedAt
    }
    
    return {
      success: true,
      data: analysis,
      summary: `Project "${this.project.name}" has ${this.project.components.length} components and ${this.project.assets?.length || 0} assets. Built with ${this.project.framework}.`
    }
  }

  private async generateComponent(args: { name: string, description: string, requirements?: string }) {
    try {
      const { name, description, requirements } = args
      
      // Combine description and requirements for the prompt
      const fullPrompt = requirements ? `${description}\n\nSpecific requirements: ${requirements}` : description
      
      // Always use V0 for component generation
      if (!V0GenerationService.isV0Available()) {
        throw new Error('V0 service is not available. Please configure your V0 API key.')
      }

      const result = await V0GenerationService.generateComponent({
        prompt: fullPrompt,
        projectContext: {
          framework: this.project.framework,
          components: this.project.components.map(c => c.name),
          dependencies: this.project.dependencies || {}
        }
      })
      
      const component: ComponentSchema = {
        id: `comp-${Date.now()}`,
        name: result.componentName || name,
        type: 'component',
        framework: 'react',
        props: {},
        source: 'custom',
        generatedCode: result.code,
        generationMethod: 'v0'
      }

      // Update project with new component
      this.updateProject(prev => ({
        ...prev,
        components: [...prev.components, component],
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: { component },
        summary: `Generated component "${component.name}" using v0. Added to project.`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Component generation failed',
        summary: `Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async editComponent(args: { componentId: string, editInstructions: string, reflectionInsights?: string }) {
    try {
      const { componentId, editInstructions, reflectionInsights } = args
      
      // Find the component to edit
      const component = this.project.components.find(c => c.id === componentId)
      if (!component) {
        throw new Error(`Component with ID ${componentId} not found`)
      }

      if (!component.generatedCode) {
        throw new Error(`Component ${component.name} has no code to edit`)
      }

      // Combine edit instructions with reflection insights
      const fullPrompt = reflectionInsights 
        ? `${editInstructions}\n\nBased on reflection insights: ${reflectionInsights}`
        : editInstructions

      // Use V0 to regenerate the component with modifications
      if (!V0GenerationService.isV0Available()) {
        throw new Error('V0 service is not available. Please configure your V0 API key.')
      }

      const result = await V0GenerationService.generateComponent({
        prompt: `Edit this existing React component:\n\n${component.generatedCode}\n\nModifications requested: ${fullPrompt}`,
        projectContext: {
          framework: this.project.framework,
          components: this.project.components.map(c => c.name),
          dependencies: this.project.dependencies || {}
        }
      })

      // Update the component with edited code
      this.updateProject(prev => ({
        ...prev,
        components: prev.components.map(c => 
          c.id === componentId 
            ? {
                ...c,
                generatedCode: result.code,
                updatedAt: new Date().toISOString()
              }
            : c
        ),
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: { 
          componentId,
          componentName: component.name,
          edited: true
        },
        summary: `Edited component "${component.name}" based on: ${editInstructions.substring(0, 100)}...`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Component editing failed',
        summary: `Failed to edit component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async generateImageAsset(args: { name: string, prompt: string, background?: string, size?: string }) {
    try {
      const { name, prompt, background = 'transparent', size = '1024x1024' } = args
      
      const result = await ImageGenerationService.generateImage({
        prompt,
        model: 'gpt-image-1',
        background: background as any,
        size,
        output_format: 'png',
        quality: 'high'
      })

      const assetId = `img-${Date.now()}`
      
      // Upload directly to BunnyCDN, never store base64
      const uploadResult = await this.uploadImageToBunnyCDN(
        result.data[0].b64_json!, 
        `${name}.png`, 
        `Generated image: ${name}`
      )
      
      if (uploadResult.success) {
        // Save asset with only the CDN URL
        const imageAsset: ImageAsset = {
          id: assetId,
          name,
          prompt,
          cdnUrl: uploadResult.publicUrl,
          format: 'png',
          size,
          background: background as any,
          model: 'gpt-image-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        this.updateProject(prev => ({
          ...prev,
          assets: [...(prev.assets || []), imageAsset],
          updatedAt: new Date().toISOString()
        }))

        return {
          success: true,
          data: { 
            assetId,
            name,
            size,
            format: 'png',
            cdnUrl: uploadResult.publicUrl
          },
          summary: `Generated image "${name}" and uploaded to CDN. Asset ID: ${assetId}. CDN URL: ${uploadResult.publicUrl}`
        }
      } else {
        // CDN upload failed
        return {
          success: false,
          error: uploadResult.error || 'Failed to upload image to CDN',
          summary: `Generated image "${name}" but failed to upload to CDN: ${uploadResult.error || 'Unknown error'}`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
        summary: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async editImageAsset(args: { assetId: string, editPrompt: string }) {
    try {
      const { assetId, editPrompt } = args
      
      const asset = this.project.assets?.find(a => a.id === assetId)
      if (!asset) {
        throw new Error(`Asset with ID ${assetId} not found`)
      }

      // Check if asset has base64 data
      if (!asset.base64 && !asset.cdnUrl) {
        throw new Error(`Asset ${assetId} has no image data available`)
      }

      // If we only have CDN URL, we can't edit the image directly
      if (!asset.base64 && asset.cdnUrl) {
        throw new Error(`Asset ${assetId} is stored in CDN only. Image editing requires base64 data.`)
      }

      // Dynamic import to avoid build conflicts
      const result = await ImageGenerationService.editImage(
        asset.base64!,
        editPrompt,
        {
          background: asset.background,
          size: asset.size,
          quality: 'high'
        }
      )

      // Update the asset with new image
      this.updateProject(prev => ({
        ...prev,
        assets: (prev.assets || []).map(a => 
          a.id === assetId 
            ? { 
                ...a, 
                base64: result.data[0].b64_json!,
                prompt: `${a.prompt} | Edited: ${editPrompt}`,
                updatedAt: new Date().toISOString() 
              }
            : a
        ),
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: { assetId, editPrompt },
        summary: `Edited image "${asset.name}" with prompt "${editPrompt}". Asset updated.`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image editing failed',
        summary: `Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private getEmbeddedPreview() {
    // Return information about the embedded preview system
    return {
      success: true,
      data: {
        status: 'ready',
        preview_type: 'embedded',
        components_count: this.project.components.length,
        has_assets: (this.project.assets?.length || 0) > 0,
        framework: this.project.framework,
        last_updated: this.project.updatedAt,
        sample_components: ['CharacterCard']
      },
      summary: `Embedded preview is ready with ${this.project.components.length} components. Supports live rendering of sample components.`
    }
  }

  private switchUITab(args: { tab: 'build' | 'project' | 'preview' }) {
    const { tab } = args
    
    if (this.uiActions?.switchTab) {
      this.uiActions.switchTab(tab)
      return {
        success: true,
        data: { tab },
        summary: `Switched to ${tab} tab`
      }
    }
    
    return {
      success: false,
      error: 'UI tab switching not available',
      summary: 'Tab switching is not currently supported'
    }
  }

  private showComponentCode(args: { componentId: string }) {
    const { componentId } = args
    
    const component = this.project.components.find(c => c.id === componentId)
    if (!component) {
      return {
        success: false,
        error: `Component with ID ${componentId} not found`,
        summary: `Component ${componentId} does not exist`
      }
    }

    if (this.uiActions?.showComponentCode) {
      this.uiActions.showComponentCode(componentId)
      return {
        success: true,
        data: { componentId, componentName: component.name },
        summary: `Showing code for component "${component.name}"`
      }
    }
    
    return {
      success: false,
      error: 'Component code display not available',
      summary: 'Component code display is not currently supported'
    }
  }

  private focusPreviewComponent(args: { componentId: string }) {
    const { componentId } = args
    
    const component = this.project.components.find(c => c.id === componentId)
    if (!component) {
      return {
        success: false,
        error: `Component with ID ${componentId} not found`,
        summary: `Component ${componentId} does not exist`
      }
    }

    if (this.uiActions?.focusPreviewComponent) {
      this.uiActions.focusPreviewComponent(componentId)
      return {
        success: true,
        data: { componentId, componentName: component.name },
        summary: `Switched to live preview and focused on component "${component.name}"`
      }
    }
    
    return {
      success: false,
      error: 'Preview component focus not available',
      summary: 'Preview component focus is not currently supported'
    }
  }

  private createScene(args: { 
    name: string, 
    description: string, 
    layout_type?: string, 
    width?: number, 
    height?: number,
    components?: Array<{componentId: string, x: number, y: number, props?: any}>
  }) {
    try {
      const { 
        name, 
        description, 
        layout_type = 'freeform', 
        width = 1200, 
        height = 800,
        components = []
      } = args

      // Import scene manager
      const { sceneManager } = require('./sceneManager')
      
      // Create the scene
      const scene = sceneManager.createScene(name, {
        type: layout_type as any,
        container: {
          width,
          height,
          background: '#ffffff'
        }
      })

      // Add components to the scene
      for (const comp of components) {
        const component = this.project.components.find(c => c.id === comp.componentId)
        if (component) {
          sceneManager.addComponentToScene(
            scene.id,
            comp.componentId,
            comp.props || {},
            { x: comp.x, y: comp.y }
          )
        }
      }

      // Set as active scene
      sceneManager.setActiveScene(scene.id)

      // Update project
      this.updateProject(prev => sceneManager.exportToProject(prev))

      // Call UI action if available
      if (this.uiActions?.createScene) {
        this.uiActions.createScene(name, description)
      }

      return {
        success: true,
        data: { 
          sceneId: scene.id, 
          name, 
          description,
          componentsAdded: components.length
        },
        summary: `Created scene "${name}" with ${components.length} components. Set as active scene.`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scene creation failed',
        summary: `Failed to create scene: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private addComponentToScene(args: { 
    sceneId: string, 
    componentId: string, 
    x: number, 
    y: number, 
    props?: any 
  }) {
    try {
      const { sceneId, componentId, x, y, props = {} } = args

      const component = this.project.components.find(c => c.id === componentId)
      if (!component) {
        throw new Error(`Component with ID ${componentId} not found`)
      }

      // Import scene manager
      const { sceneManager } = require('./sceneManager')
      
      const scene = sceneManager.getScene(sceneId)
      if (!scene) {
        throw new Error(`Scene with ID ${sceneId} not found`)
      }

      // Add component instance to scene
      const instance = sceneManager.addComponentToScene(sceneId, componentId, props, { x, y })
      
      if (!instance) {
        throw new Error('Failed to add component to scene')
      }

      // Update project
      this.updateProject(prev => sceneManager.exportToProject(prev))

      // Call UI action if available
      if (this.uiActions?.addComponentToScene) {
        this.uiActions.addComponentToScene(sceneId, componentId, x, y, props)
      }

      return {
        success: true,
        data: { 
          instanceId: instance.id,
          componentName: component.name,
          sceneName: scene.name,
          position: { x, y }
        },
        summary: `Added component "${component.name}" to scene "${scene.name}" at position (${x}, ${y})`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add component to scene',
        summary: `Failed to add component to scene: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async uploadImageToBunnyCDN(
    base64Data: string, 
    fileName: string, 
    description: string
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
    try {
      if (!BunnyCDNService.isConfigured()) {
        throw new Error('BunnyCDN is not configured. Please set VITE_BUNNYCDN_STORAGE_ZONE_NAME, VITE_BUNNYCDN_STORAGE_ZONE_API_KEY, VITE_BUNNYCDN_PULL_ZONE_HOSTNAME and VITE_BUNNYCDN_STORAGE_ZONE_HOSTNAME environment variables.')
      }

      const bunnycdn = new BunnyCDNService()
      
      const uploadResult = await bunnycdn.uploadImage({
        base64Data,
        fileName,
        description,
        folder: 'generated',
        tags: ['ai-generated', 'agent']
      })

      return uploadResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image upload failed'
      }
    }
  }

  private async generateProjectPlan(args: {
    projectName: string
    projectDescription: string
    targetUsers: string[]
    coreFeatures: string[]
    preferences?: {
      framework?: 'react' | 'vue' | 'svelte'
      styling?: 'tailwind' | 'styled-components' | 'emotion'
      complexity?: 'simple' | 'moderate' | 'complex'
      timeline?: 'quick' | 'standard' | 'thorough'
    }
  }) {
    try {
      const plan = await ProjectPlanningService.generateProjectPlan(args)
      
      // Attach plan to current project
      plan.projectId = this.project.id
      
      // Update project with the new plan
      this.updateProject(prev => ({
        ...prev,
        plan,
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: { plan },
        summary: `Generated comprehensive project plan for "${args.projectName}" with ${plan.phases.length} phases, ${plan.milestones.length} milestones, and ${plan.phases.reduce((total, phase) => total + phase.tasks.length, 0)} tasks.`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate project plan',
        summary: `Failed to generate project plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private getProjectPlan() {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Project plan not found. Generate a plan first using generate_project_plan.'
      }
    }

    const progress = ProjectPlanningService.getProjectProgress(this.project.plan)
    const nextTasks = ProjectPlanningService.getNextTasks(this.project.plan, 3)

    return {
      success: true,
      data: {
        plan: this.project.plan,
        progress,
        nextTasks: nextTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          status: task.status
        }))
      },
      summary: `Project plan: ${progress.overall.toFixed(1)}% complete, ${progress.milestones.completed}/${progress.milestones.total} milestones achieved, ${nextTasks.length} tasks available.`
    }
  }

  private async updateTaskStatus(args: { taskId: string, status: 'todo' | 'in-progress' | 'review' | 'done', notes?: string }) {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Cannot update task status - project plan not found.'
      }
    }

    try {
      const updatedPlan = await ProjectPlanningService.updateTaskStatus(
        this.project.plan,
        args.taskId,
        args.status,
        args.notes
      )

      // Update project with modified plan
      this.updateProject(prev => ({
        ...prev,
        plan: updatedPlan,
        updatedAt: new Date().toISOString()
      }))

      // Find the updated task for the summary
      const task = updatedPlan.phases
        .flatMap(phase => phase.tasks)
        .find(t => t.id === args.taskId)

      return {
        success: true,
        data: { taskId: args.taskId, newStatus: args.status },
        summary: `Updated task "${task?.title || args.taskId}" status to ${args.status}${args.notes ? ` with notes: ${args.notes}` : ''}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update task status',
        summary: `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private getNextTasks(args: { limit?: number } = {}) {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Cannot get next tasks - project plan not found.'
      }
    }

    const limit = args.limit || 5
    const nextTasks = ProjectPlanningService.getNextTasks(this.project.plan, limit)
    const progress = ProjectPlanningService.getProjectProgress(this.project.plan)

    return {
      success: true,
      data: {
        tasks: nextTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          estimatedHours: task.estimatedHours,
          dependencies: task.dependencies,
          acceptanceCriteria: task.acceptanceCriteria
        })),
        totalAvailable: nextTasks.length,
        projectProgress: progress.overall
      },
      summary: `Found ${nextTasks.length} available tasks. Project is ${progress.overall.toFixed(1)}% complete. Next tasks: ${nextTasks.slice(0, 3).map(t => t.title).join(', ')}${nextTasks.length > 3 ? '...' : ''}`
    }
  }

  private async executeTask(args: { taskId: string, executionNotes?: string }) {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Cannot execute task - project plan not found.'
      }
    }

    try {
      const task = this.project.plan.phases
        .flatMap(phase => phase.tasks)
        .find(t => t.id === args.taskId)

      if (!task) {
        throw new Error(`Task with ID ${args.taskId} not found in the project plan`)
      }

             // Check if task can be executed automatically
       let taskStatus: 'todo' | 'in-progress' | 'review' | 'done' = 'in-progress'
       let executionNotes = args.executionNotes || `Started execution of ${task.type} task`

       // Execute task based on type
       if (task.type === 'component') {
         // Try to generate a component
         try {
           const componentResult = await this.generateComponent({
             name: task.title.replace(/[^a-zA-Z0-9]/g, ''),
             description: task.description,
             requirements: task.acceptanceCriteria.join('\n')
           })
           if (componentResult.success) {
             taskStatus = 'done'
             executionNotes = `Component generated successfully: ${componentResult.summary}`
           }
         } catch (error) {
           taskStatus = 'review'
           executionNotes = `Component generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
         }
       } else {
         // For non-component tasks, mark as in-progress for human review
         taskStatus = 'in-progress'
         executionNotes = `Task started - requires human intervention for ${task.type} type`
       }

       // Update task status
       const updatedPlan = await ProjectPlanningService.updateTaskStatus(
         this.project.plan,
         args.taskId,
         taskStatus,
         executionNotes
       )

             // Update project with modified plan
       this.updateProject(prev => ({
         ...prev,
         plan: updatedPlan,
         updatedAt: new Date().toISOString()
       }))

       return {
         success: true,
         data: { taskId: args.taskId, status: taskStatus, notes: executionNotes },
         summary: `Task "${task.title}" execution completed with status: ${taskStatus}. ${executionNotes}`
       }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute task',
        summary: `Failed to execute task: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async reviewAndIteratePlan(args: { feedback: string, focus_area: string }) {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Cannot review and iterate plan - project plan not found.'
      }
    }

    try {
      // Implement plan review and iteration logic here
      // This is a placeholder and should be replaced with actual implementation
      const reviewResult = {
        success: true,
        data: {
          feedback: args.feedback,
          focus_area: args.focus_area
        },
        summary: `Plan reviewed and iterated successfully. Feedback: ${args.feedback}. Focus area: ${args.focus_area}`
      }

             // For now, just record the feedback and suggestion
       // TODO: Implement actual plan review and iteration logic in ProjectPlanningService
       this.updateProject(prev => ({
         ...prev,
         plan: {
           ...prev.plan!,
           status: 'active' as const,
           updatedAt: new Date().toISOString()
         },
         updatedAt: new Date().toISOString()
       }))

      return reviewResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review and iterate plan',
        summary: `Failed to review and iterate plan: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async startDevelopmentSession(args: { duration_minutes: number, focus_type: string, max_tasks: number }) {
    if (!this.project.plan) {
      return {
        success: false,
        error: 'No project plan exists for this project',
        summary: 'Cannot start development session - project plan not found.'
      }
    }

    try {
      // Implement development session logic here
      // This is a placeholder and should be replaced with actual implementation
      const sessionResult = {
        success: true,
        data: {
          duration_minutes: args.duration_minutes,
          focus_type: args.focus_type,
          max_tasks: args.max_tasks
        },
        summary: `Development session started successfully. Duration: ${args.duration_minutes} minutes, Focus type: ${args.focus_type}, Max tasks: ${args.max_tasks}`
      }

             // Mark the plan as active and record session start
       // TODO: Implement actual development session logic in ProjectPlanningService
       this.updateProject(prev => ({
         ...prev,
         plan: {
           ...prev.plan!,
           status: 'active' as const,
           updatedAt: new Date().toISOString()
         },
         updatedAt: new Date().toISOString()
       }))

      return sessionResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start development session',
        summary: `Failed to start development session: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async reflectOnArtifact(args: { artifactType: string, artifactId: string, aspectsToReview?: string[] }) {
    const { artifactType, artifactId, aspectsToReview = [] } = args
    
    // Find the artifact based on type
    let artifact: any = null
    let artifactDetails = ''
    
    switch (artifactType) {
      case 'component':
        artifact = this.project.components.find(c => c.id === artifactId)
        if (artifact) {
          artifactDetails = `Component "${artifact.name}" with ${artifact.generatedCode?.length || 0} characters of code`
        }
        break
      
      case 'image':
        artifact = this.project.assets?.find(a => a.id === artifactId)
        if (artifact) {
          artifactDetails = `Image "${artifact.name}" (${artifact.size})`
        }
        break
      
      case 'plan':
        if (this.project.plan?.id === artifactId) {
          artifact = this.project.plan
          const totalTasks = artifact.phases.reduce((sum: number, phase: any) => sum + phase.tasks.length, 0)
          artifactDetails = `Project plan with ${artifact.phases.length} phases and ${totalTasks} tasks`
        }
        break
      
      case 'task':
        if (this.project.plan) {
          artifact = this.project.plan.phases
            .flatMap(phase => phase.tasks)
            .find(task => task.id === artifactId)
          if (artifact) {
            artifactDetails = `Task "${artifact.title}" (${artifact.status})`
          }
        }
        break
    }
    
    if (!artifact) {
      return {
        success: false,
        error: `${artifactType} with ID ${artifactId} not found`,
        summary: `Could not find ${artifactType} to reflect on`
      }
    }

    // Default aspects to review if none provided
    const defaultAspects: Record<string, string[]> = {
      component: ['code quality', 'visual design', 'user experience', 'accessibility'],
      image: ['composition', 'style consistency', 'relevance', 'quality'],
      plan: ['completeness', 'feasibility', 'timeline accuracy', 'task dependencies'],
      task: ['clarity', 'scope', 'acceptance criteria', 'estimated effort']
    }
    
    const aspectsToCheck = aspectsToReview.length > 0 ? aspectsToReview : defaultAspects[artifactType] || []
    
    // Analyze project context and coherence
    const projectState = this.analyzeProjectState()
    
    // Create reflection insights with project awareness
    const insights = {
      artifactType,
      artifactId,
      artifactDetails,
      aspectsReviewed: aspectsToCheck,
      timestamp: new Date().toISOString(),
      recommendations: [] as string[],
      projectAlignment: {
        fitsProjectVision: true,
        maintainsConsistency: true,
        advancesGoals: true,
        createsOpportunities: [] as string[]
      }
    }
    
    // Project-level analysis
    if (artifactType === 'component') {
      // Check consistency with existing components
      const existingComponentStyles = this.project.components
        .filter(c => c.id !== artifactId)
        .map(c => {
          const hasButton = c.generatedCode?.includes('Button')
          const hasCard = c.generatedCode?.includes('Card')
          const hasTailwind = c.generatedCode?.includes('className')
          return { hasButton, hasCard, hasTailwind }
        })
      
      // Check if this component creates new integration opportunities
      if (artifact.name.toLowerCase().includes('wizard') || artifact.name.toLowerCase().includes('magic')) {
        insights.projectAlignment.createsOpportunities.push(
          'Could integrate with spell management system',
          'Opportunity to create wizard character progression'
        )
      }
      
      // Check component cohesion
      if (this.project.components.length > 3 && !artifact.generatedCode?.includes('import')) {
        insights.recommendations.push('Consider importing and reusing existing components for consistency')
      }
    }
    
    if (artifactType === 'image') {
      // Check if image style matches project theme
      const projectName = this.project.name.toLowerCase()
      if (projectName.includes('wizard') && !artifact.prompt?.toLowerCase().includes('magic')) {
        insights.recommendations.push('Image may not align with wizard/magic theme of the project')
        insights.projectAlignment.fitsProjectVision = false
      }
    }
    
    if (artifactType === 'plan') {
      // Analyze if plan advances toward project completion
      const completedTasks = artifact.phases
        .flatMap((phase: any) => phase.tasks)
        .filter((task: any) => task.status === 'done').length
      const totalTasks = artifact.phases.reduce((sum: number, phase: any) => sum + phase.tasks.length, 0)
      
      if (completedTasks / totalTasks < 0.2 && this.project.components.length > 5) {
        insights.recommendations.push('Plan progress is behind component creation - consider updating task statuses')
      }
    }
    
    // Add artifact-specific recommendations
    if (artifactType === 'component' && artifact.generatedCode) {
      if (!artifact.generatedCode.includes('aria-')) {
        insights.recommendations.push('Consider adding ARIA labels for better accessibility')
      }
      if (!artifact.generatedCode.includes('useState') && artifact.generatedCode.includes('onClick')) {
        insights.recommendations.push('Component has interactions but no state management')
      }
      
      // Check if component advances the project theme
      const projectTheme = this.project.name.toLowerCase()
      const componentContent = artifact.generatedCode.toLowerCase()
      
      if (projectTheme.includes('wizard') || projectTheme.includes('magic')) {
        const hasMagicalElements = componentContent.includes('spell') || 
                                   componentContent.includes('magic') || 
                                   componentContent.includes('wizard') ||
                                   componentContent.includes('wand') ||
                                   componentContent.includes('potion')
        
        if (!hasMagicalElements) {
          insights.recommendations.push(`Component could better embrace the "${this.project.name}" theme with magical elements`)
          insights.projectAlignment.fitsProjectVision = false
        }
      }
    }
    
    // Generate strategic recommendations based on project state
    if (this.project.components.length === 0 && artifactType === 'component') {
      insights.recommendations.push('Great start! This is the first component. Consider building complementary UI elements next.')
    } else if (this.project.components.length > 5 && artifactType === 'component') {
      insights.recommendations.push('With multiple components now, consider creating a scene to showcase them together')
    }
    
    if (this.project.assets && this.project.assets.length > 3 && artifactType === 'image') {
      insights.recommendations.push('Multiple assets created. Consider building components that utilize these images')
    }
    
    return {
      success: true,
      data: insights,
      summary: `Reflected on ${artifactDetails} within ${this.project.name} context. Project alignment: ${
        insights.projectAlignment.fitsProjectVision ? '✓' : '✗'
      }. Found ${insights.recommendations.length} suggestions and ${
        insights.projectAlignment.createsOpportunities.length
      } new opportunities.`
    }
  }

  private async capturePreviewScreenshot(args: { componentId?: string, captureMode?: string }) {
    try {
      // Import screenshot service
      const { ScreenshotService } = await import('./screenshotService')
      
      // Capture the screenshot
      const screenshot = await ScreenshotService.capturePreview({
        componentId: args.componentId,
        captureMode: args.captureMode as 'full' | 'component' | 'viewport' || 'viewport'
      })
      
      // Analyze the screenshot for quality
      const analysis = await ScreenshotService.analyzeScreenshot(screenshot)
      
      // Try to upload to CDN if available
      let cdnUrl: string | undefined
      if (BunnyCDNService.isConfigured()) {
        const bunnycdn = new BunnyCDNService()
        const uploadResult = await ScreenshotService.captureAndUploadToCDN(screenshot, bunnycdn)
        if (uploadResult.success && uploadResult.cdnUrl) {
          cdnUrl = uploadResult.cdnUrl
        }
      }
      
      // Store screenshot reference in project
      this.updateProject(prev => ({
        ...prev,
        screenshots: [
          ...(prev.screenshots || []),
          {
            id: screenshot.id,
            componentId: screenshot.componentId,
            timestamp: screenshot.timestamp,
            cdnUrl,
            analysis: {
              hasContent: analysis.hasContent,
              quality: analysis.quality,
              dimensions: analysis.dimensions
            }
          }
        ],
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: {
          screenshotId: screenshot.id,
          componentId: screenshot.componentId,
          captureMode: screenshot.captureMode,
          dimensions: `${screenshot.width}x${screenshot.height}`,
          quality: analysis.quality,
          cdnUrl,
          hasContent: analysis.hasContent,
          suggestions: analysis.suggestions
        },
        summary: `Captured ${screenshot.captureMode} screenshot (${screenshot.width}x${screenshot.height}, ${analysis.quality} quality).${
          cdnUrl ? ` Uploaded to CDN: ${cdnUrl}` : ' Stored locally.'
        }${analysis.suggestions ? ` Suggestions: ${analysis.suggestions.join('; ')}` : ''}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to capture preview screenshot',
        summary: `Failed to capture preview screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}