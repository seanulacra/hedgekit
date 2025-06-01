import React, { useMemo, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { RefreshCw, ExternalLink, Code, Eye, AlertTriangle } from 'lucide-react'
import type { ProjectSchema } from '../types/schema'

interface ReactCompiledPreviewProps {
  project: ProjectSchema
  focusComponent?: string
  className?: string
}

export function ReactCompiledPreview({ project, focusComponent, className }: ReactCompiledPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showCode, setShowCode] = useState(false)

  // Generate HTML that compiles and renders React components
  const htmlContent = useMemo(() => {
    const componentsCode = project.components
      .filter(comp => comp.generatedCode)
      .map(comp => {
        // Clean up the component code for browser compilation
        let cleanedCode = comp.generatedCode || ''
        
        // Remove imports that won't work in browser
        cleanedCode = cleanedCode.replace(/import.*from.*['"].*['"];?\n?/g, '')
        
        // Replace export default with window assignment
        cleanedCode = cleanedCode.replace(
          /export\s+default\s+function\s+(\w+)/,
          `window.${comp.name} = function $1`
        )
        
        // Handle export default arrow functions
        cleanedCode = cleanedCode.replace(
          /export\s+default\s+(\w+)/,
          `window.${comp.name} = $1`
        )

        return {
          name: comp.name,
          code: cleanedCode,
          props: comp.props,
          source: comp.source,
          generationMethod: comp.generationMethod
        }
      })

    const componentInstances = componentsCode.map(comp => {
      const sampleProps = Object.entries(comp.props).reduce((acc, [key, prop]) => {
        // Generate sample prop values based on type
        switch (prop.type) {
          case 'string':
            acc[key] = `"Sample ${key}"`
            break
          case 'number':
            acc[key] = '42'
            break
          case 'boolean':
            acc[key] = 'true'
            break
          case 'function':
            acc[key] = '() => alert("Sample function")'
            break
          default:
            acc[key] = prop.defaultValue || 'null'
        }
        return acc
      }, {} as Record<string, any>)

      const propsString = Object.entries(sampleProps)
        .map(([key, value]) => `${key}={${value}}`)
        .join(' ')

      return `
        <div className="component-instance mb-8 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">${comp.name}</h2>
            <div className="flex gap-2">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">${comp.source}</span>
              ${comp.generationMethod ? `<span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">${comp.generationMethod}</span>` : ''}
            </div>
          </div>
          
          ${Object.keys(comp.props).length > 0 ? `
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Props:</h3>
              <div className="space-y-1 text-xs font-mono">
                ${Object.entries(comp.props).map(([name, prop]) => `
                  <div><span className="text-blue-600">${name}</span>: <span className="text-green-600">${prop.type}</span>${prop.required ? '<span className="text-red-500">*</span>' : ''}</div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-3">Live React Component:</div>
            <div id="component-${comp.name}" className="component-container min-h-[100px] bg-white rounded border p-4">
              <div className="text-center text-gray-500">Loading component...</div>
            </div>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
              View Source (${comp.code.split('\\n').length} lines)
            </summary>
            <pre className="mt-2 p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs"><code>${comp.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
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
        <title>${project.name} - Live React Preview</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            line-height: 1.6;
          }
          .component-container {
            border: 2px dashed #e5e7eb;
            transition: border-color 0.2s;
          }
          .component-container:hover {
            border-color: #3b82f6;
          }
          .error-boundary {
            border: 2px solid #ef4444;
            background: #fef2f2;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
          }
        </style>
      </head>
      <body className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <!-- Header -->
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">${project.name}</h1>
            <p className="text-gray-600 mb-4">${project.description}</p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                ⚛️ ${project.components.length} React Components
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                🎨 ${project.assets?.length || 0} Assets
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                🔥 Live Compiled
              </span>
            </div>
          </div>

          <!-- Components -->
          ${project.components.length > 0 ? componentInstances : `
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-900 mb-2">No Components Yet</h2>
              <p className="text-gray-600">Generate some components to see them rendered live!</p>
            </div>
          `}
          
          <!-- Footer -->
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            Generated by HedgeKit • Live React Compilation with Babel
          </div>
        </div>

        <script type="text/babel">
          const { React, ReactDOM } = window;
          const { useState, useEffect, useCallback } = React;

          // Error Boundary Component
          function ErrorBoundary({ children, componentName }) {
            const [hasError, setHasError] = React.useState(false);
            const [error, setError] = React.useState(null);

            React.useEffect(() => {
              const handleError = (event) => {
                setHasError(true);
                setError(event.error);
              };

              window.addEventListener('error', handleError);
              return () => window.removeEventListener('error', handleError);
            }, []);

            if (hasError) {
              return React.createElement('div', { className: 'error-boundary' }, [
                React.createElement('h3', { key: 'title', className: 'font-bold mb-2' }, '⚠️ Component Error'),
                React.createElement('p', { key: 'message', className: 'text-sm' }, 
                  \`Component "\${componentName}" failed to render: \${error?.message || 'Unknown error'}\`)
              ]);
            }

            return children;
          }

          // Compile and render components
          async function compileAndRender() {
            ${componentsCode.map(comp => `
              try {
                // Define the component
                ${comp.code}
                
                // Render the component
                const container = document.getElementById('component-${comp.name}');
                if (container && window.${comp.name}) {
                  const ComponentToRender = window.${comp.name};
                  const element = React.createElement(ErrorBoundary, 
                    { componentName: '${comp.name}' },
                    React.createElement(ComponentToRender, {
                      ${Object.entries(comp.props).map(([key, prop]) => {
                        switch (prop.type) {
                          case 'string': return `${key}: "Sample ${key}"`
                          case 'number': return `${key}: 42`
                          case 'boolean': return `${key}: true`
                          case 'function': return `${key}: () => alert('Sample ${key} function')`
                          default: return `${key}: null`
                        }
                      }).join(', ')}
                    })
                  );
                  
                  const root = ReactDOM.createRoot(container);
                  root.render(element);
                } else {
                  console.error('Failed to render ${comp.name}');
                }
              } catch (error) {
                console.error('Error compiling ${comp.name}:', error);
                const container = document.getElementById('component-${comp.name}');
                if (container) {
                  container.innerHTML = \`
                    <div class="error-boundary">
                      <h3 class="font-bold mb-2">⚠️ Compilation Error</h3>
                      <p class="text-sm">Component "${comp.name}" failed to compile: \${error.message}</p>
                    </div>
                  \`;
                }
              }
            `).join('\n')}
          }

          // Run compilation when page loads
          document.addEventListener('DOMContentLoaded', compileAndRender);
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
          <span className="font-medium text-sm">Live React Preview</span>
          <Badge variant="default" className="text-xs">Compiled</Badge>
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
            title="Live React Component Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  )
}