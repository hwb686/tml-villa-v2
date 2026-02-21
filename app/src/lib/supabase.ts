import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const defaultBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'homestay-images'

export const STORAGE_BUCKETS = {
  homestay: 'homestay-images',
  meal: 'meal-images',
  car: 'car-images',
  ticket: 'ticket-images',
} as const

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase环境变量未配置')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null

export async function uploadImage(file: File, bucket: string = defaultBucket): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase客户端未初始化')
  }
  
  const fileName = `${Date.now()}_${file.name}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { cacheControl: '3600', upsert: false })
  
  if (error) {
    throw new Error(`上传失败: ${error.message}`)
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

export async function uploadImages(files: File[], bucket?: string): Promise<string[]> {
  return Promise.all(files.map(file => uploadImage(file, bucket)))
}

function extractBucketAndFileName(url: string): { bucket: string; fileName: string } | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const publicIndex = pathParts.findIndex(p => p === 'public')
    if (publicIndex === -1 || publicIndex + 2 >= pathParts.length) {
      return null
    }
    return {
      bucket: pathParts[publicIndex + 1],
      fileName: pathParts[publicIndex + 2]
    }
  } catch {
    return null
  }
}

export async function deleteImage(imageUrl: string): Promise<void> {
  if (!supabase) return
  
  const result = extractBucketAndFileName(imageUrl)
  if (!result) return
  
  await supabase.storage.from(result.bucket).remove([result.fileName])
}

export async function deleteImages(imageUrls: string[]): Promise<void> {
  await Promise.all(imageUrls.map(url => deleteImage(url)))
}