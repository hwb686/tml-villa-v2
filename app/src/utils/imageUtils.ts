/**
 * 图片处理工具函数
 * 提供图片压缩、尺寸调整等功能
 */

export interface ImageCompressOptions {
  maxWidth?: number;      // 最大宽度
  maxHeight?: number;     // 最大高度
  quality?: number;       // JPEG质量 (0-1)
  maxSizeMB?: number;     // 最大文件大小(MB)
}

const DEFAULT_OPTIONS: ImageCompressOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  maxSizeMB: 5,  // 默认最大5MB
};

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的 base64 图片
 */
export async function compressImage(
  file: File,
  options: ImageCompressOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 计算缩放后的尺寸（保持比例）
        let { width, height } = calculateAspectRatioFit(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );

        // 创建 canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'));
          return;
        }

        // 使用更好的图片质量
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 base64
        let quality = opts.quality!;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // 如果仍然超过大小限制，进一步压缩
        const maxSizeBytes = opts.maxSizeMB! * 1024 * 1024;
        let attempts = 0;
        while (getBase64Size(base64) > maxSizeBytes && attempts < 5) {
          quality *= 0.8;
          base64 = canvas.toDataURL('image/jpeg', quality);
          attempts++;
        }

        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

/**
 * 计算保持比例的缩放尺寸
 */
function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  };
}

/**
 * 获取 base64 字符串的大小（字节）
 */
function getBase64Size(base64: string): number {
  // 移除 data:image/xxx;base64, 前缀
  const base64String = base64.split(',')[1] || base64;
  // base64 编码的文件大小约为原文件的 4/3
  return Math.round((base64String.length * 3) / 4);
}

/**
 * 格式化文件大小显示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证图片文件
 */
export function validateImageFile(
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
): { valid: boolean; error?: string } {
  const { maxSizeMB = 10, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;
  
  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `不支持的文件格式，请上传 ${allowedTypes.map(t => t.replace('image/', '')).join('、')} 格式的图片`,
    };
  }
  
  // 检查文件大小（原始大小，压缩前可以更大一些）
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `原始图片大小不能超过 ${maxSizeMB}MB，当前大小: ${formatFileSize(file.size)}`,
    };
  }
  
  return { valid: true };
}

/**
 * 批量压缩图片
 */
export async function compressImages(
  files: FileList | null,
  options?: ImageCompressOptions
): Promise<string[]> {
  if (!files || files.length === 0) return [];
  
  const promises: Promise<string>[] = [];
  for (let i = 0; i < files.length; i++) {
    promises.push(compressImage(files[i], options));
  }
  
  return Promise.all(promises);
}
