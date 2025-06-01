export class BunnyCDNService {
  private storageZoneName: string
  private storageZoneApiKey: string
  private pullZoneHostname: string
  private storageZoneHostname: string

  constructor() {
    this.storageZoneName = import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_NAME!
    this.storageZoneApiKey = import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_API_KEY!
    this.pullZoneHostname = import.meta.env.VITE_BUNNYCDN_PULL_ZONE_HOSTNAME!
    this.storageZoneHostname = import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_HOSTNAME!
  }

  async uploadImage({
    base64Data,
    fileName,
    description = '',
    folder = 'agent_generated',
    tags = [],
  }: {
    base64Data: string
    fileName: string
    description?: string
    folder?: string
    tags?: string[]
  }): Promise<{ success: boolean; publicUrl?: string; fileId?: string; error?: string }> {
    try {
      // Clean base64 data (remove data URI prefix if present)
      const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z]*;base64,/, '')
      
      // Convert base64 to blob for browser environment
      const byteCharacters = atob(cleanBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substr(2, 9)
      const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : 'png'
      const uniqueFileName = `${fileName.replace(/\.[^/.]+$/, '')}_${timestamp}_${randomId}.${extension}`
      
      // Create the full path with folder
      const fullPath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName

      // Upload to BunnyCDN Storage
      const storageUrl = `https://${this.storageZoneHostname}/${this.storageZoneName}/${fullPath}`
      
      const response = await fetch(storageUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': this.storageZoneApiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`BunnyCDN upload failed: ${response.status} ${errorText}`)
      }

      // Construct public URL
      const publicUrl = `https://${this.pullZoneHostname}/${fullPath}`

      return {
        success: true,
        publicUrl,
        fileId: fullPath, // Use the path as the file ID
      }
    } catch (error) {
      console.error('BunnyCDN upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  async deleteImage(fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const storageUrl = `https://${this.storageZoneHostname}/${this.storageZoneName}/${fileId}`
      
      const response = await fetch(storageUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': this.storageZoneApiKey,
        },
      })

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text()
        throw new Error(`BunnyCDN delete failed: ${response.status} ${errorText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('BunnyCDN delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      }
    }
  }

  async getImageDetails(fileId: string) {
    try {
      // BunnyCDN doesn't have a direct API to get file details from storage
      // We can check if the file exists by trying to fetch its headers
      const publicUrl = `https://${this.pullZoneHostname}/${fileId}`
      
      const response = await fetch(publicUrl, {
        method: 'HEAD',
      })

      if (!response.ok) {
        throw new Error(`File not found: ${response.status}`)
      }

      return { 
        success: true, 
        data: {
          url: publicUrl,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          lastModified: response.headers.get('last-modified'),
        }
      }
    } catch (error) {
      console.error('BunnyCDN get details error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get details',
      }
    }
  }

  static isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_NAME &&
      import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_API_KEY &&
      import.meta.env.VITE_BUNNYCDN_PULL_ZONE_HOSTNAME &&
      import.meta.env.VITE_BUNNYCDN_STORAGE_ZONE_HOSTNAME
    )
  }
} 