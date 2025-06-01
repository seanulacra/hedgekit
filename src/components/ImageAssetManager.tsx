import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Download, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Calendar,
  FileImage 
} from 'lucide-react'
import { ImageEditor } from './ImageEditor'
import type { ImageAsset } from '@/types/schema'

interface ImageAssetManagerProps {
  assets: ImageAsset[]
  onAssetUpdate: (id: string, updates: Partial<ImageAsset>) => void
  onAssetDelete: (id: string) => void
  onAssetAdd?: (asset: ImageAsset) => void
}

export function ImageAssetManager({ assets, onAssetUpdate, onAssetDelete, onAssetAdd }: ImageAssetManagerProps) {
  const [selectedAsset, setSelectedAsset] = useState<ImageAsset | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const downloadAsset = (asset: ImageAsset) => {
    const link = document.createElement('a')
    link.href = asset.base64.startsWith('data:') ? asset.base64 : `data:image/${asset.format};base64,${asset.base64}`
    link.download = `${asset.name}.${asset.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleEditStart = (asset: ImageAsset) => {
    setSelectedAsset(asset)
    setEditingName(asset.name)
    setIsEditDialogOpen(true)
  }

  const handleEditSave = () => {
    if (selectedAsset && editingName.trim()) {
      onAssetUpdate(selectedAsset.id, { 
        name: editingName.trim(),
        updatedAt: new Date().toISOString()
      })
      setIsEditDialogOpen(false)
      setSelectedAsset(null)
      setEditingName('')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Image Assets
          </CardTitle>
          <CardDescription>
            No images generated yet. Use the Image Generator to create your first asset.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          Image Assets ({assets.length})
        </CardTitle>
        <CardDescription>
          Manage your generated images and assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{asset.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {asset.prompt}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{asset.name}</DialogTitle>
                        <DialogDescription>{asset.prompt}</DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img
                          src={asset.base64.startsWith('data:') ? asset.base64 : `data:image/${asset.format};base64,${asset.base64}`}
                          alt={asset.name}
                          className="max-w-full max-h-96 rounded-lg"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStart(asset)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {onAssetAdd && (
                    <ImageEditor 
                      asset={asset} 
                      onImageEdited={onAssetAdd}
                    />
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadAsset(asset)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(asset.base64.startsWith('data:') ? asset.base64 : `data:image/${asset.format};base64,${asset.base64}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAssetDelete(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{asset.format.toUpperCase()}</Badge>
                <Badge variant="secondary">{asset.size}</Badge>
                <Badge variant="secondary">{asset.background}</Badge>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(asset.createdAt)}
                </Badge>
              </div>

              <div className="relative group">
                <img
                  src={asset.base64.startsWith('data:') ? asset.base64 : `data:image/${asset.format};base64,${asset.base64}`}
                  alt={asset.name}
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            </div>
          ))}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
              <DialogDescription>
                Update the name of your image asset
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name</Label>
                <Input
                  id="asset-name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="Enter asset name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}