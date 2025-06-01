import { ComponentGenerator } from '../lib/generator'
import { V0GenerationService } from './v0Generation'
import type { ProjectSchema, ComponentSchema, ImageAsset } from '../types/schema'

// Tool definitions for OpenAI function calling
export const agentTools = [
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
      description: "Generate a new React component using OpenAI or v0",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the component"
          },
          description: {
            type: "string", 
            description: "Description of what the component should do"
          },
          provider: {
            type: "string",
            enum: ["openai", "v0"],
            description: "Which AI service to use for generation"
          }
        },
        required: ["name", "description"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "generate_image_asset",
      description: "Generate an image asset using OpenAI's gpt-image-1 model",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the image asset"
          },
          prompt: {
            type: "string",
            description: "Detailed prompt for image generation"
          },
          background: {
            type: "string",
            enum: ["transparent", "opaque", "auto"],
            description: "Background type for the image"
          },
          size: {
            type: "string",
            enum: ["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"],
            description: "Size of the generated image"
          }
        },
        required: ["name", "prompt"]
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
      description: "Switch the UI to a specific tab (build, project, or preview)",
      parameters: {
        type: "object",
        properties: {
          tab: {
            type: "string",
            enum: ["build", "project", "preview"],
            description: "The tab to switch to: 'build' for Build Tools, 'project' for Project view, 'preview' for Live Preview"
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
  }
]

// UI action callbacks type
export interface UIActions {
  switchTab?: (tab: 'build' | 'project' | 'preview') => void
  showComponentCode?: (componentId: string) => void
  focusPreviewComponent?: (componentId: string) => void
  createScene?: (name: string, description: string) => void
  addComponentToScene?: (sceneId: string, componentId: string, x: number, y: number, props?: any) => void
}

// Tool execution functions
export class AgentToolExecutor {
  constructor(
    private project: ProjectSchema,
    private updateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void,
    private uiActions?: UIActions
  ) {}

  async executeFunction(functionName: string, args: any): Promise<any> {
    switch (functionName) {
      case "analyze_project_state":
        return this.analyzeProjectState()
      
      case "generate_component":
        return this.generateComponent(args)
      
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

  private async generateComponent(args: { name: string, description: string, provider?: string }) {
    try {
      const { name, description, provider = 'openai' } = args
      
      let component: ComponentSchema
      
      if (provider === 'v0' && V0GenerationService.isV0Available()) {
        const result = await V0GenerationService.generateComponent({
          prompt: description,
          projectContext: {
            framework: this.project.framework,
            components: this.project.components.map(c => c.name),
            dependencies: this.project.dependencies || {}
          }
        })
        
        component = {
          id: `comp-${Date.now()}`,
          name: result.componentName || name,
          type: 'component',
          framework: 'react',
          props: {},
          source: 'custom',
          generatedCode: result.code,
          generationMethod: 'v0'
        }
      } else {
        const generator = new ComponentGenerator()
        generator.setApiKey(import.meta.env.VITE_OPEN_AI_KEY)
        
        const result = await generator.generateComponent({
          prompt: description,
          projectSchema: this.project
        })
        
        component = result
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
        summary: `Generated component "${component.name}" using ${provider}. Added to project.`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Component generation failed',
        summary: `Failed to generate component: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async generateImageAsset(args: { name: string, prompt: string, background?: string, size?: string }) {
    try {
      const { name, prompt, background = 'transparent', size = '1024x1024' } = args
      
      // Dynamic import to avoid build conflicts
      const { ImageGenerationService } = await import('./imageGeneration')
      
      const result = await ImageGenerationService.generateImage({
        prompt,
        model: 'gpt-image-1',
        background: background as any,
        size,
        output_format: 'png',
        quality: 'high'
      })

      const imageAsset: ImageAsset = {
        id: `img-${Date.now()}`,
        name,
        prompt,
        base64: result.data[0].b64_json!,
        format: 'png',
        size,
        background: background as any,
        model: 'gpt-image-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Update project with new asset
      this.updateProject(prev => ({
        ...prev,
        assets: [...(prev.assets || []), imageAsset],
        updatedAt: new Date().toISOString()
      }))

      return {
        success: true,
        data: { imageAsset },
        summary: `Generated image "${name}" with prompt "${prompt}". Added to project assets.`
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

      // Dynamic import to avoid build conflicts
      const { ImageGenerationService } = await import('./imageGeneration')
      
      const result = await ImageGenerationService.editImage(
        asset.base64,
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
        sample_components: ['SampleButton', 'SampleCard', 'SampleForm', 'CharacterCard']
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
}