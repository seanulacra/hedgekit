import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Code, Copy } from 'lucide-react'
import type { ProjectSchema, ComponentSchema } from '@/types/schema'

interface ProjectSchemaViewerProps {
  schema: ProjectSchema
}

export function ProjectSchemaViewer({ schema }: ProjectSchemaViewerProps) {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())

  const toggleComponentExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents)
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId)
    } else {
      newExpanded.add(componentId)
    }
    setExpandedComponents(newExpanded)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const ComponentCodeBlock = ({ component }: { component: ComponentSchema & { generatedCode?: string } }) => {
    // Try to get code from different sources
    const code = component.generatedCode || 
                 (component as any).code || 
                 `// Component: ${component.name}\n// No code available for this component`

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h6 className="text-sm font-medium">Generated Code</h6>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(code)}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
        <pre className="text-xs bg-gray-50 dark:bg-gray-100 dark:text-gray-800 border rounded p-3 overflow-x-auto max-h-96 overflow-y-auto font-mono">
          <code className="language-tsx">{code}</code>
        </pre>
      </div>
    )
  }
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Project Schema</CardTitle>
        <CardDescription>
          Current project structure and components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Project Info</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><span className="font-medium">Name:</span> {schema.name}</p>
              <p><span className="font-medium">Description:</span> {schema.description}</p>
              <p><span className="font-medium">Framework:</span> {schema.framework}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Components ({schema.components.length})</h4>
            {schema.components.length === 0 ? (
              <p className="text-sm text-muted-foreground">No components generated yet</p>
            ) : (
              <div className="space-y-2">
                {schema.components.map((component) => (
                  <div key={component.id} className="border rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-sm">{component.name}</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {component.source}
                        </Badge>
                        {component.generationMethod && (
                          <Badge variant="outline" className="text-xs">
                            {component.generationMethod === 'v0' ? 'v0' : 'GPT'}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComponentExpanded(component.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Code className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-medium">Props:</span> {Object.keys(component.props).length}</p>
                      {component.filePath && (
                        <p><span className="font-medium">File:</span> {component.filePath}</p>
                      )}
                    </div>
                    {Object.keys(component.props).length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Props:</p>
                        <div className="text-xs text-muted-foreground">
                          {Object.entries(component.props).map(([name, prop]) => (
                            <div key={name} className="flex justify-between">
                              <span>{name}</span>
                              <span>{prop.type}{prop.required && '*'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Code Toggle Section */}
                    {expandedComponents.has(component.id) && (
                      <div className="mt-3 border-t pt-3">
                        <ComponentCodeBlock component={component as ComponentSchema & { generatedCode?: string }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Dependencies</h4>
            <div className="text-xs text-muted-foreground">
              {Object.keys(schema.dependencies).length === 0 ? (
                <p>No custom dependencies</p>
              ) : (
                Object.entries(schema.dependencies).map(([name, version]) => (
                  <div key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span>{version}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}