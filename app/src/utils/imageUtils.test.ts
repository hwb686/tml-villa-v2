import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  formatFileSize, 
  validateImageFile,
  type ImageCompressOptions 
} from '../utils/imageUtils'

describe('imageUtils', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })
  })

  describe('validateImageFile', () => {
    const createMockFile = (type: string, size: number): File => {
      return new File(['x'.repeat(size)], 'test.jpg', { type })
    }

    it('should validate JPEG files', () => {
      const file = createMockFile('image/jpeg', 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should validate PNG files', () => {
      const file = createMockFile('image/png', 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should validate WebP files', () => {
      const file = createMockFile('image/webp', 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should validate GIF files', () => {
      const file = createMockFile('image/gif', 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject unsupported file types', () => {
      const file = createMockFile('image/bmp', 1000)
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('不支持的文件格式')
    })

    it('should reject files exceeding size limit', () => {
      const file = createMockFile('image/jpeg', 11 * 1024 * 1024) // 11MB
      const result = validateImageFile(file, { maxSizeMB: 10 })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('原始图片大小不能超过')
    })

    it('should accept files within size limit', () => {
      const file = createMockFile('image/jpeg', 5 * 1024 * 1024) // 5MB
      const result = validateImageFile(file, { maxSizeMB: 10 })
      expect(result.valid).toBe(true)
    })

    it('should support custom allowed types', () => {
      const file = createMockFile('image/bmp', 1000)
      const result = validateImageFile(file, { 
        allowedTypes: ['image/bmp'] 
      })
      expect(result.valid).toBe(true)
    })
  })
})
