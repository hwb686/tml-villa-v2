import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// 前端使用的 bucket 名称（必须与 Supabase 控制台中创建的 bucket 一致）
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET || 'homestay-images'

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase环境变量未配置，请在.env文件中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

// 创建Supabase客户端实例
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// 图片上传工具函数
export async function uploadImage(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase客户端未初始化，请检查环境变量配置')
  }

  try {
    const fileName = `${Date.now()}_${file.name}`
    
    const { error } = await supabase.storage
      .from(supabaseBucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`上传失败: ${error.message}`)
    }

    // 获取公共URL
    const { data } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(fileName)

    return data.publicUrl
  } catch (error) {
    console.error('图片上传错误:', error)
    throw error
  }
}

// 批量上传图片
export async function uploadImages(files: File[]): Promise<string[]> {
  const uploadPromises = files.map(file => uploadImage(file))
  return Promise.all(uploadPromises)
}

// 从URL中提取文件名
function extractFileNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    // Supabase URL格式: /storage/v1/object/public/homestay-images/filename
    const fileName = pathParts[pathParts.length - 1]
    return fileName || null
  } catch {
    return null
  }
}

// 删除单张图片
export async function deleteImage(imageUrl: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase客户端未初始化')
  }

  const fileName = extractFileNameFromUrl(imageUrl)
  if (!fileName) {
    console.warn('无法从URL提取文件名:', imageUrl)
    return
  }

  try {
    const { error } = await supabase.storage
      .from(supabaseBucket)
      .remove([fileName])

    if (error) {
      console.error('删除图片失败:', error)
      // 不抛出错误，因为删除记录应该继续
    }
  } catch (error) {
    console.error('删除图片错误:', error)
  }
}

// 批量删除图片
export async function deleteImages(imageUrls: string[]): Promise<void> {
  await Promise.all(imageUrls.map(url => deleteImage(url)))
}