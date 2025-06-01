import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Code, Eye } from 'lucide-react'
import type { ProjectSchema } from '../types/schema'

interface SimplePreviewProps {
  project: ProjectSchema
  focusComponent?: string
  className?: string
}

export function SimplePreview({ project, focusComponent, className }: SimplePreviewProps) {
  return (
    <Card className={className || 'h-full'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Component Preview
          </CardTitle>
          <Badge variant="outline">Simple</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {project.components.length > 0 ? (
          project.components.map(component => (
            <div key={component.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">{component.name}</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {component.source}
                  </Badge>
                  {component.generationMethod && (
                    <Badge variant="outline" className="text-xs">
                      {component.generationMethod}
                    </Badge>
                  )}
                </div>
              </div>
              
              {Object.keys(component.props).length > 0 && (
                <div className="mb-3 p-2 bg-gray-50 rounded">
                  <div className="text-xs font-medium mb-1">Props:</div>
                  {Object.entries(component.props).map(([name, prop]) => (
                    <div key={name} className="text-xs flex justify-between">
                      <span className="font-mono">{name}</span>
                      <span className="text-gray-500">{prop.type}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                <Code className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-sm font-medium">{component.name}</div>
                <div className="text-xs text-gray-600">React Component</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No components to preview</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}