import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, Code, AlertCircle, Eye, EyeOff } from 'lucide-react'
import type { ProjectSchema, ComponentSchema } from '@/types/schema'

interface StaticComponentPreviewProps {
  project: ProjectSchema
  componentId?: string
  className?: string
}

// Component wrapper that provides safe rendering environment
function ComponentWrapper({ 
  component, 
  onError 
}: { 
  component: ComponentSchema
  onError: (error: Error) => void 
}) {
  const [hasError, setHasError] = useState(false)
  const [ComponentToRender, setComponentToRender] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    if (!component.generatedCode) {
      setComponentToRender(null)
      return
    }

    try {
      // Create a safe execution environment for the component
      const componentCode = component.generatedCode
      
      // Extract the component function/class from the code
      // This is a simplified approach - in production you'd want better parsing
      const functionMatch = componentCode.match(/export\s+default\s+function\s+(\w+)/)
      const componentName = functionMatch ? functionMatch[1] : component.name

      // Create a mock component that shows the structure
      const MockComponent = () => {
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-sm">{component.name}</span>
              <Badge variant="outline" className="text-xs">{component.source}</Badge>
            </div>
            
            {/* Show props if any */}
            {Object.keys(component.props).length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="text-xs font-medium text-gray-600">Props:</div>
                {Object.entries(component.props).map(([name, prop]) => (
                  <div key={name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="font-mono">{name}</span>
                    <span className="text-gray-500">({prop.type})</span>
                    {prop.required && <span className="text-red-500">*</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Simulated component content */}
            <div className="bg-white rounded border p-3 text-center text-gray-600 text-sm">
              <div className="mb-2">🧩 {componentName} Component</div>
              <div className="text-xs text-gray-400">
                {componentCode.includes('useState') && '🔄 Interactive'}
                {componentCode.includes('useEffect') && ' ⚡ Effects'}
                {componentCode.includes('className') && ' 🎨 Styled'}
              </div>
            </div>
          </div>
        )
      }

      setComponentToRender(() => MockComponent)
      setHasError(false)
    } catch (error) {
      console.error('Component preview error:', error)
      setHasError(true)
      onError(error as Error)
    }
  }, [component.generatedCode, component.name, component.props, component.source, onError])

  if (hasError) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium text-sm">Preview Error</span>
        </div>
        <div className="text-xs text-red-600 mt-1">
          Component code could not be rendered safely
        </div>
      </div>
    )
  }

  if (!ComponentToRender) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 text-gray-500">
          <Code className="h-4 w-4" />
          <span className="text-sm">No generated code</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <ComponentToRender />
    </div>
  )
}

export function StaticComponentPreview({ project, componentId, className }: StaticComponentPreviewProps) {
  const [showCode, setShowCode] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const selectedComponent = useMemo(() => {
    return componentId ? project.components.find(c => c.id === componentId) : null
  }, [componentId, project.components])

  const handleError = (error: Error) => {
    setErrors(prev => [...prev, error.message])
  }

  const clearErrors = () => {
    setErrors([])
  }

  // No component selected
  if (!componentId || !selectedComponent) {
    return (
      <div className={`flex items-center justify-center bg-muted/30 rounded ${className || 'h-full'}`}>
        <div className="text-center text-muted-foreground">
          <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select a component to preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${className || 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-sm">Live Preview</span>
          <Badge variant="outline" className="text-xs">Static</Badge>
        </div>
        
        <div className="flex items-center gap-1">
          {errors.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearErrors}
              className="h-6 px-2 text-xs text-red-600"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {errors.length}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-6 px-2 text-xs"
          >
            {showCode ? <EyeOff className="h-3 w-3" /> : <Code className="h-3 w-3" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.location.reload()}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {showCode ? (
          // Code view
          <div className="p-4">
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-auto">
              <pre className="whitespace-pre-wrap">
                {selectedComponent.generatedCode || '// No code generated yet'}
              </pre>
            </div>
          </div>
        ) : (
          // Preview view
          <div className="p-4">
            <Card>
              <CardContent className="p-4">
                <ComponentWrapper 
                  component={selectedComponent}
                  onError={handleError}
                />
              </CardContent>
            </Card>
            
            {/* Component info */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{selectedComponent.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedComponent.source}
                </Badge>
                {selectedComponent.generationMethod && (
                  <Badge variant="outline" className="text-xs">
                    {selectedComponent.generationMethod}
                  </Badge>
                )}
              </div>
              
              {Object.keys(selectedComponent.props).length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {Object.keys(selectedComponent.props).length} props defined
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div className="border-t bg-red-50 p-2">
          <div className="text-xs text-red-700 space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}