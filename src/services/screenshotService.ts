import html2canvas from 'html2canvas'
import type { ProjectSchema, ComponentSchema } from '../types/schema'

export interface Screenshot {
  id: string
  componentId?: string
  sceneId?: string
  captureMode: 'full' | 'component' | 'viewport'
  dataUrl: string
  width: number
  height: number
  timestamp: string
  metadata?: {
    userAgent?: string
    viewportSize?: { width: number; height: number }
    devicePixelRatio?: number
  }
}

export class ScreenshotService {
  private static screenshots: Map<string, Screenshot> = new Map()

  static async captureElement(
    element: HTMLElement,
    options: {
      componentId?: string
      sceneId?: string
      captureMode: 'full' | 'component' | 'viewport'
    }
  ): Promise<Screenshot> {
    try {
      // Add a slight delay to ensure styles are fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true, // Allow cross-origin images
        allowTaint: true
      })

      const dataUrl = canvas.toDataURL('image/png')
      const screenshot: Screenshot = {
        id: `screenshot-${Date.now()}`,
        componentId: options.componentId,
        sceneId: options.sceneId,
        captureMode: options.captureMode,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: navigator.userAgent,
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          devicePixelRatio: window.devicePixelRatio
        }
      }

      // Store screenshot
      this.screenshots.set(screenshot.id, screenshot)

      return screenshot
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      throw error
    }
  }

  static async capturePreview(options: {
    componentId?: string
    captureMode?: 'full' | 'component' | 'viewport'
  } = {}): Promise<Screenshot> {
    const { componentId, captureMode = 'viewport' } = options

    let targetElement: HTMLElement | null = null

    if (componentId && captureMode === 'component') {
      // Try to find the specific component in the preview
      targetElement = document.querySelector(`[data-component-id="${componentId}"]`)
    }

    if (!targetElement) {
      // Fall back to the main preview container
      targetElement = document.querySelector('#preview-container') || 
                     document.querySelector('.preview-content') ||
                     document.querySelector('[data-preview]')
    }

    if (!targetElement) {
      throw new Error('No preview element found to capture')
    }

    return this.captureElement(targetElement, {
      componentId: options.componentId,
      captureMode: options.captureMode || 'viewport'
    })
  }

  static async captureAndUploadToCDN(
    screenshot: Screenshot,
    bunnycdnService: any
  ): Promise<{ success: boolean; cdnUrl?: string; error?: string }> {
    try {
      // Convert data URL to base64
      const base64Data = screenshot.dataUrl.split(',')[1]
      
      const fileName = `screenshot-${screenshot.id}.png`
      const description = `Screenshot captured at ${screenshot.timestamp} (${screenshot.captureMode} mode)`

      const uploadResult = await bunnycdnService.uploadImage({
        base64Data,
        fileName,
        description,
        folder: 'screenshots',
        tags: ['screenshot', screenshot.captureMode]
      })

      return uploadResult
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  static getScreenshot(id: string): Screenshot | undefined {
    return this.screenshots.get(id)
  }

  static getAllScreenshots(): Screenshot[] {
    return Array.from(this.screenshots.values())
  }

  static getComponentScreenshots(componentId: string): Screenshot[] {
    return Array.from(this.screenshots.values())
      .filter(s => s.componentId === componentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  static clearScreenshots() {
    this.screenshots.clear()
  }

  // Analyze screenshot for aesthetic qualities
  static async analyzeScreenshot(screenshot: Screenshot): Promise<{
    hasContent: boolean
    dimensions: { width: number; height: number; aspectRatio: number }
    quality: 'high' | 'medium' | 'low'
    suggestions?: string[]
  }> {
    // Create temporary image to analyze
    const img = new Image()
    img.src = screenshot.dataUrl

    await new Promise(resolve => {
      img.onload = resolve
    })

    const hasContent = img.width > 100 && img.height > 100
    const aspectRatio = img.width / img.height
    
    // Basic quality assessment based on resolution
    let quality: 'high' | 'medium' | 'low' = 'low'
    if (img.width >= 1200 && img.height >= 800) quality = 'high'
    else if (img.width >= 800 && img.height >= 600) quality = 'medium'

    const suggestions: string[] = []
    
    if (!hasContent) {
      suggestions.push('Screenshot appears to be empty or too small')
    }
    
    if (aspectRatio > 3 || aspectRatio < 0.3) {
      suggestions.push('Unusual aspect ratio detected - consider adjusting component dimensions')
    }

    if (quality === 'low') {
      suggestions.push('Low resolution screenshot - component may appear too small')
    }

    return {
      hasContent,
      dimensions: {
        width: img.width,
        height: img.height,
        aspectRatio
      },
      quality,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    }
  }
} 