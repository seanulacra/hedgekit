import { useState } from 'react'
import { Button } from './ui/button'
import { AgentChat } from './AgentChat'
import { ProjectSchema } from '../types/schema'
import { Bot, X } from 'lucide-react'
import { cn } from '../lib/utils'

interface AgentDrawerProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
}

export function AgentDrawer({ project, onUpdateProject }: AgentDrawerProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  return (
    <>
      {/* Floating Button - Only show when closed */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-primary hover:bg-primary/90"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Clean Drawer */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[500px] bg-background border-l shadow-xl transition-transform duration-300 ease-out z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Agent</h2>
              <p className="text-sm text-muted-foreground">Your collaborative AI assistant</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Chat Content */}
        <div className="h-[calc(100vh-100px)] p-6">
          <AgentChat 
            project={project} 
            onUpdateProject={onUpdateProject}
          />
        </div>
      </div>
      
    </>
  )
}