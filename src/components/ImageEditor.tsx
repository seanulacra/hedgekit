import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Loader2, Edit, Wand2 } from 'lucide-react'
import type { ImageAsset } from '@/types/schema'

interface ImageEditorProps {
  asset: ImageAsset
  onImageEdited: (editedAsset: ImageAsset) => void
}

export function ImageEditor({ asset, onImageEdited }: ImageEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editPrompt, setEditPrompt] = useState('')
  const [newName, setNewName] = useState(asset.name)
  const [background, setBackground] = useState<'transparent' | 'opaque' | 'auto'>(asset.background)
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>(asset.format)
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high')

  const handleEdit = async () => {
    if (!editPrompt.trim()) return

    setIsEditing(true)
    try {
      const { ImageGenerationService } = await import('@/services/imageGeneration')
      
      const response = await ImageGenerationService.editImage(
        asset.base64,
        editPrompt.trim(),
        {
          model: 'gpt-image-1',
          background,
          size: asset.size,
          output_format: format,
          quality,
          n: 1
        }
      )

      const imageData = response.data[0]

      const editedAsset: ImageAsset = {
        ...asset,
        id: crypto.randomUUID(), // New ID for the edited version
        name: newName.trim() || `${asset.name} (edited)`,
        prompt: `${asset.prompt} | Edit: ${editPrompt.trim()}`,
        base64: imageData.b64_json,
        format,
        background,
        updatedAt: new Date().toISOString()
      }

      onImageEdited(editedAsset)
      setIsDialogOpen(false)
      
      // Reset form
      setEditPrompt('')
      setNewName(asset.name)
    } catch (error) {
      console.error('Error editing image:', error)
      alert('Failed to edit image. Please try again.')
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="h-4 w-4" />
          Edit Image
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Modify your image using AI-powered editing
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Image Preview */}
          <div className="space-y-2">
            <Label>Current Image</Label>
            <div className="border rounded-lg p-2">
              <img
                src={asset.base64.startsWith('data:') ? asset.base64 : `data:image/${asset.format};base64,${asset.base64}`}
                alt={asset.name}
                className="w-full max-h-48 object-contain rounded"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Original prompt: {asset.prompt}
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">New Name (optional)</Label>
              <Input
                id="new-name"
                placeholder="Leave empty to auto-generate"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-prompt">Edit Instructions</Label>
              <Textarea
                id="edit-prompt"
                placeholder="Describe how you want to modify the image..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEdit} 
              disabled={!editPrompt.trim() || isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Apply Edit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}