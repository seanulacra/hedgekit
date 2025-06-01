import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { ImageGenerationService } from '../services/imageGeneration'
import type { ImageAsset } from '@/types/schema'

interface ImageGeneratorProps {
  onImageGenerated: (image: ImageAsset) => void
}

export function ImageGenerator({ onImageGenerated }: ImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [imageName, setImageName] = useState('')
  const [background, setBackground] = useState<'transparent' | 'opaque' | 'auto'>('transparent')
  const [size, setSize] = useState('1024x1024')
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')

  const handleGenerate = async () => {
    if (!prompt.trim() || !imageName.trim()) return

    setIsGenerating(true)
    try {
      // ImageGenerationService already imported at top
      
      const response = await ImageGenerationService.generateImage({
        prompt: prompt.trim(),
        model: 'gpt-image-1',
        background,
        size,
        output_format: format,
        quality,
        n: 1
      })

      const imageData = response.data[0]

      const newImage: ImageAsset = {
        id: crypto.randomUUID(),
        name: imageName.trim(),
        prompt: prompt.trim(),
        base64: imageData.b64_json,
        format,
        size,
        background,
        model: 'gpt-image-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      onImageGenerated(newImage)
      
      // Reset form
      setPrompt('')
      setImageName('')
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Image Generator
        </CardTitle>
        <CardDescription>
          Generate images using OpenAI's gpt-image-1 model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="image-name">Image Name</Label>
          <Input
            id="image-name"
            placeholder="e.g., hero-banner, product-icon"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Background</Label>
            <Select value={background} onValueChange={(value: 'transparent' | 'opaque' | 'auto') => setBackground(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transparent">Transparent</SelectItem>
                <SelectItem value="opaque">Opaque</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Size</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                <SelectItem value="1536x1024">Landscape (1536x1024)</SelectItem>
                <SelectItem value="1024x1536">Portrait (1024x1536)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(value: 'png' | 'jpeg' | 'webp') => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quality</Label>
            <Select value={quality} onValueChange={(value: 'high' | 'medium' | 'low') => setQuality(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!prompt.trim() || !imageName.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generate Image
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}