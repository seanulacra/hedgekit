import { useState } from 'react'
import { ComponentGeneratorInterface } from './components/ComponentGenerator'
import { ProjectSchemaViewer } from './components/ProjectSchemaViewer'
import { UnifiedPreview } from './components/UnifiedPreview'
import { ProjectManager } from './components/ProjectManager'
import { ImageGenerator } from './components/ImageGenerator'
import { ImageAssetManager } from './components/ImageAssetManager'
import { AgentSidebarWrapper } from './components/AgentSidebar'
import { ModeToggle } from './components/mode-toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { useProjectManager } from './hooks/useProjectManager'
import type { ComponentSchema, ImageAsset } from './types/schema'
import type { UIActions } from './services/agentTools'

function App() {
  const [showProjectManager, setShowProjectManager] = useState(false)
  const [activeTab, setActiveTab] = useState<'build' | 'project' | 'preview'>('build')
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set())
  const {
    projects,
    currentProject,
    createProject,
    selectProject,
    deleteProject,
    updateCurrentProject
  } = useProjectManager()

  const handleComponentGenerated = (component: ComponentSchema) => {
    updateCurrentProject(prev => ({
      ...prev,
      components: [...prev.components, component],
      updatedAt: new Date().toISOString()
    }))
  }

  const handleImageGenerated = (image: ImageAsset) => {
    updateCurrentProject(prev => ({
      ...prev,
      assets: [...(prev.assets || []), image],
      updatedAt: new Date().toISOString()
    }))
  }

  const handleImageUpdate = (id: string, updates: Partial<ImageAsset>) => {
    updateCurrentProject(prev => ({
      ...prev,
      assets: (prev.assets || []).map(asset => 
        asset.id === id ? { ...asset, ...updates } : asset
      ),
      updatedAt: new Date().toISOString()
    }))
  }

  const handleImageDelete = (id: string) => {
    updateCurrentProject(prev => ({
      ...prev,
      assets: (prev.assets || []).filter(asset => asset.id !== id),
      updatedAt: new Date().toISOString()
    }))
  }

  // UI Actions for agent tools
  const uiActions: UIActions = {
    switchTab: (tab: 'build' | 'project' | 'preview') => {
      setActiveTab(tab)
    },
    showComponentCode: (componentId: string) => {
      setActiveTab('project')
      setExpandedComponents(prev => new Set([...prev, componentId]))
    },
    focusPreviewComponent: (componentId: string) => {
      setActiveTab('preview')
      // Could add more preview-specific focus logic here
    }
  }

  // Show project manager if no current project or user wants to switch
  if (!currentProject || showProjectManager) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-center space-y-2 flex-1">
              <h1 className="text-4xl font-bold">HedgeKit</h1>
              <p className="text-xl text-muted-foreground">
                Collaborative Agents for More Precise UI Generation
              </p>
            </div>
            <ModeToggle />
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ProjectManager
              projects={projects}
              currentProject={currentProject}
              onProjectSelect={(projectId) => {
                selectProject(projectId)
                setShowProjectManager(false)
              }}
              onProjectCreate={(project) => {
                createProject(project)
                setShowProjectManager(false)
              }}
              onProjectDelete={deleteProject}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <AgentSidebarWrapper
        project={currentProject}
        onUpdateProject={updateCurrentProject}
        uiActions={uiActions}
        onShowProjectManager={() => setShowProjectManager(true)}
        headerActions={<ModeToggle />}
      >
        <div className="flex flex-1 flex-col gap-4 p-4">
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'build' | 'project' | 'preview')} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="build">🔨 Build Tools</TabsTrigger>
              <TabsTrigger value="project">📁 Project</TabsTrigger>
              <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="build" className="flex-1 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                <ComponentGeneratorInterface 
                  projectSchema={currentProject}
                  onComponentGenerated={handleComponentGenerated}
                />
                <ImageGenerator onImageGenerated={handleImageGenerated} />
              </div>
            </TabsContent>
            
            <TabsContent value="project" className="flex-1 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                <ProjectSchemaViewer 
                  schema={currentProject} 
                  expandedComponents={expandedComponents}
                  onToggleComponent={(componentId) => {
                    setExpandedComponents(prev => {
                      const newExpanded = new Set(prev)
                      if (newExpanded.has(componentId)) {
                        newExpanded.delete(componentId)
                      } else {
                        newExpanded.add(componentId)
                      }
                      return newExpanded
                    })
                  }}
                />
                <ImageAssetManager 
                  assets={currentProject.assets || []}
                  onAssetUpdate={handleImageUpdate}
                  onAssetDelete={handleImageDelete}
                  onAssetAdd={handleImageGenerated}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 mt-4">
              <div className="h-full">
                <UnifiedPreview 
                  project={currentProject} 
                  onUpdateProject={updateCurrentProject}
                  uiActions={uiActions}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AgentSidebarWrapper>
  )
}

export default App