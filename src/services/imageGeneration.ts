export interface ImageGenerationRequest {
  prompt: string
  model: 'gpt-image-1'
  background?: 'transparent' | 'opaque' | 'auto'
  size?: string
  output_format?: 'png' | 'jpeg' | 'webp'
  quality?: 'high' | 'medium' | 'low'
  output_compression?: number
  moderation?: 'low' | 'auto'
  n?: number
}

export interface ImageGenerationResponse {
  data: Array<{
    b64_json: string
  }>
  usage?: {
    total_tokens: number
    input_tokens: number
    output_tokens: number
  }
}

export class ImageGenerationService {
  
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const apiKey = import.meta.env.VITE_OPEN_AI_KEY
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPEN_AI_KEY environment variable.')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          model: 'gpt-image-1',
          background: request.background || 'transparent',
          size: request.size || '1024x1024',
          output_format: request.output_format || 'png',
          quality: request.quality || 'high',
          output_compression: request.output_compression || 100,
          moderation: request.moderation || 'auto',
          n: request.n || 1
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      throw error
    }
  }
  
  static async editImage(
    imageBase64: string,
    prompt: string,
    options: Partial<ImageGenerationRequest> = {}
  ): Promise<ImageGenerationResponse> {
    const apiKey = import.meta.env.VITE_OPEN_AI_KEY
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPEN_AI_KEY environment variable.')
    }

    try {
      // Convert base64 to blob for the API
      const base64Data = imageBase64.startsWith('data:') 
        ? imageBase64.split(',')[1] 
        : imageBase64
      
      const imageBlob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob())
      
      const formData = new FormData()
      formData.append('image', imageBlob, 'image.png')
      formData.append('prompt', prompt)
      formData.append('model', 'gpt-image-1')
      formData.append('background', options.background || 'transparent')
      formData.append('size', options.size || '1024x1024')
      formData.append('quality', options.quality || 'high')
      formData.append('n', String(options.n || 1))

      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error calling OpenAI edit API:', error)
      throw error
    }
  }
}