import { useEffect, useCallback } from 'react'
import { sceneManager } from '../services/sceneManager'
import { ProjectSchema, ComponentSchema, Scene } from '../types/schema'

export function useSceneManager(project: ProjectSchema | null) {
  // Sync scene manager with project data
  useEffect(() => {
    if (!project) return

    // Load project data into scene manager
    sceneManager.loadFromProject(project)
  }, [project])

  // Update project when scenes change
  const updateProjectWithScenes = useCallback((onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void) => {
    const handleSceneChange = () => {
      onUpdateProject(prev => sceneManager.exportToProject(prev))
    }

    sceneManager.addSceneChangeListener(handleSceneChange)
    return () => sceneManager.removeSceneChangeListener(handleSceneChange)
  }, [])

  // Handle component changes and trigger reactive updates
  const handleComponentChange = useCallback((component: ComponentSchema, action: 'added' | 'updated' | 'removed') => {
    if (action === 'removed') {
      // Find all instances using this component and remove them
      const instances = sceneManager.getInstancesOfComponent(component.id)
      instances.forEach(({ sceneId, instance }) => {
        sceneManager.removeComponentInstance(sceneId, instance.id)
      })
    } else {
      // Update or add component to library and trigger reactive updates
      sceneManager.onComponentChange(component.id, component)
    }
  }, [])

  // Scene management functions
  const createScene = useCallback((name: string, layout = {
    type: 'freeform' as const,
    container: { width: 1200, height: 800, background: '#ffffff' }
  }) => {
    return sceneManager.createScene(name, layout)
  }, [])

  const setActiveScene = useCallback((sceneId: string | null) => {
    return sceneManager.setActiveScene(sceneId)
  }, [])

  const getActiveScene = useCallback(() => {
    return sceneManager.getActiveScene()
  }, [])

  const getAllScenes = useCallback(() => {
    return sceneManager.getAllScenes()
  }, [])

  const deleteScene = useCallback((sceneId: string) => {
    return sceneManager.deleteScene(sceneId)
  }, [])

  // Component instance management
  const addComponentToScene = useCallback((sceneId: string, componentId: string, props = {}, position = { x: 100, y: 100 }) => {
    return sceneManager.addComponentInstance(sceneId, componentId, props, position)
  }, [])

  const updateComponentInstance = useCallback((sceneId: string, instanceId: string, updates: any) => {
    return sceneManager.updateComponentInstance(sceneId, instanceId, updates)
  }, [])

  const removeComponentInstance = useCallback((sceneId: string, instanceId: string) => {
    return sceneManager.removeComponentInstance(sceneId, instanceId)
  }, [])

  // Create default scene if project has no scenes
  const ensureDefaultScene = useCallback(() => {
    const scenes = sceneManager.getAllScenes()
    if (scenes.length === 0) {
      const defaultScene = sceneManager.createDefaultScene()
      sceneManager.setActiveScene(defaultScene.id)
      return defaultScene
    }
    return scenes[0]
  }, [])

  return {
    // Scene management
    createScene,
    setActiveScene,
    getActiveScene,
    getAllScenes,
    deleteScene,
    ensureDefaultScene,

    // Component instance management
    addComponentToScene,
    updateComponentInstance,
    removeComponentInstance,

    // Reactive updates
    updateProjectWithScenes,
    handleComponentChange,

    // Direct access to scene manager if needed
    sceneManager
  }
}