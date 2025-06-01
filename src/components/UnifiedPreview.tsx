import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Eye, Play, Square, Layers, Component } from 'lucide-react'
import { SceneLiveView, useSceneLiveView } from './SceneLiveView'
import { SceneCreationModal } from './SceneCreationModal'
import { EmbeddedPreview } from './EmbeddedPreview'
import { EmbeddedScenePreview } from './EmbeddedScenePreview'
import { useSceneManager } from '../hooks/useSceneManager'
import { ProjectSchema, ComponentSchema, ComponentInstance } from '../types/schema'
import type { UIActions } from '../services/agentTools'

interface UnifiedPreviewProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  uiActions?: UIActions
}

export function UnifiedPreview({ project, onUpdateProject, uiActions }: UnifiedPreviewProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<'component' | 'scene'>('component')
  
  const sceneManager = useSceneManager(project)
  const activeScene = sceneManager.getActiveScene()
  const liveScene = useSceneLiveView(activeScene?.id || null)

  // Set up reactive updates
  useEffect(() => {
    const cleanup = sceneManager.updateProjectWithScenes(onUpdateProject)
    return cleanup
  }, [sceneManager, onUpdateProject])

  // Ensure we have a default scene
  useEffect(() => {
    if (!project.scenes || project.scenes.length === 0) {
      sceneManager.ensureDefaultScene()
    } else if (!activeScene && project.scenes.length > 0) {
      sceneManager.setActiveScene(project.scenes[0].id)
    }
  }, [project.scenes, activeScene, sceneManager])

  // Handle component changes (only when component count changes to avoid loops)
  useEffect(() => {
    if (project.components) {
      project.components.forEach(component => {
        sceneManager.handleComponentChange(component, 'updated')
      })
    }
  }, [project.components.length, sceneManager]) // Only re-run when component count changes

  const handleComponentSelect = (componentId: string) => {
    setSelectedComponentId(componentId)
    // Highlight instances in scene
    if (liveScene) {
      const instances = liveScene.instances.filter(inst => inst.componentId === componentId)
      if (instances.length > 0) {
        setSelectedInstanceId(instances[0].id)
      }
    }
  }

  const handleInstanceSelect = (instance: ComponentInstance | null) => {
    if (instance) {
      setSelectedInstanceId(instance.id)
      setSelectedComponentId(instance.componentId)
    } else {
      setSelectedInstanceId('')
    }
  }

  const handleAddToScene = (componentId: string) => {
    if (!liveScene) return
    
    // Find a good position (offset from existing instances)
    const existingInstances = liveScene.instances.length
    const position = {
      x: 100 + (existingInstances * 50) % 400,
      y: 100 + Math.floor(existingInstances / 8) * 150
    }

    sceneManager.addComponentToScene(liveScene.id, componentId, {}, position)
  }

  const availableComponents = project.components || []
  const selectedComponent = availableComponents.find(c => c.id === selectedComponentId)

  const ComponentTestingArea = () => (
    <div className="h-full flex flex-col">
      <CardContent className="flex-1 flex flex-col space-y-3 p-4">
        {/* Component Selector */}
        <Select value={selectedComponentId} onValueChange={handleComponentSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Choose component..." />
          </SelectTrigger>
          <SelectContent>
            {availableComponents.map(component => (
              <SelectItem key={component.id} value={component.id}>
                {component.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Component Info */}
        {selectedComponent && (
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => handleAddToScene(selectedComponent.id)}
              disabled={!liveScene}
            >
              Add to Scene
            </Button>
            <span className="text-xs text-muted-foreground">
              {Object.keys(selectedComponent.props).length} props • {selectedComponent.source}
            </span>
          </div>
        )}

      </CardContent>
    </div>
  )

  const SceneCompositionArea = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          {liveScene && (
            <span className="text-xs text-muted-foreground">{liveScene.instances.length} instances</span>
          )}
        </div>
        <SceneCreationModal
          project={project}
          onUpdateProject={onUpdateProject}
          uiActions={uiActions}
          trigger={
            <Button size="sm" variant="outline">
              New Scene
            </Button>
          }
        />
      </div>
      
      <div className="flex-1">
        <SceneLiveView
          scene={liveScene}
          componentLibrary={project.components}
          onInstanceSelect={handleInstanceSelect}
          selectedInstanceId={selectedInstanceId}
        />
      </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex items-center gap-4 mb-2">
        <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)}>
          <TabsList className="h-8">
            <TabsTrigger value="component" className="text-xs">Components</TabsTrigger>
            <TabsTrigger value="scene" className="text-xs">Scenes</TabsTrigger>
          </TabsList>
        </Tabs>

        {project.scenes?.length > 0 && (
          <Select 
            value={activeScene?.id || ''} 
            onValueChange={(sceneId) => sceneManager.setActiveScene(sceneId)}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Scene..." />
            </SelectTrigger>
            <SelectContent>
              {(project.scenes || []).map(scene => (
                <SelectItem key={scene.id} value={scene.id} className="text-xs">
                  {scene.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Preview Content - Side by side layout */}
      <div className="flex-1 flex gap-4">
        {/* Left Side - Component Testing or Scene Composition */}
        <div className="w-80 flex-shrink-0">
          {previewMode === 'component' && <ComponentTestingArea />}
          {previewMode === 'scene' && <SceneCompositionArea />}
        </div>
        
        {/* Right Side - Live Preview */}
        <div className="flex-1 min-w-0">
          {previewMode === 'component' ? (
            <EmbeddedPreview 
              project={project}
              focusComponent={selectedComponentId}
              className="h-full"
            />
          ) : (
            <EmbeddedScenePreview 
              project={project}
              scene={activeScene}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}