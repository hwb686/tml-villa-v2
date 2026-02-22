import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  detectLanguage, 
  getTranslations, 
  getNestedTranslation,
  type Language 
} from '../lib/i18n'

describe('i18n', () => {
  describe('detectLanguage', () => {
    beforeEach(() => {
      vi.stubGlobal('navigator', { language: 'en-US' })
    })

    it('should return "en" for English browser', () => {
      vi.stubGlobal('navigator', { language: 'en-US' })
      expect(detectLanguage()).toBe('en')
    })

    it('should return "zh" for Chinese browser', () => {
      vi.stubGlobal('navigator', { language: 'zh-CN' })
      expect(detectLanguage()).toBe('zh')
    })

    it('should return "th" for Thai browser', () => {
      vi.stubGlobal('navigator', { language: 'th-TH' })
      expect(detectLanguage()).toBe('th')
    })

    it('should fallback to "en" for unsupported language', () => {
      vi.stubGlobal('navigator', { language: 'ja-JP' })
      expect(detectLanguage()).toBe('en')
    })

    it('should return "en" when navigator is undefined', () => {
      vi.stubGlobal('navigator', undefined)
      expect(detectLanguage()).toBe('en')
    })
  })

  describe('getTranslations', () => {
    it('should return Thai translations for "th"', () => {
      const t = getTranslations('th')
      expect(t.nav.homestay).toBe('ที่พัก')
      expect(t.nav.carRental).toBe('เช่ารถ')
    })

    it('should return English translations for "en"', () => {
      const t = getTranslations('en')
      expect(t.nav.homestay).toBe('Homestay')
      expect(t.nav.carRental).toBe('Car Rental')
    })

    it('should return Chinese translations for "zh"', () => {
      const t = getTranslations('zh')
      expect(t.nav.homestay).toBe('民宿')
      expect(t.nav.carRental).toBe('租车')
    })

    it('should fallback to English for invalid language', () => {
      const t = getTranslations('invalid' as Language)
      expect(t.nav.homestay).toBe('Homestay')
    })
  })

  describe('getNestedTranslation', () => {
    it('should get nested translation value', () => {
      const obj = { nav: { homestay: '民宿' } }
      expect(getNestedTranslation(obj, 'nav.homestay')).toBe('民宿')
    })

    it('should return path if translation not found', () => {
      const obj = { nav: { homestay: '民宿' } }
      expect(getNestedTranslation(obj, 'nav.notexist')).toBe('nav.notexist')
    })

    it('should return path for deeply nested missing key', () => {
      const obj = { nav: {} }
      expect(getNestedTranslation(obj, 'nav.homestay.name')).toBe('nav.homestay.name')
    })

    it('should handle empty object', () => {
      expect(getNestedTranslation({}, 'nav.homestay')).toBe('nav.homestay')
    })
  })
})
