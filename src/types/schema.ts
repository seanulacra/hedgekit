export interface ComponentSchema {
  id: string
  name: string
  type: 'component'
  framework: 'react'
  props: Record<string, PropDefinition>
  state?: Record<string, StateDefinition>
  children?: ComponentSchema[]
  source: 'local' | 'shadcn' | 'custom'
  filePath?: string
  generatedCode?: string
  generationMethod?: 'openai' | 'v0'
}

export interface PropDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  required: boolean
  defaultValue?: any
  description?: string
}

export interface StateDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  initialValue: any
  description?: string
}

export interface ImageAsset {
  id: string
  name: string
  prompt: string
  url?: string
  base64?: string // Made optional since it's removed after CDN upload
  cdnUrl?: string // CDN URL after upload
  format: 'png' | 'jpeg' | 'webp'
  size: string
  background: 'transparent' | 'opaque' | 'auto'
  model: 'gpt-image-1'
  createdAt: string
  updatedAt: string
}

// Scene composition types
export interface ComponentInstance {
  id: string
  componentId: string // References ComponentSchema.id
  props: Record<string, any> // Instance-specific prop values
  position: {
    x: number
    y: number
    z?: number // For layering
  }
  size: {
    width: number | 'auto'
    height: number | 'auto'
  }
  constraints?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
  metadata?: {
    label?: string
    locked?: boolean
    visible?: boolean
  }
}

export interface SceneLayout {
  type: 'freeform' | 'grid' | 'flex'
  container: {
    width: number
    height: number
    background?: string
  }
  grid?: {
    columns: number
    rows: number
    gap: number
  }
  flex?: {
    direction: 'row' | 'column'
    wrap: boolean
    justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
    align: 'start' | 'center' | 'end' | 'stretch'
  }
}

export interface Scene {
  id: string
  name: string
  description?: string
  layout: SceneLayout
  instances: ComponentInstance[]
  viewport: {
    width: number
    height: number
    scale: number
  }
  createdAt: string
  updatedAt: string
}

export interface ProjectSchema {
  id: string
  name: string
  description: string
  framework: 'react'
  components: ComponentSchema[]
  assets: ImageAsset[]
  scenes: Scene[]
  activeSceneId?: string // Currently active scene for live view
  dependencies: Record<string, string>
  plan?: ProjectPlan // Comprehensive project plan
  screenshots?: {
    id: string
    componentId?: string
    timestamp: string
    cdnUrl?: string
    analysis?: {
      hasContent: boolean
      quality: 'high' | 'medium' | 'low'
      dimensions: { width: number; height: number; aspectRatio: number }
    }
  }[]
  createdAt: string
  updatedAt: string
}

export interface ProjectMetadata {
  id: string
  name: string
  description: string
  framework: 'react'
  componentCount: number
  assetCount: number
  createdAt: string
  updatedAt: string
}

// Project Planning Interfaces
export interface ProjectPlan {
  id: string
  projectId: string
  title: string
  overview: string
  targetUsers: string[]
  coreFeatures: string[]
  technicalStack: TechnicalStack
  phases: ProjectPhase[]
  milestones: Milestone[]
  designSystem: DesignSystemSpec
  componentArchitecture: ComponentArchitecture
  generatedBy: 'claude-3-5-sonnet' | 'gpt-4' | 'claude-3-opus'
  createdAt: string
  updatedAt: string
  status: 'draft' | 'active' | 'completed' | 'on-hold'
}

export interface TechnicalStack {
  frontend: {
    framework: 'react' | 'vue' | 'svelte'
    styling: 'tailwind' | 'styled-components' | 'emotion' | 'css-modules'
    stateManagement?: 'zustand' | 'redux' | 'context' | 'jotai'
    routing?: 'react-router' | 'next-router' | 'reach-router'
    testing?: 'jest' | 'vitest' | 'cypress' | 'playwright'
  }
  backend?: {
    framework: 'express' | 'fastapi' | 'django' | 'nest'
    database: 'postgresql' | 'mongodb' | 'sqlite' | 'firebase'
    auth?: 'clerk' | 'auth0' | 'firebase-auth' | 'supabase-auth'
  }
  deployment: {
    hosting: 'vercel' | 'netlify' | 'aws' | 'heroku'
    cicd?: 'github-actions' | 'vercel' | 'netlify'
  }
  dependencies: Record<string, string>
}

export interface ProjectPhase {
  id: string
  name: string
  description: string
  duration: string // e.g., "2 weeks", "1 month"
  order: number
  tasks: ProjectTask[]
  deliverables: string[]
  prerequisites: string[]
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked'
}

export interface ProjectTask {
  id: string
  title: string
  description: string
  type: 'component' | 'feature' | 'integration' | 'design' | 'testing' | 'deployment'
  estimatedHours: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee?: 'agent' | 'human' | 'both'
  dependencies: string[] // Task IDs
  acceptanceCriteria: string[]
  status: 'todo' | 'in-progress' | 'review' | 'done'
  agentNotes?: string
  completedAt?: string
}

export interface Milestone {
  id: string
  name: string
  description: string
  targetDate: string
  achievements: string[]
  success_criteria: string[]
  status: 'upcoming' | 'in-progress' | 'completed' | 'missed'
  completedAt?: string
}

export interface DesignSystemSpec {
  colorPalette: {
    primary: string[]
    secondary: string[]
    neutral: string[]
    semantic: {
      success: string
      warning: string
      error: string
      info: string
    }
  }
  typography: {
    fontFamilies: string[]
    scales: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
    }
  }
  spacing: {
    unit: number // base spacing unit (e.g., 4px, 8px)
    scale: number[] // multipliers [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]
  }
  components: {
    baseComponents: string[] // Button, Input, Card, etc.
    patterns: string[] // Navigation, Forms, Data Display, etc.
    layouts: string[] // Grid, Flex, Container, etc.
  }
}

export interface ComponentArchitecture {
  patterns: {
    stateManagement: 'props-down' | 'context' | 'global-store' | 'hybrid'
    componentComposition: 'monolithic' | 'atomic' | 'compound' | 'mixed'
    dataFlow: 'unidirectional' | 'bidirectional' | 'event-driven'
  }
  structure: {
    directories: string[]
    namingConventions: {
      components: string // e.g., "PascalCase"
      files: string // e.g., "kebab-case"
      props: string // e.g., "camelCase"
    }
    importStrategy: 'relative' | 'absolute' | 'barrel-exports'
  }
  componentHierarchy: ComponentHierarchyNode[]
}

export interface ComponentHierarchyNode {
  name: string
  type: 'layout' | 'page' | 'feature' | 'ui' | 'utility'
  description: string
  children?: ComponentHierarchyNode[]
  props?: string[]
  responsibilities: string[]
  dependencies: string[]
}

export interface GenerationRequest {
  prompt: string
  componentType?: string
  targetComponent?: string
  projectSchema: ProjectSchema
}