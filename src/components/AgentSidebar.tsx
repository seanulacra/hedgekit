import * as React from "react"
import { Bot, MessageSquare, Zap } from "lucide-react"
import { AgentChat } from "./AgentChat"
import { ProjectSchema } from "../types/schema"
import type { UIActions } from "../services/agentTools"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "./ui/sidebar"

// Create the AI Agent Sidebar
export function AIAgentSidebar({ project, onUpdateProject, uiActions, ...props }: {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  uiActions?: UIActions
} & React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="cursor-default">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">AI Agent Studio</span>
                  <span className="truncate text-xs">Multi-Provider</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden flex-1 flex flex-col">
          <SidebarGroupLabel>Agent Chat</SidebarGroupLabel>
          <SidebarGroupContent className="px-0 flex-1 flex flex-col">
            <AgentChat 
              project={project} 
              onUpdateProject={onUpdateProject}
              uiActions={uiActions}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

// Main layout wrapper following shadcn pattern
export function AgentSidebarWrapper({ 
  project, 
  onUpdateProject, 
  uiActions, 
  children 
}: {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  uiActions?: UIActions
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "24rem",
        } as React.CSSProperties
      }
    >
      <AIAgentSidebar 
        project={project}
        onUpdateProject={onUpdateProject}
        uiActions={uiActions}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="size-4" />
            <span>AI-Powered Component Builder</span>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}