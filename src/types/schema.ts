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

export interface ProjectSchema {
  id: string
  name: string
  description: string
  framework: 'react'
  components: ComponentSchema[]
  assets: ImageAsset[]
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