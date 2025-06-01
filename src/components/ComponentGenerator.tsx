import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ComponentGenerator } from '@/lib/generator'
import { V0GenerationService } from '@/services/v0Generation'
import type { ProjectSchema, ComponentSchema } from '@/types/schema'

interface ComponentGeneratorProps {
  projectSchema: ProjectSchema
  onComponentGenerated: (component: ComponentSchema) => void
}

export function ComponentGeneratorInterface({ 
  projectSchema, 
  onComponentGenerated 
}: ComponentGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationMethod, setGenerationMethod] = useState<'openai' | 'v0'>('openai')

  const generator = new ComponentGenerator()
  const isV0Available = V0GenerationService.isV0Available()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a component description')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      let component: ComponentSchema

      if (generationMethod === 'v0') {
        // Use v0 generation
        const v0Response = await V0GenerationService.generateComponent({
          prompt,
          projectContext: {
            framework: projectSchema.framework,
            components: projectSchema.components.map(c => c.name),
            dependencies: projectSchema.dependencies
          }
        })

        // Convert v0 response to ComponentSchema format
        component = {
          id: crypto.randomUUID(),
          name: v0Response.componentName,
          type: 'component',
          framework: 'react',
          props: {}, // v0 doesn't provide prop definitions
          source: 'custom',
          filePath: `src/components/${v0Response.componentName}.tsx`,
          generatedCode: v0Response.code,
          generationMethod: 'v0'
        }
      } else {
        // Use OpenAI generation
        const apiKey = import.meta.env.VITE_OPEN_AI_KEY
        if (!apiKey) {
          setError('OpenAI API key not configured. Please set VITE_OPEN_AI_KEY environment variable.')
          return
        }
        
        generator.setApiKey(apiKey)
        
        component = await generator.generateComponent({
          prompt,
          projectSchema
        })
      }

      onComponentGenerated(component)
      setPrompt('')
      setError(null)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate component')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Component Generator</CardTitle>
        <CardDescription>
          Describe the component you want to generate and our AI will create it for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Generation Method</Label>
          <div className="flex items-center gap-2">
            <Select value={generationMethod} onValueChange={(value: 'openai' | 'v0') => setGenerationMethod(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI GPT</SelectItem>
                <SelectItem value="v0" disabled={!isV0Available}>
                  Vercel v0
                </SelectItem>
              </SelectContent>
            </Select>
            {generationMethod === 'v0' && (
              <Badge variant="secondary">Pro</Badge>
            )}
            {!isV0Available && generationMethod === 'v0' && (
              <span className="text-xs text-muted-foreground">
                Requires VITE_VERCEL_TOKEN
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Component Description</Label>
          <Textarea
            id="prompt"
            placeholder="e.g., Create a user profile card with avatar, name, email, and a follow button"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !prompt.trim() || (generationMethod === 'v0' && !isV0Available)}
          className="w-full"
        >
          {isGenerating 
            ? `Generating with ${generationMethod === 'v0' ? 'v0' : 'OpenAI'}...` 
            : `Generate with ${generationMethod === 'v0' ? 'v0' : 'OpenAI'}`
          }
        </Button>
      </CardContent>
    </Card>
  )
}