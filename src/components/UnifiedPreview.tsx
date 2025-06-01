import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Eye, Play, Square, Layers, Component } from 'lucide-react'
import { SceneLiveView, useSceneLiveView } from './SceneLiveView'
import { WebContainerPreview } from './WebContainerPreview'
import { useSceneManager } from '../hooks/useSceneManager'
import { ProjectSchema, ComponentSchema, ComponentInstance } from '../types/schema'

interface UnifiedPreviewProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
}

export function UnifiedPreview({ project, onUpdateProject }: UnifiedPreviewProps) {
  const [selectedComponentId, setSelectedComponentId] = useState<string>('')
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('')
  const [previewMode, setPreviewMode] = useState<'split' | 'component' | 'scene'>('split')
  
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

  // Handle component changes
  useEffect(() => {
    if (project.components) {
      project.components.forEach(component => {
        sceneManager.handleComponentChange(component, 'updated')
      })
    }
  }, [project.components, sceneManager])

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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Component className="h-5 w-5" />
            Component Testing
          </CardTitle>
          <Badge variant="outline">{availableComponents.length} components</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Component Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Component</label>
          <Select value={selectedComponentId} onValueChange={handleComponentSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a component to test..." />
            </SelectTrigger>
            <SelectContent>
              {availableComponents.map(component => (
                <SelectItem key={component.id} value={component.id}>
                  <div className="flex items-center gap-2">
                    <Component className="h-4 w-4" />
                    {component.name}
                    <Badge variant="secondary" className="text-xs">
                      {component.source}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Component Info */}
        {selectedComponent && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedComponent.name}</h4>
              <Button 
                size="sm" 
                onClick={() => handleAddToScene(selectedComponent.id)}
                disabled={!liveScene}
              >
                <Play className="h-4 w-4 mr-2" />
                Add to Scene
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Props:</span> {Object.keys(selectedComponent.props).length}</p>
              <p><span className="font-medium">Source:</span> {selectedComponent.source}</p>
              {selectedComponent.generationMethod && (
                <p><span className="font-medium">Generated:</span> {selectedComponent.generationMethod}</p>
              )}
            </div>

            {/* Props Preview */}
            {Object.keys(selectedComponent.props).length > 0 && (
              <div className="border rounded p-3 space-y-2">
                <h5 className="text-xs font-medium text-muted-foreground">PROPS</h5>
                {Object.entries(selectedComponent.props).map(([name, prop]) => (
                  <div key={name} className="flex justify-between text-xs">
                    <span className="font-mono">{name}</span>
                    <span className="text-muted-foreground">
                      {prop.type}{prop.required && '*'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Live Component Preview */}
            <div className="flex-1 border rounded bg-white p-4 min-h-[200px]">
              <div className="h-full">
                <WebContainerPreview 
                  projectSchema={project} 
                  focusComponent={selectedComponent.id}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedComponent && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Component className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a component to test</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const SceneCompositionArea = () => (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Scene Composition
          </CardTitle>
          <div className="flex items-center gap-2">
            {liveScene && (
              <Badge variant="outline">{liveScene.instances.length} instances</Badge>
            )}
            <Button size="sm" variant="outline">
              <Square className="h-4 w-4 mr-2" />
              New Scene
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <SceneLiveView
          scene={liveScene}
          componentLibrary={project.components}
          onInstanceSelect={handleInstanceSelect}
          selectedInstanceId={selectedInstanceId}
        />
      </CardContent>
    </Card>
  )

  return (
    <div className="h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between mb-4">
        <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="split" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Split View
            </TabsTrigger>
            <TabsTrigger value="component">Component Only</TabsTrigger>
            <TabsTrigger value="scene">Scene Only</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Scene Selector */}
        {project.scenes?.length > 0 && (
          <Select 
            value={activeScene?.id || ''} 
            onValueChange={(sceneId) => sceneManager.setActiveScene(sceneId)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select scene..." />
            </SelectTrigger>
            <SelectContent>
              {(project.scenes || []).map(scene => (
                <SelectItem key={scene.id} value={scene.id}>
                  {scene.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1">
        {previewMode === 'split' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <ComponentTestingArea />
            <SceneCompositionArea />
          </div>
        )}
        
        {previewMode === 'component' && (
          <ComponentTestingArea />
        )}
        
        {previewMode === 'scene' && (
          <SceneCompositionArea />
        )}
      </div>
    </div>
  )
}