import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FolderOpen, Trash2 } from 'lucide-react'
import type { ProjectSchema, ProjectMetadata } from '@/types/schema'

interface ProjectManagerProps {
  projects: ProjectMetadata[]
  currentProject: ProjectSchema | null
  onProjectSelect: (projectId: string) => void
  onProjectCreate: (project: Omit<ProjectSchema, 'components' | 'assets' | 'updatedAt'>) => void
  onProjectDelete: (projectId: string) => void
}

export function ProjectManager({ 
  projects, 
  currentProject, 
  onProjectSelect, 
  onProjectCreate, 
  onProjectDelete 
}: ProjectManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  })

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const project = {
      id: `project-${Date.now()}`,
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      framework: 'react' as const,
      dependencies: {},
      createdAt: new Date().toISOString()
    }

    onProjectCreate(project)
    setNewProject({ name: '', description: '' })
    setIsCreateDialogOpen(false)
  }

  const handleDeleteProject = (projectId: string, projectName: string) => {
    const confirmed = confirm(`Delete project "${projectName}"? This cannot be undone.`)
    if (confirmed) {
      onProjectDelete(projectId)
    }
  }

  return (
    <Card className="border-none shadow-none">
 
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Your Projects</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new HedgeKit project for component generation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProject.name}
                    onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Awesome Project"
                  />
                </div>
                <div>
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A brief description of your project..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} disabled={!newProject.name.trim()}>
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No projects yet</p>
            <p className="text-sm mb-6">Create your first project to start building with AI agents</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`group cursor-pointer transition-all hover:shadow-md ${
                  currentProject?.id === project.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => onProjectSelect(project.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{project.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {currentProject?.id === project.id && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Active
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id, project.name)
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      🧩 {project.componentCount} components
                    </span>
                    <span className="flex items-center gap-1">
                      🎨 {project.assetCount} assets
                    </span>
                    <span className="ml-auto">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}