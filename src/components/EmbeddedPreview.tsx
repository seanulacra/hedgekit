import React, { useState, useMemo, useEffect } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CodeEditor } from './ui/CodeEditor'
import { RefreshCw, ExternalLink, Code, Eye, AlertTriangle, CheckCircle } from 'lucide-react'
import type { ProjectSchema } from '../types/schema'

interface EmbeddedPreviewProps {
  project: ProjectSchema
  focusComponent?: string
  className?: string
}

export function EmbeddedPreview({ project, focusComponent, className }: EmbeddedPreviewProps) {
  const [showCode, setShowCode] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState(focusComponent || project.components[0]?.id || '')

  // Sync selection when project changes or focusComponent changes
  useEffect(() => {
    if (focusComponent) {
      setSelectedComponentId(focusComponent)
    } else if (!selectedComponentId || !project.components.find(c => c.id === selectedComponentId)) {
      // If no selection or current selection is invalid, auto-select first component
      setSelectedComponentId(project.components[0]?.id || '')
    }
  }, [focusComponent, project.components, selectedComponentId])

  const selectedComponent = project.components.find(c => c.id === selectedComponentId)

  // Validate component code
  const validateComponent = (code: string) => {
    const checks = {
      hasFunction: /function\s+\w+|const\s+\w+\s*=|export\s+/i.test(code),
      hasReturn: /return\s*\(/i.test(code),
      hasJSX: /<[A-Za-z]/i.test(code),
      hasTailwind: /className=/i.test(code),
    }

    const issues = []
    if (!checks.hasFunction) issues.push("No function declaration found")
    if (!checks.hasReturn) issues.push("No return statement found")
    if (!checks.hasJSX) issues.push("No JSX elements found")
    
    return {
      isValid: issues.length === 0,
      issues,
      checks
    }
  }

  // Sample components that actually work (embedded)
  const SampleButton = ({ text = "Click me", variant = "primary" }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors"
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-600 text-white hover:bg-gray-700",
      success: "bg-green-600 text-white hover:bg-green-700"
    }
    
    return (
      <button className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary}`}>
        {text}
      </button>
    )
  }

  const SampleCard = ({ title = "Sample Card", content = "This is a sample card component.", icon = "📦" }) => {
    return (
      <div className="max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">{icon}</span>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600">{content}</p>
        <div className="mt-4 flex gap-2">
          <SampleButton text="Action" variant="primary" />
          <SampleButton text="Cancel" variant="secondary" />
        </div>
      </div>
    )
  }

  const SampleForm = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    
    return (
      <div className="max-w-md bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Form</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <SampleButton text="Submit" variant="success" />
        </div>
      </div>
    )
  }

  // Character Card component
  const CharacterCard = ({ 
    character = {
      name: "Eldric Shadowblade",
      level: 7,
      health: 65,
      maxHealth: 100,
      experience: 350,
      experienceToNextLevel: 500,
      stats: {
        strength: 14,
        agility: 12,
        intelligence: 8
      },
      inventory: [
        { id: 1, name: "Health Potion", quantity: 3, icon: "🧪" },
        { id: 2, name: "Magic Scroll", quantity: 1, icon: "📜" },
        { id: 3, name: "Gold Coins", quantity: 42, icon: "🪙" }
      ]
    }
  }) => {
    const healthPercentage = (character.health / character.maxHealth) * 100;
    const xpPercentage = (character.experience / character.experienceToNextLevel) * 100;
    
    return (
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden shadow-lg border border-amber-700/50">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-900/80 to-amber-700/80 border-b border-amber-600/50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-amber-100">{character.name}</h2>
            <div className="bg-amber-800 text-amber-100 rounded-full h-8 w-8 flex items-center justify-center border border-amber-600">
              {character.level}
            </div>
          </div>
        </div>
        
        {/* Health Bar */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex justify-between mb-1">
            <span className="text-red-300 text-sm font-semibold">Health</span>
            <span className="text-red-300 text-sm">{character.health}/{character.maxHealth}</span>
          </div>
          <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full"
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Experience Bar */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex justify-between mb-1">
            <span className="text-purple-300 text-sm font-semibold">Experience</span>
            <span className="text-purple-300 text-sm">{character.experience}/{character.experienceToNextLevel}</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-700 to-purple-500 rounded-full"
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-amber-400 font-semibold mb-2 text-center">Stats</h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-red-400 text-lg">⚔️</div>
              <div className="text-slate-300 text-sm">STR</div>
              <div className="text-amber-300 font-bold">{character.stats.strength}</div>
            </div>
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-green-400 text-lg">🏃</div>
              <div className="text-slate-300 text-sm">AGI</div>
              <div className="text-amber-300 font-bold">{character.stats.agility}</div>
            </div>
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-blue-400 text-lg">✨</div>
              <div className="text-slate-300 text-sm">INT</div>
              <div className="text-amber-300 font-bold">{character.stats.intelligence}</div>
            </div>
          </div>
        </div>
        
        {/* Inventory */}
        <div className="p-4">
          <h3 className="text-amber-400 font-semibold mb-2">Inventory</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {character.inventory.map(item => (
              <div key={item.id} className="flex items-center bg-slate-800/50 p-2 rounded border border-slate-700/50">
                <div className="h-8 w-8 bg-slate-700 rounded-md flex items-center justify-center mr-2 text-lg">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 text-sm">{item.name}</div>
                </div>
                <div className="text-amber-300 text-sm font-semibold">x{item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Map of working sample components
  const sampleComponents = {
    SampleButton,
    SampleCard,
    SampleForm,
    CharacterCard
  }

  const renderComponentPreview = () => {
    if (!selectedComponent) {
      // Show demo components if no project components exist
      if (project.components.length === 0) {
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 mb-6">
              <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No components in project</p>
              <p className="text-sm">Here are some sample components:</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">SampleButton</h4>
                <SampleButton />
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">SampleCard</h4>
                <SampleCard />
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">SampleForm</h4>
                <SampleForm />
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">CharacterCard</h4>
                <CharacterCard />
              </div>
            </div>
          </div>
        )
      }
      
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Code className="h-12 w-12 mb-4 opacity-50" />
          <p>Select a component to preview</p>
        </div>
      )
    }

    const validation = validateComponent(selectedComponent.generatedCode || '')
    
    // If it's one of our sample components, render it live
    if (sampleComponents[selectedComponent.name]) {
      const ComponentToRender = sampleComponents[selectedComponent.name]
      return (
        <div className="bg-gray-50 rounded-lg p-8 min-h-64 flex items-center justify-center">
          <ComponentToRender />
        </div>
      )
    }

    // Otherwise show validation and code analysis
    return (
      <div className="space-y-4">
        {/* Validation Status */}
        <div className={`p-4 rounded-lg border ${validation.isValid 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {validation.isValid ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              Component {validation.isValid ? 'Valid' : 'Invalid'}
            </span>
          </div>
          {validation.issues.length > 0 && (
            <ul className="text-sm text-red-700 space-y-1">
              {validation.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Component Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{selectedComponent.name}</h3>
            <div className="flex gap-2">
              <Badge variant="outline">{selectedComponent.source}</Badge>
              {selectedComponent.generationMethod && (
                <Badge variant="secondary">{selectedComponent.generationMethod}</Badge>
              )}
            </div>
          </div>

          {/* Props */}
          {Object.keys(selectedComponent.props).length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Props Interface:</h4>
              <div className="space-y-1">
                {Object.entries(selectedComponent.props).map(([name, prop]) => (
                  <div key={name} className="text-xs font-mono flex justify-between">
                    <span className="text-blue-600">{name}</span>
                    <span className="text-green-600">{prop.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mock Visual */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gradient-to-br from-gray-50 to-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Code className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedComponent.name}</h4>
            <p className="text-sm text-gray-600 mb-4">React Component</p>
            <div className="text-xs text-gray-500">
              For live preview, use CodeSandbox or local development
            </div>
          </div>
        </div>

        {/* Quick Checks */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-3">Code Analysis</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <span className={`mr-2 ${validation.checks.hasFunction ? 'text-green-500' : 'text-gray-400'}`}>
                {validation.checks.hasFunction ? '✓' : '○'}
              </span>
              <span>Function Declaration</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${validation.checks.hasReturn ? 'text-green-500' : 'text-gray-400'}`}>
                {validation.checks.hasReturn ? '✓' : '○'}
              </span>
              <span>Return Statement</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${validation.checks.hasJSX ? 'text-green-500' : 'text-gray-400'}`}>
                {validation.checks.hasJSX ? '✓' : '○'}
              </span>
              <span>JSX Elements</span>
            </div>
            <div className="flex items-center">
              <span className={`mr-2 ${validation.checks.hasTailwind ? 'text-green-500' : 'text-gray-400'}`}>
                {validation.checks.hasTailwind ? '✓' : '○'}
              </span>
              <span>Tailwind Classes</span>
            </div>
          </div>
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
          <span className="font-medium text-sm">Component Preview</span>
          <Badge variant="default" className="text-xs">Embedded</Badge>
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
        </div>
      </div>

      {/* Component Selector */}
      {project.components.length > 1 && (
        <div className="p-3 border-b">
          <select 
            value={selectedComponentId} 
            onChange={(e) => setSelectedComponentId(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded"
          >
            {project.components.length === 0 ? (
              <option value="">No components available</option>
            ) : (
              project.components.map(comp => (
                <option key={comp.id} value={comp.id}>
                  {comp.name} ({comp.source})
                </option>
              ))
            )}
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showCode && selectedComponent ? (
          <div className="h-full p-4">
            <CodeEditor
              code={selectedComponent.generatedCode || '// No code available'}
              language="tsx"
              theme="dark"
              readOnly={true}
              className="h-full"
            />
          </div>
        ) : (
          <div className="overflow-auto p-4 h-full">
            {renderComponentPreview()}
          </div>
        )}
      </div>

    </div>
  )
}