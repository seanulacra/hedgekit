import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Eye, EyeOff, Lock, Unlock, Trash2, Move, Plus } from 'lucide-react'
import { Scene, ComponentInstance, ComponentSchema } from '../types/schema'
import { useSceneManager } from '../hooks/useSceneManager'

interface SceneInstanceManagerProps {
  scene: Scene | null
  componentLibrary: ComponentSchema[]
  project: any
  onInstanceSelect?: (instance: ComponentInstance | null) => void
  selectedInstanceId?: string
}

export function SceneInstanceManager({ 
  scene, 
  componentLibrary, 
  project,
  onInstanceSelect,
  selectedInstanceId 
}: SceneInstanceManagerProps) {
  const sceneManager = useSceneManager(project)

  const handleDeleteInstance = (instanceId: string) => {
    if (!scene) return
    sceneManager.removeComponentInstance(scene.id, instanceId)
  }

  const handleToggleVisibility = (instance: ComponentInstance) => {
    if (!scene) return
    sceneManager.updateComponentInstance(scene.id, instance.id, {
      metadata: {
        ...instance.metadata,
        visible: !instance.metadata?.visible
      }
    })
  }

  const handleToggleLock = (instance: ComponentInstance) => {
    if (!scene) return
    sceneManager.updateComponentInstance(scene.id, instance.id, {
      metadata: {
        ...instance.metadata,
        locked: !instance.metadata?.locked
      }
    })
  }

  const handleAddComponent = (componentId: string) => {
    if (!scene) return
    
    // Find a good position (offset from existing instances)
    const existingInstances = scene.instances?.length || 0
    const position = {
      x: 100 + (existingInstances * 50) % 400,
      y: 100 + Math.floor(existingInstances / 8) * 150
    }

    sceneManager.addComponentToScene(scene.id, componentId, {}, position)
  }

  if (!scene) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <div className="text-sm">No scene selected</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const instances = scene.instances || []
  const availableComponents = componentLibrary.filter(comp => 
    !instances.some(inst => inst.componentId === comp.id)
  )

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Scene Info */}
      <div className="p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{scene.name}</h3>
          <Badge variant="outline" className="text-xs">
            {instances.length} components
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {scene.layout.container?.width || 800} × {scene.layout.container?.height || 600}
        </div>
      </div>

      {/* Add Component */}
      {availableComponents.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">Add Component</div>
          <Select onValueChange={handleAddComponent}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Choose component..." />
            </SelectTrigger>
            <SelectContent>
              {availableComponents.map(component => (
                <SelectItem key={component.id} value={component.id}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    {component.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Instance List */}
      <div className="flex-1 space-y-2 min-h-0">
        <div className="text-sm font-medium">Components in Scene</div>
        
        {instances.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            <div className="text-sm">No components yet</div>
            <div className="text-xs mt-1">Add components to start building your scene</div>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {instances.map(instance => {
              const component = componentLibrary.find(c => c.id === instance.componentId)
              if (!component) return null

              const isSelected = selectedInstanceId === instance.id
              const isVisible = instance.metadata?.visible !== false
              const isLocked = instance.metadata?.locked

              return (
                <div
                  key={instance.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${!isVisible ? 'opacity-50' : ''}`}
                  onClick={() => onInstanceSelect?.(instance)}
                >
                  {/* Component Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{component.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {component.source}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      {/* Visibility Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleVisibility(instance)
                        }}
                      >
                        {isVisible ? 
                          <Eye className="h-3 w-3" /> : 
                          <EyeOff className="h-3 w-3 text-muted-foreground" />
                        }
                      </Button>

                      {/* Lock Toggle */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleLock(instance)
                        }}
                      >
                        {isLocked ? 
                          <Lock className="h-3 w-3 text-amber-600" /> : 
                          <Unlock className="h-3 w-3" />
                        }
                      </Button>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteInstance(instance.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Position Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Move className="h-3 w-3" />
                      ({instance.position.x}, {instance.position.y})
                    </div>
                    {Object.keys(instance.props).length > 0 && (
                      <div>{Object.keys(instance.props).length} props</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}