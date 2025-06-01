import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Eye, EyeOff, Lock, Unlock, Move, RotateCcw } from 'lucide-react'
import { Scene, ComponentInstance, ComponentSchema } from '../types/schema'
import { sceneManager } from '../services/sceneManager'

interface SceneLiveViewProps {
  scene: Scene | null
  componentLibrary: ComponentSchema[]
  onInstanceSelect?: (instance: ComponentInstance | null) => void
  selectedInstanceId?: string
}

export function SceneLiveView({ 
  scene, 
  componentLibrary, 
  onInstanceSelect,
  selectedInstanceId 
}: SceneLiveViewProps) {
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  if (!scene) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="text-center">
          <div className="text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Active Scene</h3>
            <p className="text-sm">Create a scene to start composing components</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getComponentDefinition = (componentId: string): ComponentSchema | undefined => {
    return componentLibrary.find(comp => comp.id === componentId)
  }

  const handleInstanceMouseDown = (e: React.MouseEvent, instance: ComponentInstance) => {
    if (instance.metadata?.locked) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const offsetX = e.clientX - rect.left - instance.position.x
    const offsetY = e.clientY - rect.top - instance.position.y

    setDraggedInstance(instance.id)
    setDragOffset({ x: offsetX, y: offsetY })
    onInstanceSelect?.(instance)

    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedInstance || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragOffset.x
    const newY = e.clientY - rect.top - dragOffset.y

    // Update instance position
    sceneManager.updateComponentInstance(scene.id, draggedInstance, {
      position: { 
        x: Math.max(0, Math.min(newX, scene.layout.container.width - 100)), 
        y: Math.max(0, Math.min(newY, scene.layout.container.height - 100))
      }
    })
  }

  const handleMouseUp = () => {
    setDraggedInstance(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const toggleInstanceVisibility = (instance: ComponentInstance) => {
    sceneManager.updateComponentInstance(scene.id, instance.id, {
      metadata: {
        ...instance.metadata,
        visible: !instance.metadata?.visible
      }
    })
  }

  const toggleInstanceLock = (instance: ComponentInstance) => {
    sceneManager.updateComponentInstance(scene.id, instance.id, {
      metadata: {
        ...instance.metadata,
        locked: !instance.metadata?.locked
      }
    })
  }

  const renderComponentInstance = (instance: ComponentInstance) => {
    const component = getComponentDefinition(instance.componentId)
    if (!component || !instance.metadata?.visible) return null

    const isSelected = selectedInstanceId === instance.id
    const isLocked = instance.metadata?.locked

    return (
      <div
        key={instance.id}
        className={`absolute border-2 rounded-lg p-2 transition-all cursor-pointer ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-gray-300 hover:border-gray-400'
        } ${
          isLocked ? 'opacity-75 cursor-not-allowed' : ''
        }`}
        style={{
          left: instance.position.x,
          top: instance.position.y,
          width: instance.size.width === 'auto' ? 'auto' : instance.size.width,
          height: instance.size.height === 'auto' ? 'auto' : instance.size.height,
          zIndex: instance.position.z || 1
        }}
        onMouseDown={(e) => handleInstanceMouseDown(e, instance)}
        onClick={() => onInstanceSelect?.(instance)}
      >
        {/* Component Preview */}
        <div className="bg-white rounded p-2 shadow-sm">
          <div className="text-sm font-medium text-gray-700">
            {component.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {Object.keys(instance.props).length} props
          </div>
          {/* Could render actual component here with proper isolation */}
        </div>

        {/* Instance Controls */}
        {isSelected && (
          <div className="absolute -top-8 left-0 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleInstanceVisibility(instance)
              }}
            >
              {instance.metadata?.visible ? 
                <Eye className="h-3 w-3" /> : 
                <EyeOff className="h-3 w-3" />
              }
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleInstanceLock(instance)
              }}
            >
              {isLocked ? 
                <Lock className="h-3 w-3" /> : 
                <Unlock className="h-3 w-3" />
              }
            </Button>
          </div>
        )}

        {/* Instance Label */}
        <div className="absolute -bottom-6 left-0 text-xs bg-black text-white px-2 py-1 rounded">
          {instance.metadata?.label || component.name}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{scene.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {scene.instances.length} instances
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {scene.layout.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {scene.layout.container.width} × {scene.layout.container.height}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset View
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <div className="relative w-full h-full overflow-auto">
          {/* Canvas Container */}
          <div
            ref={canvasRef}
            className="relative mx-auto border border-gray-300 bg-white"
            style={{
              width: scene.layout.container.width,
              height: scene.layout.container.height,
              backgroundColor: scene.layout.container.background || '#ffffff',
              minHeight: '400px'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid/Layout Guides */}
            {scene.layout.type === 'grid' && scene.layout.grid && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Grid lines could be rendered here */}
              </div>
            )}

            {/* Component Instances */}
            {scene.instances.map(renderComponentInstance)}

            {/* Empty State */}
            {scene.instances.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Move className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Drag components here to compose your scene</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for reactive scene updates
export function useSceneLiveView(sceneId: string | null) {
  const [scene, setScene] = useState<Scene | null>(null)

  useEffect(() => {
    if (!sceneId) {
      setScene(null)
      return
    }

    // Initial load
    const initialScene = sceneManager.getScene(sceneId)
    setScene(initialScene || null)

    // Listen for changes
    const handleSceneChange = (changedSceneId: string, updatedScene: Scene) => {
      if (changedSceneId === sceneId) {
        setScene(updatedScene)
      }
    }

    sceneManager.addSceneChangeListener(handleSceneChange)

    return () => {
      sceneManager.removeSceneChangeListener(handleSceneChange)
    }
  }, [sceneId])

  return scene
}