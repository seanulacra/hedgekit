import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { Loader2, Square, Wand2, Component, ArrowRight } from 'lucide-react'
import { ComponentSchema, ProjectSchema } from '../types/schema'
import { AgentOrchestrator } from '../services/agentOrchestrator'
import type { UIActions } from '../services/agentTools'

interface SceneCreationModalProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  onSceneCreated?: (sceneId: string) => void
  uiActions?: UIActions
  trigger?: React.ReactNode
}

interface ComponentReference {
  id: string
  name: string
  position: number
}

export function SceneCreationModal({ 
  project, 
  onUpdateProject, 
  onSceneCreated, 
  uiActions,
  trigger 
}: SceneCreationModalProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<ComponentSchema[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [componentRefs, setComponentRefs] = useState<ComponentReference[]>([])
  const [generationStep, setGenerationStep] = useState<'input' | 'planning' | 'generating' | 'composing'>('input')
  const [generationLog, setGenerationLog] = useState<string[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const orchestrator = useRef(new AgentOrchestrator())

  // Parse @ references from prompt
  useEffect(() => {
    const refs: ComponentReference[] = []
    const regex = /@(\w+)/g
    let match

    while ((match = regex.exec(prompt)) !== null) {
      const componentName = match[1]
      const component = project.components.find(c => 
        c.name.toLowerCase().includes(componentName.toLowerCase())
      )
      
      if (component) {
        refs.push({
          id: component.id,
          name: component.name,
          position: match.index
        })
      }
    }
    
    setComponentRefs(refs)
  }, [prompt, project.components])

  // Handle @ autocomplete
  const handleInputChange = (value: string) => {
    setPrompt(value)
    
    const cursorPos = textareaRef.current?.selectionStart || 0
    setCursorPosition(cursorPos)
    
    // Check if user just typed @
    const textBeforeCursor = value.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (atMatch) {
      const searchTerm = atMatch[1].toLowerCase()
      const filtered = project.components.filter(component =>
        component.name.toLowerCase().includes(searchTerm)
      )
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const insertComponent = (component: ComponentSchema) => {
    const cursorPos = textareaRef.current?.selectionStart || 0
    const textBeforeCursor = prompt.slice(0, cursorPos)
    const textAfterCursor = prompt.slice(cursorPos)
    
    // Find the @ position to replace
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    if (atMatch) {
      const atPosition = textBeforeCursor.lastIndexOf('@')
      const newText = 
        prompt.slice(0, atPosition) + 
        `@${component.name}` + 
        textAfterCursor
      
      setPrompt(newText)
      setShowSuggestions(false)
      
      // Set cursor position after the inserted component
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = atPosition + component.name.length + 1
          textareaRef.current.setSelectionRange(newPosition, newPosition)
          textareaRef.current.focus()
        }
      }, 0)
    }
  }

  const handleCreateScene = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGenerationLog([])
    
    try {
      const hasExistingComponents = componentRefs.length > 0
      
      if (hasExistingComponents) {
        // Direct composition with existing components
        setGenerationStep('composing')
        setGenerationLog(['Using existing components to compose scene...'])
        
        // Use the scene composition tool
        const response = await orchestrator.current.chatWithAgent(
          {
            message: `Create a scene layout based on this description: "${prompt}". Use the referenced components and arrange them thoughtfully. Focus on composition and positioning.`,
            project,
            conversationHistory: [],
            provider: orchestrator.current.getCurrentProvider()
          },
          onUpdateProject,
          {
            ...uiActions,
            createScene: (name: string, description: string) => {
              setGenerationLog(prev => [...prev, `Creating scene: ${name}`])
              // This will be handled by the agent tool
            }
          }
        )
        
        setGenerationLog(prev => [...prev, 'Scene created successfully!'])
        
      } else {
        // Multi-step generation: plan → generate → compose
        setGenerationStep('planning')
        setGenerationLog(['Analyzing scene requirements...'])
        
        // Step 1: Plan what components are needed
        const planResponse = await orchestrator.current.chatWithAgent(
          {
            message: `Analyze this scene description and plan what components would be needed: "${prompt}". List the specific UI components required with their purposes. Don't generate yet, just plan.`,
            project,
            conversationHistory: [],
            provider: orchestrator.current.getCurrentProvider()
          },
          onUpdateProject,
          uiActions
        )
        
        setGenerationLog(prev => [...prev, 'Components planned!', 'Generating required components...'])
        setGenerationStep('generating')
        
        // Step 2: Generate the planned components
        const generateResponse = await orchestrator.current.chatWithAgent(
          {
            message: `Now generate the components you just planned for: "${prompt}". Create each component with appropriate props and styling.`,
            project,
            conversationHistory: [
              {
                id: '1',
                role: 'assistant',
                content: planResponse.message,
                timestamp: new Date()
              }
            ],
            provider: orchestrator.current.getCurrentProvider()
          },
          onUpdateProject,
          uiActions
        )
        
        setGenerationLog(prev => [...prev, 'Components generated!', 'Composing final scene...'])
        setGenerationStep('composing')
        
        // Step 3: Compose the scene with the new components
        const composeResponse = await orchestrator.current.chatWithAgent(
          {
            message: `Now create a scene layout using the components you just generated. Arrange them to match the original description: "${prompt}". Focus on good positioning and composition.`,
            project,
            conversationHistory: [
              {
                id: '1',
                role: 'assistant',
                content: planResponse.message,
                timestamp: new Date()
              },
              {
                id: '2',
                role: 'assistant',
                content: generateResponse.message,
                timestamp: new Date()
              }
            ],
            provider: orchestrator.current.getCurrentProvider()
          },
          onUpdateProject,
          {
            ...uiActions,
            createScene: (name: string, description: string) => {
              setGenerationLog(prev => [...prev, `Creating scene: ${name}`])
            }
          }
        )
        
        setGenerationLog(prev => [...prev, 'Scene composed successfully!'])
      }
      
      // Close modal after successful creation
      setTimeout(() => {
        setOpen(false)
        setPrompt('')
        setGenerationStep('input')
        setGenerationLog([])
      }, 1500)
      
    } catch (error) {
      console.error('Scene creation error:', error)
      setGenerationLog(prev => [...prev, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setIsGenerating(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Square className="h-4 w-4 mr-2" />
      New Scene
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Create Smart Scene
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Generation Steps Indicator */}
          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${generationStep === 'planning' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span>Planning</span>
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${generationStep === 'generating' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span>Generating</span>
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${generationStep === 'composing' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                <span>Composing</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe your scene</label>
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="e.g., 'Create a dashboard with @Header, @Sidebar, and data tables' or 'Build an e-commerce product page'"
                className="min-h-[100px] pr-12"
                disabled={isGenerating}
              />
              
              {/* @ Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {suggestions.map(component => (
                    <button
                      key={component.id}
                      onClick={() => insertComponent(component)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Component className="h-4 w-4" />
                      <span>{component.name}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {component.source}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Referenced Components */}
            {componentRefs.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Referenced:</span>
                {componentRefs.map((ref, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    @{ref.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Generation Log */}
          {generationLog.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-1">
              {generationLog.map((log, index) => (
                <div key={index} className="text-sm flex items-center gap-2">
                  {index === generationLog.length - 1 && isGenerating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Type <code>@</code> to reference existing components</p>
            <p>• Without component references, I'll plan and generate what's needed</p>
            <p>• Describe layout, behavior, and visual style</p>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {project.components.length > 0 && (
                <span>{project.components.length} components available</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateScene}
                disabled={!prompt.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {generationStep === 'planning' && 'Planning...'}
                    {generationStep === 'generating' && 'Generating...'}
                    {generationStep === 'composing' && 'Composing...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create Scene
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}