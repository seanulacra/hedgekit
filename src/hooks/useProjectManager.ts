import { useState, useEffect, useCallback } from 'react'
import type { ProjectSchema, ProjectMetadata } from '@/types/schema'

const PROJECTS_STORAGE_KEY = 'hedgekit-projects'
const CURRENT_PROJECT_KEY = 'hedgekit-current-project'

export function useProjectManager() {
  const [projects, setProjects] = useState<ProjectMetadata[]>([])
  const [currentProject, setCurrentProject] = useState<ProjectSchema | null>(null)

  // Load projects on mount
  useEffect(() => {
    loadProjects()
    loadCurrentProject()
  }, [])

  // Save projects whenever they change
  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  // Save current project whenever it changes
  useEffect(() => {
    if (currentProject) {
      saveCurrentProject(currentProject)
      updateProjectMetadata(currentProject)
    }
  }, [currentProject])

  const loadProjects = useCallback(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setProjects(parsed)
      }
    } catch (error) {
      console.warn('Failed to load projects:', error)
    }
  }, [])

  const loadCurrentProject = useCallback(() => {
    try {
      const saved = localStorage.getItem(CURRENT_PROJECT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCurrentProject(parsed)
      }
    } catch (error) {
      console.warn('Failed to load current project:', error)
    }
  }, [])

  const saveProjects = useCallback((projectList: ProjectMetadata[]) => {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projectList))
    } catch (error) {
      console.warn('Failed to save projects:', error)
    }
  }, [])

  const saveCurrentProject = useCallback((project: ProjectSchema) => {
    try {
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project))
    } catch (error) {
      console.warn('Failed to save current project:', error)
    }
  }, [])

  const updateProjectMetadata = useCallback((project: ProjectSchema) => {
    setProjects(prev => {
      const existing = prev.find(p => p.id === project.id)
      const metadata: ProjectMetadata = {
        id: project.id,
        name: project.name,
        description: project.description,
        framework: project.framework,
        componentCount: project.components.length,
        assetCount: project.assets?.length || 0,
        createdAt: existing?.createdAt || project.createdAt,
        updatedAt: project.updatedAt
      }

      if (existing) {
        return prev.map(p => p.id === project.id ? metadata : p)
      } else {
        return [...prev, metadata]
      }
    })
  }, [])

  const createProject = useCallback((projectData: Omit<ProjectSchema, 'components' | 'assets' | 'scenes' | 'updatedAt'>) => {
    const newProject: ProjectSchema = {
      ...projectData,
      components: [],
      assets: [],
      scenes: [],
      updatedAt: new Date().toISOString()
    }

    setCurrentProject(newProject)
    updateProjectMetadata(newProject)
  }, [updateProjectMetadata])

  const selectProject = useCallback((projectId: string) => {
    const projectKey = `hedgekit-project-${projectId}`
    try {
      const saved = localStorage.getItem(projectKey)
      if (saved) {
        const project = JSON.parse(saved)
        setCurrentProject(project)
      } else {
        // Project metadata exists but no full project data
        // Create a basic project from metadata
        const metadata = projects.find(p => p.id === projectId)
        if (metadata) {
          const basicProject: ProjectSchema = {
            id: metadata.id,
            name: metadata.name,
            description: metadata.description,
            framework: metadata.framework,
            components: [],
            assets: [],
            scenes: [],
            dependencies: {},
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt
          }
          setCurrentProject(basicProject)
        }
      }
    } catch (error) {
      console.warn('Failed to load project:', error)
    }
  }, [projects])

  const deleteProject = useCallback((projectId: string) => {
    // Remove from projects list
    setProjects(prev => prev.filter(p => p.id !== projectId))
    
    // Remove project data from localStorage
    const projectKey = `hedgekit-project-${projectId}`
    localStorage.removeItem(projectKey)
    
    // If this was the current project, clear it
    if (currentProject?.id === projectId) {
      setCurrentProject(null)
      localStorage.removeItem(CURRENT_PROJECT_KEY)
    }
  }, [currentProject])

  const updateCurrentProject = useCallback((updater: (prev: ProjectSchema) => ProjectSchema) => {
    setCurrentProject(prev => {
      if (!prev) return null
      const updated = updater(prev)
      
      // Save individual project data
      const projectKey = `hedgekit-project-${updated.id}`
      try {
        localStorage.setItem(projectKey, JSON.stringify(updated))
      } catch (error) {
        console.warn('Failed to save project data:', error)
      }
      
      return updated
    })
  }, [])

  return {
    projects,
    currentProject,
    createProject,
    selectProject,
    deleteProject,
    updateCurrentProject
  }
}