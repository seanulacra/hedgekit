import { useState } from 'react'
import { ComponentGeneratorInterface } from './components/ComponentGenerator'
import { ProjectSchemaViewer } from './components/ProjectSchemaViewer'
import { WebContainerPreview } from './components/WebContainerPreview'
import { ProjectManager } from './components/ProjectManager'
import { ImageGenerator } from './components/ImageGenerator'
import { ImageAssetManager } from './components/ImageAssetManager'
import { AgentDrawer } from './components/AgentDrawer'
import { ModeToggle } from './components/mode-toggle'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { useProjectManager } from './hooks/useProjectManager'
import type { ComponentSchema, ImageAsset } from './types/schema'

function App() {
  const [showProjectManager, setShowProjectManager] = useState(false)
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-4xl font-bold">HedgeKit</h1>
            <p className="text-xl text-muted-foreground">
              Collaborative Agents for More Precise UI Generation
            </p>
          </div>
          <ModeToggle />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="text-blue-600 font-medium">
              📁 {currentProject.name}
            </span>
            {currentProject.components.length > 0 && (
              <span className="text-green-600">
                ✓ {currentProject.components.length} components
              </span>
            )}
            {(currentProject.assets?.length || 0) > 0 && (
              <span className="text-purple-600">
                🎨 {currentProject.assets?.length} assets
              </span>
            )}
            <button 
              onClick={() => setShowProjectManager(true)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Switch Project
            </button>
          </div>
        </div>
        
        <Tabs defaultValue="build" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="build">🔨 Build Tools</TabsTrigger>
            <TabsTrigger value="project">📁 Project</TabsTrigger>
            <TabsTrigger value="preview">👁️ Live Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <ComponentGeneratorInterface 
                projectSchema={currentProject}
                onComponentGenerated={handleComponentGenerated}
              />
              <ImageGenerator onImageGenerated={handleImageGenerated} />
            </div>
          </TabsContent>
          
          <TabsContent value="project" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <ProjectSchemaViewer schema={currentProject} />
              <ImageAssetManager 
                assets={currentProject.assets || []}
                onAssetUpdate={handleImageUpdate}
                onAssetDelete={handleImageDelete}
                onAssetAdd={handleImageGenerated}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-6">
            <div className="max-w-full mx-auto">
              <WebContainerPreview projectSchema={currentProject} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Clean Agent Drawer */}
      <AgentDrawer 
        project={currentProject}
        onUpdateProject={updateCurrentProject}
      />
    </div>
  )
}

export default App