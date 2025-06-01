import { Bot } from "lucide-react"
import { AgentChat } from "./AgentChat"
import { ProjectSchema } from "../types/schema"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "./ui/sidebar"
import { Button } from "./ui/button"

interface AgentSidebarProps {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
}

function AgentFloatingTrigger() {
  const { toggleSidebar, open } = useSidebar()
  
  // Hide the floating button when sidebar is open
  if (open) return null
  
  return (
    <Button 
      onClick={toggleSidebar}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
    >
      <Bot className="h-6 w-6" />
    </Button>
  )
}

export function AgentSidebarWrapper({ project, onUpdateProject, children }: AgentSidebarProps & { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        {/* Main Content */}
        <div className="flex-1">
          {children}
        </div>
        
        {/* Agent Sidebar - Wider */}
        <Sidebar 
          side="right" 
          variant="sidebar" 
          collapsible="offcanvas"
        >
          <SidebarHeader className="border-b bg-sidebar-accent/50">
            <div className="flex items-center gap-2 px-4 py-3">
              <Bot className="h-5 w-5 text-sidebar-primary" />
              <h2 className="text-lg font-semibold">AI Agent</h2>
              <div className="ml-auto">
                <SidebarTrigger />
              </div>
            </div>
            <p className="text-sm text-sidebar-foreground/70 px-4 pb-3">
              Chat with your collaborative AI agent to build and improve components
            </p>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <AgentChat 
              project={project} 
              onUpdateProject={onUpdateProject}
            />
          </SidebarContent>
        </Sidebar>
        
        {/* Floating Trigger */}
        <AgentFloatingTrigger />
      </div>
    </SidebarProvider>
  )
}