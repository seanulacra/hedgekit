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
  base64: string
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

export interface GenerationRequest {
  prompt: string
  componentType?: string
  targetComponent?: string
  projectSchema: ProjectSchema
}