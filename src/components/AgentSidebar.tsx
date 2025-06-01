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
                  <span className="truncate font-semibold">HedgeKit</span>
                  <span className="truncate text-xs">Collaborative Agents for More Precise UI Generation</span>
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
  children,
  onShowProjectManager,
  headerActions
}: {
  project: ProjectSchema
  onUpdateProject: (updater: (prev: ProjectSchema) => ProjectSchema) => void
  uiActions?: UIActions
  children: React.ReactNode
  onShowProjectManager?: () => void
  headerActions?: React.ReactNode
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 border-b">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-600 font-medium">
                📁 {project.name}
              </span>
              {project.components.length > 0 && (
                <span className="text-green-600">
                  ✓ {project.components.length} components
                </span>
              )}
              {(project.assets?.length || 0) > 0 && (
                <span className="text-purple-600">
                  🎨 {project.assets?.length} assets
                </span>
              )}
              {onShowProjectManager && (
                <button 
                  onClick={onShowProjectManager}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Switch Project
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {headerActions}
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}