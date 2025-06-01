import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WebContainerManager } from '@/lib/webcontainer'
import type { ProjectSchema } from '@/types/schema'

interface WebContainerPreviewProps {
  projectSchema: ProjectSchema
}

export function WebContainerPreview({ projectSchema }: WebContainerPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const webContainerRef = useRef<WebContainerManager | null>(null)

  const initializePreview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      if (!webContainerRef.current) {
        webContainerRef.current = new WebContainerManager()
        await webContainerRef.current.initialize()
      }

      await webContainerRef.current.createProject(projectSchema)
      const url = await webContainerRef.current.startDevServer()
      setPreviewUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize preview')
      console.error('Preview initialization error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      webContainerRef.current = null
    }
  }, [])

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>
          See your generated components in action
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            onClick={initializePreview}
            disabled={isLoading || !!previewUrl}
            size="sm"
            variant={previewUrl ? "secondary" : "default"}
          >
            {isLoading ? 'Initializing...' : previewUrl ? 'Preview Active' : 'Start Preview'}
          </Button>
          {previewUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              Open in New Tab
            </Button>
          )}
          {previewUrl && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setPreviewUrl(null)
                webContainerRef.current = null
              }}
            >
              Stop Preview
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 m-4 rounded-md">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Initializing WebContainer...</p>
            </div>
          </div>
        )}

        {previewUrl && !isLoading && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-96 border-0 rounded-b-lg"
            title="Component Preview"
          />
        )}

        {!previewUrl && !isLoading && !error && (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Click "Start Preview" to see your components live</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}