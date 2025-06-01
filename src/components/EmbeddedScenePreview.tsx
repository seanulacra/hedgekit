import React, { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CodeEditor } from './ui/CodeEditor'
import { RefreshCw, ExternalLink, Code, Eye, Layers, Move } from 'lucide-react'
import type { ProjectSchema, Scene, ComponentInstance } from '../types/schema'

interface EmbeddedScenePreviewProps {
  project: ProjectSchema
  scene: Scene | null
  className?: string
}

export function EmbeddedScenePreview({ project, scene, className }: EmbeddedScenePreviewProps) {
  const [showCode, setShowCode] = useState(false)

  // Sample components that we can actually render
  const SampleButton = ({ text = "Click me", variant = "primary" }) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors text-sm"
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
      <div className="max-w-xs bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-center mb-3">
          <span className="text-lg mr-2">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm">{content}</p>
        <div className="mt-3 flex gap-2">
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
      <div className="max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Form</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter your email"
            />
          </div>
          <SampleButton text="Submit" variant="success" />
        </div>
      </div>
    )
  }

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
      <div className="w-72 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden shadow-lg border border-amber-700/50">
        {/* Header */}
        <div className="p-3 bg-gradient-to-r from-amber-900/80 to-amber-700/80 border-b border-amber-600/50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-amber-100">{character.name}</h2>
            <div className="bg-amber-800 text-amber-100 rounded-full h-7 w-7 flex items-center justify-center border border-amber-600 text-sm">
              {character.level}
            </div>
          </div>
        </div>
        
        {/* Health Bar */}
        <div className="p-3 border-b border-slate-700/50">
          <div className="flex justify-between mb-1">
            <span className="text-red-300 text-xs font-semibold">Health</span>
            <span className="text-red-300 text-xs">{character.health}/{character.maxHealth}</span>
          </div>
          <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full"
              style={{ width: `${healthPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Experience Bar */}
        <div className="p-3 border-b border-slate-700/50">
          <div className="flex justify-between mb-1">
            <span className="text-purple-300 text-xs font-semibold">Experience</span>
            <span className="text-purple-300 text-xs">{character.experience}/{character.experienceToNextLevel}</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-700 to-purple-500 rounded-full"
              style={{ width: `${xpPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="p-3 border-b border-slate-700/50">
          <h3 className="text-amber-400 font-semibold mb-2 text-center text-sm">Stats</h3>
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-red-400 text-sm">⚔️</div>
              <div className="text-slate-300 text-xs">STR</div>
              <div className="text-amber-300 font-bold text-sm">{character.stats.strength}</div>
            </div>
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-green-400 text-sm">🏃</div>
              <div className="text-slate-300 text-xs">AGI</div>
              <div className="text-amber-300 font-bold text-sm">{character.stats.agility}</div>
            </div>
            <div className="bg-slate-800/50 p-2 rounded border border-slate-700/50 text-center">
              <div className="text-blue-400 text-sm">✨</div>
              <div className="text-slate-300 text-xs">INT</div>
              <div className="text-amber-300 font-bold text-sm">{character.stats.intelligence}</div>
            </div>
          </div>
        </div>
        
        {/* Inventory */}
        <div className="p-3">
          <h3 className="text-amber-400 font-semibold mb-2 text-sm">Inventory</h3>
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            {character.inventory.map(item => (
              <div key={item.id} className="flex items-center bg-slate-800/50 p-2 rounded border border-slate-700/50">
                <div className="h-6 w-6 bg-slate-700 rounded-md flex items-center justify-center mr-2 text-sm">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="text-slate-200 text-xs">{item.name}</div>
                </div>
                <div className="text-amber-300 text-xs font-semibold">x{item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Map of embeddable components
  const embeddableComponents = {
    SampleButton,
    SampleCard,
    SampleForm,
    CharacterCard
  }

  const renderComponentInstance = (instance: ComponentInstance) => {
    // Find the component definition
    const component = project.components.find(c => c.id === instance.componentId)
    if (!component) return null

    // Check if we have an embeddable version of this component
    const EmbeddableComponent = embeddableComponents[component.name]
    
    if (EmbeddableComponent) {
      // Render the actual live component
      return (
        <div
          key={instance.id}
          className="absolute"
          style={{
            left: instance.position.x,
            top: instance.position.y,
            zIndex: instance.position.z || 1
          }}
        >
          <div className="relative group">
            {/* Component Label */}
            <div className="absolute -top-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="text-xs">
                {component.name}
              </Badge>
            </div>
            
            {/* Actual Component */}
            <EmbeddableComponent {...instance.props} />
          </div>
        </div>
      )
    } else {
      // Fallback: Show component placeholder
      return (
        <div
          key={instance.id}
          className="absolute border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-3"
          style={{
            left: instance.position.x,
            top: instance.position.y,
            width: instance.size.width === 'auto' ? 'auto' : instance.size.width,
            height: instance.size.height === 'auto' ? 'auto' : instance.size.height,
            zIndex: instance.position.z || 1
          }}
        >
          <div className="text-center text-blue-600">
            <Code className="h-6 w-6 mx-auto mb-1" />
            <div className="text-sm font-medium">{component.name}</div>
            <div className="text-xs text-blue-500">{component.source}</div>
          </div>
        </div>
      )
    }
  }

  const renderScene = () => {
    if (!scene) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Layers className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Scene Selected</h3>
          <p className="text-sm">Select a scene to see the component layout</p>
        </div>
      )
    }

    if (!scene.instances || scene.instances.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Layers className="h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Empty Scene</h3>
          <p className="text-sm">"{scene.name}" has no components yet</p>
          <p className="text-xs mt-2">Add components to see them arranged here</p>
        </div>
      )
    }

    return (
      <div 
        className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
        style={{
          width: scene.layout.container?.width || 800,
          height: scene.layout.container?.height || 600,
          background: scene.layout.container?.background || '#f9fafb'
        }}
      >
        {/* Scene Header */}
        <div className="absolute top-2 left-2 z-50">
          <Badge variant="outline" className="bg-white/90">
            {scene.name} ({scene.instances.length} components)
          </Badge>
        </div>
        
        {/* Component Instances */}
        {scene.instances
          .filter(instance => instance.metadata?.visible !== false)
          .map(renderComponentInstance)}
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${className || 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="font-medium text-sm">Scene Preview</span>
          <Badge variant="default" className="text-xs">Live</Badge>
          {scene && (
            <Badge variant="outline" className="text-xs">
              {scene.instances?.length || 0} instances
            </Badge>
          )}
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
            onClick={() => window.location.reload()}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showCode && scene ? (
          <div className="h-full p-4">
            <CodeEditor
              code={JSON.stringify(scene, null, 2)}
              language="javascript"
              theme="dark"
              readOnly={true}
              className="h-full"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-full overflow-auto p-4">
            {renderScene()}
          </div>
        )}
      </div>

    </div>
  )
}