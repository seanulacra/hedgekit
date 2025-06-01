import { ComponentSchema, Scene, ComponentInstance, SceneLayout, ProjectSchema } from '../types/schema'

export type SceneChangeListener = (sceneId: string, scene: Scene) => void
export type ComponentChangeListener = (componentId: string, component: ComponentSchema) => void

export class SceneManager {
  private scenes: Map<string, Scene> = new Map()
  private activeSceneId: string | null = null
  private sceneChangeListeners: Set<SceneChangeListener> = new Set()
  private componentChangeListeners: Set<ComponentChangeListener> = new Set()
  private componentLibrary: Map<string, ComponentSchema> = new Map()

  constructor() {
    // Initialize with empty state
  }

  // Scene Management
  createScene(name: string, layout: SceneLayout): Scene {
    const scene: Scene = {
      id: `scene_${Date.now()}`,
      name,
      description: '',
      layout,
      instances: [],
      viewport: {
        width: layout.container.width,
        height: layout.container.height,
        scale: 1
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.scenes.set(scene.id, scene)
    this.notifySceneChange(scene.id, scene)
    return scene
  }

  getScene(sceneId: string): Scene | undefined {
    return this.scenes.get(sceneId)
  }

  getAllScenes(): Scene[] {
    return Array.from(this.scenes.values())
  }

  updateScene(sceneId: string, updates: Partial<Scene>): Scene | null {
    const scene = this.scenes.get(sceneId)
    if (!scene) return null

    const updatedScene = {
      ...scene,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, updatedScene)
    this.notifySceneChange(sceneId, updatedScene)
    return updatedScene
  }

  deleteScene(sceneId: string): boolean {
    const deleted = this.scenes.delete(sceneId)
    if (deleted && this.activeSceneId === sceneId) {
      this.activeSceneId = null
    }
    return deleted
  }

  // Active Scene Management
  setActiveScene(sceneId: string | null): boolean {
    if (sceneId && !this.scenes.has(sceneId)) {
      return false
    }
    this.activeSceneId = sceneId
    return true
  }

  getActiveScene(): Scene | null {
    if (!this.activeSceneId) return null
    return this.scenes.get(this.activeSceneId) || null
  }

  getActiveSceneId(): string | null {
    return this.activeSceneId
  }

  // Component Instance Management
  addComponentInstance(sceneId: string, componentId: string, props: Record<string, any> = {}, position = { x: 0, y: 0 }, size = { width: 'auto' as const, height: 'auto' as const }): ComponentInstance | null {
    const scene = this.scenes.get(sceneId)
    if (!scene || !this.componentLibrary.has(componentId)) {
      return null
    }

    const instance: ComponentInstance = {
      id: `instance_${Date.now()}`,
      componentId,
      props,
      position,
      size,
      metadata: {
        visible: true,
        locked: false
      }
    }

    const updatedScene = {
      ...scene,
      instances: [...scene.instances, instance],
      updatedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, updatedScene)
    this.notifySceneChange(sceneId, updatedScene)
    return instance
  }

  updateComponentInstance(sceneId: string, instanceId: string, updates: Partial<ComponentInstance>): ComponentInstance | null {
    const scene = this.scenes.get(sceneId)
    if (!scene) return null

    const instanceIndex = scene.instances.findIndex(inst => inst.id === instanceId)
    if (instanceIndex === -1) return null

    const updatedInstance = {
      ...scene.instances[instanceIndex],
      ...updates
    }

    const updatedInstances = [...scene.instances]
    updatedInstances[instanceIndex] = updatedInstance

    const updatedScene = {
      ...scene,
      instances: updatedInstances,
      updatedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, updatedScene)
    this.notifySceneChange(sceneId, updatedScene)
    return updatedInstance
  }

  removeComponentInstance(sceneId: string, instanceId: string): boolean {
    const scene = this.scenes.get(sceneId)
    if (!scene) return false

    const updatedInstances = scene.instances.filter(inst => inst.id !== instanceId)
    if (updatedInstances.length === scene.instances.length) {
      return false // Instance not found
    }

    const updatedScene = {
      ...scene,
      instances: updatedInstances,
      updatedAt: new Date().toISOString()
    }

    this.scenes.set(sceneId, updatedScene)
    this.notifySceneChange(sceneId, updatedScene)
    return true
  }

  // Component Library Management
  updateComponentLibrary(components: ComponentSchema[]): void {
    // Clear existing library
    this.componentLibrary.clear()
    
    // Add all components
    if (components) {
      components.forEach(component => {
        this.componentLibrary.set(component.id, component)
      })

      // Notify about component changes to trigger scene updates
      components.forEach(component => {
        this.notifyComponentChange(component.id, component)
      })
    }
  }

  getComponent(componentId: string): ComponentSchema | undefined {
    return this.componentLibrary.get(componentId)
  }

  // Get all component instances that use a specific component
  getInstancesOfComponent(componentId: string): Array<{ sceneId: string, instance: ComponentInstance }> {
    const instances: Array<{ sceneId: string, instance: ComponentInstance }> = []
    
    this.scenes.forEach((scene, sceneId) => {
      scene.instances.forEach(instance => {
        if (instance.componentId === componentId) {
          instances.push({ sceneId, instance })
        }
      })
    })

    return instances
  }

  // Reactive Updates - when a component primitive changes
  onComponentChange(componentId: string, updatedComponent: ComponentSchema): void {
    // Check if component actually changed to avoid unnecessary updates
    const existingComponent = this.componentLibrary.get(componentId)
    if (existingComponent && 
        existingComponent.generatedCode === updatedComponent.generatedCode &&
        JSON.stringify(existingComponent.props) === JSON.stringify(updatedComponent.props)) {
      return // No meaningful changes
    }

    this.componentLibrary.set(componentId, updatedComponent)
    this.notifyComponentChange(componentId, updatedComponent)

    // Find all scenes using this component and trigger updates
    const affectedScenes = new Set<string>()
    this.scenes.forEach((scene, sceneId) => {
      const hasInstance = scene.instances.some(inst => inst.componentId === componentId)
      if (hasInstance) {
        affectedScenes.add(sceneId)
      }
    })

    // Trigger scene change notifications for affected scenes (debounced)
    setTimeout(() => {
      affectedScenes.forEach(sceneId => {
        const scene = this.scenes.get(sceneId)
        if (scene) {
          this.notifySceneChange(sceneId, scene)
        }
      })
    }, 0)
  }

  // Event Listeners
  addSceneChangeListener(listener: SceneChangeListener): void {
    this.sceneChangeListeners.add(listener)
  }

  removeSceneChangeListener(listener: SceneChangeListener): void {
    this.sceneChangeListeners.delete(listener)
  }

  addComponentChangeListener(listener: ComponentChangeListener): void {
    this.componentChangeListeners.add(listener)
  }

  removeComponentChangeListener(listener: ComponentChangeListener): void {
    this.componentChangeListeners.delete(listener)
  }

  private notifySceneChange(sceneId: string, scene: Scene): void {
    this.sceneChangeListeners.forEach(listener => {
      try {
        listener(sceneId, scene)
      } catch (error) {
        console.error('Error in scene change listener:', error)
      }
    })
  }

  private notifyComponentChange(componentId: string, component: ComponentSchema): void {
    this.componentChangeListeners.forEach(listener => {
      try {
        listener(componentId, component)
      } catch (error) {
        console.error('Error in component change listener:', error)
      }
    })
  }

  // Utility methods for project integration
  loadFromProject(project: ProjectSchema): void {
    // Load component library
    this.updateComponentLibrary(project.components || [])

    // Load scenes
    this.scenes.clear()
    if (project.scenes) {
      project.scenes.forEach(scene => {
        this.scenes.set(scene.id, scene)
      })
    }

    // Set active scene
    this.activeSceneId = project.activeSceneId || null
  }

  exportToProject(project: ProjectSchema): ProjectSchema {
    return {
      ...project,
      scenes: this.getAllScenes(),
      activeSceneId: this.activeSceneId || undefined
    }
  }

  // Create a default scene for projects that don't have any
  createDefaultScene(): Scene {
    return this.createScene('Main Scene', {
      type: 'freeform',
      container: {
        width: 1200,
        height: 800,
        background: '#ffffff'
      }
    })
  }
}

// Global instance - can be moved to context if needed
export const sceneManager = new SceneManager()