import React, { useMemo, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { RefreshCw, ExternalLink, Code, Eye } from 'lucide-react'
import type { ProjectSchema } from '../types/schema'

interface FastPreviewProps {
  project: ProjectSchema
  focusComponent?: string
  className?: string
}

export function FastPreview({ project, focusComponent, className }: FastPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showCode, setShowCode] = useState(false)

  // Generate static HTML with Tailwind and component previews
  const htmlContent = useMemo(() => {
    const componentsHtml = project.components
      .filter(comp => comp.generatedCode)
      .map(comp => {
        // Extract component name from code
        const nameMatch = comp.generatedCode?.match(/export\s+default\s+function\s+(\w+)/)
        const componentName = nameMatch ? nameMatch[1] : comp.name

        // Create a mock representation of the component
        const hasProps = Object.keys(comp.props).length > 0
        const hasState = comp.generatedCode?.includes('useState')
        const hasEffects = comp.generatedCode?.includes('useEffect')
        const hasEvents = comp.generatedCode?.includes('onClick') || comp.generatedCode?.includes('onSubmit')

        return `
          <div class="mb-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold text-gray-800">${comp.name}</h2>
              <div class="flex gap-2">
                <span class="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">${comp.source}</span>
                ${comp.generationMethod ? `<span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">${comp.generationMethod}</span>` : ''}
                ${hasProps ? '<span class="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">Props</span>' : ''}
                ${hasState ? '<span class="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">State</span>' : ''}
                ${hasEffects ? '<span class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Effects</span>' : ''}
                ${hasEvents ? '<span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">Interactive</span>' : ''}
              </div>
            </div>
            
            ${hasProps ? `
              <div class="mb-4 p-3 bg-gray-50 rounded">
                <h3 class="text-sm font-medium text-gray-700 mb-2">Props Interface:</h3>
                <div class="space-y-1">
                  ${Object.entries(comp.props).map(([name, prop]) => `
                    <div class="text-xs font-mono">
                      <span class="text-blue-600">${name}</span>: 
                      <span class="text-green-600">${prop.type}</span>
                      ${prop.required ? '<span class="text-red-500">*</span>' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Component Visual Mockup -->
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gradient-to-br from-gray-50 to-white">
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">${componentName}</h3>
                <p class="text-sm text-gray-600 mb-4">React Component Preview</p>
                
                ${hasEvents ? `
                  <div class="space-y-2">
                    <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                      Sample Button
                    </button>
                    <p class="text-xs text-gray-500">Interactive elements detected</p>
                  </div>
                ` : `
                  <div class="text-gray-400 text-sm">Static Component</div>
                `}
                
                ${hasState ? `
                  <div class="mt-3 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                    📊 This component manages internal state
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Code Preview -->
            <details class="mt-4">
              <summary class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                View Source Code (${comp.generatedCode?.split('\\n').length || 0} lines)
              </summary>
              <pre class="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs"><code>${comp.generatedCode?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || '// No code available'}</code></pre>
            </details>
          </div>
        `
      }).join('')

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - Component Preview</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
          }
          pre { white-space: pre-wrap; word-wrap: break-word; }
        </style>
      </head>
      <body class="bg-gray-100 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          <!-- Header -->
          <div class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">${project.name}</h1>
            <p class="text-gray-600 mb-4">${project.description}</p>
            <div class="flex justify-center gap-4 text-sm">
              <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                📦 ${project.components.length} Components
              </span>
              <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                🎨 ${project.assets?.length || 0} Assets
              </span>
              <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                ⚛️ ${project.framework}
              </span>
            </div>
          </div>

          <!-- Components -->
          ${project.components.length > 0 ? componentsHtml : `
            <div class="text-center py-16">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h2 class="text-xl font-medium text-gray-900 mb-2">No Components Yet</h2>
              <p class="text-gray-600">Generate some components to see them here!</p>
            </div>
          `}
          
          <!-- Footer -->
          <div class="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            Generated by HedgeKit • Collaborative Agents for More Precise UI Generation
          </div>
        </div>

        <script>
          // Add some interactivity
          document.addEventListener('DOMContentLoaded', function() {
            // Auto-refresh when parent sends updates
            window.addEventListener('message', function(event) {
              if (event.data.type === 'refresh') {
                window.location.reload();
              }
            });
            
            // Smooth scrolling for focused components
            if (window.location.hash) {
              const element = document.querySelector(window.location.hash);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }
          });
        </script>
      </body>
      </html>
    `
  }, [project])

  const openInNewTab = () => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(htmlContent)
      newWindow.document.close()
    }
  }

  const refreshPreview = () => {
    if (iframeRef.current) {
      const iframe = iframeRef.current
      iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent)
    }
  }

  return (
    <div className={`flex flex-col ${className || 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium text-sm">Fast Preview</span>
          <Badge variant="outline" className="text-xs">Instant</Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCode(!showCode)}
            className="h-6 px-2 text-xs"
          >
            <Code className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={refreshPreview}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm"
            onClick={openInNewTab}
            className="h-6 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showCode ? (
          <div className="h-full overflow-auto p-4">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-auto">
              {htmlContent}
            </pre>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`}
            className="w-full h-full border-0"
            title="Component Preview"
            sandbox="allow-scripts"
          />
        )}
      </div>
    </div>
  )
}