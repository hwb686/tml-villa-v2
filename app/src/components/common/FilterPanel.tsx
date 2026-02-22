import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/hooks/useLanguage';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface FilterParams {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string[];
}

interface FilterPanelProps {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  onReset: () => void;
}

// 设施列表
const AMENITY_OPTIONS = [
  { id: 'wifi', label: { zh: 'WiFi', en: 'WiFi', th: 'WiFi' } },
  { id: 'kitchen', label: { zh: '厨房', en: 'Kitchen', th: 'ครัว' } },
  { id: 'washer', label: { zh: '洗衣机', en: 'Washer', th: 'เครื่องซักผ้า' } },
  { id: 'dryer', label: { zh: '烘干机', en: 'Dryer', th: 'เครื่องอบผ้า' } },
  { id: 'aircon', label: { zh: '空调', en: 'Air conditioning', th: 'เครื่องปรับอากาศ' } },
  { id: 'heating', label: { zh: '暖气', en: 'Heating', th: 'เครื่องทำความร้อน' } },
  { id: 'pool', label: { zh: '游泳池', en: 'Pool', th: 'สระว่ายน้ำ' } },
  { id: 'hot_tub', label: { zh: '热水浴缸', en: 'Hot tub', th: 'อ่างน้ำร้อน' } },
  { id: 'parking', label: { zh: '免费停车', en: 'Free parking', th: 'ที่จอดรถฟรี' } },
  { id: 'gym', label: { zh: '健身房', en: 'Gym', th: 'ฟิตเนส' } },
  { id: 'tv', label: { zh: '电视', en: 'TV', th: 'โทรทัศน์' } },
  { id: 'elevator', label: { zh: '电梯', en: 'Elevator', th: 'ลิฟต์' } },
];

// 价格范围预设
const PRICE_RANGES = [
  { min: 0, max: 500, label: { zh: '¥500以下', en: 'Under ¥500', th: 'ต่ำกว่า ¥500' } },
  { min: 500, max: 1000, label: { zh: '¥500 - ¥1000', en: '¥500 - ¥1000', th: '¥500 - ¥1000' } },
  { min: 1000, max: 2000, label: { zh: '¥1000 - ¥2000', en: '¥1000 - ¥2000', th: '¥1000 - ¥2000' } },
  { min: 2000, max: 5000, label: { zh: '¥2000 - ¥5000', en: '¥2000 - ¥5000', th: '¥2000 - ¥5000' } },
  { min: 5000, max: Infinity, label: { zh: '¥5000以上', en: 'Over ¥5000', th: 'มากกว่า ¥5000' } },
];

// 卧室数量选项
const BEDROOM_OPTIONS = [
  { value: 1, label: { zh: '1间及以上', en: '1+ bedrooms', th: '1+ ห้องนอน' } },
  { value: 2, label: { zh: '2间及以上', en: '2+ bedrooms', th: '2+ ห้องนอน' } },
  { value: 3, label: { zh: '3间及以上', en: '3+ bedrooms', th: '3+ ห้องนอน' } },
  { value: 4, label: { zh: '4间及以上', en: '4+ bedrooms', th: '4+ ห้องนอน' } },
];

export default function FilterPanel({ filters, onFiltersChange, onReset }: FilterPanelProps) {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  // 计算激活的筛选数量
  const activeFilterCount = [
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.bedrooms !== undefined,
    filters.amenities && filters.amenities.length > 0,
  ].filter(Boolean).length;

  const handlePriceRangeSelect = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max === Infinity ? undefined : max,
    });
  };

  const handleBedroomSelect = (value: number | undefined) => {
    onFiltersChange({
      ...filters,
      bedrooms: filters.bedrooms === value ? undefined : value,
    });
  };

  const handleAmenityToggle = (amenityId: string) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter(a => a !== amenityId)
      : [...currentAmenities, amenityId];
    
    onFiltersChange({
      ...filters,
      amenities: newAmenities.length > 0 ? newAmenities : undefined,
    });
  };

  const handleClearFilters = () => {
    onReset();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`gap-2 ${activeFilterCount > 0 ? 'border-champagne bg-champagne/10' : ''}`}
        >
          <SlidersHorizontal size={16} />
          {lang === 'zh' ? '筛选' : lang === 'th' ? 'กรอง' : 'Filters'}
          {activeFilterCount > 0 && (
            <span className="bg-champagne text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium">
            {lang === 'zh' ? '筛选条件' : lang === 'th' ? 'เงื่อนไขการกรอง' : 'Filters'}
          </h3>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              {lang === 'zh' ? '清除全部' : lang === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}
            </Button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* 价格范围 */}
          <Collapsible defaultOpen className="border-b">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
              <span className="font-medium">
                {lang === 'zh' ? '价格范围' : lang === 'th' ? 'ช่วงราคา' : 'Price range'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {PRICE_RANGES.map((range) => (
                  <button
                    key={`${range.min}-${range.max}`}
                    onClick={() => handlePriceRangeSelect(range.min, range.max)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.minPrice === range.min && 
                      (filters.maxPrice === range.max || (range.max === Infinity && !filters.maxPrice))
                        ? 'bg-champagne/20 text-champagne-dark font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {range.label[lang as keyof typeof range.label] || range.label.en}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 卧室数量 */}
          <Collapsible className="border-b">
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
              <span className="font-medium">
                {lang === 'zh' ? '卧室数量' : lang === 'th' ? 'จำนวนห้องนอน' : 'Bedrooms'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-2">
                {BEDROOM_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBedroomSelect(option.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      filters.bedrooms === option.value
                        ? 'bg-champagne/20 text-champagne-dark font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {option.label[lang as keyof typeof option.label] || option.label.en}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 设施 */}
          <Collapsible>
            <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50">
              <span className="font-medium">
                {lang === 'zh' ? '设施' : lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities'}
              </span>
              <ChevronDown size={16} className="text-gray-400" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((amenity) => {
                    const isSelected = filters.amenities?.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        onClick={() => handleAmenityToggle(amenity.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          isSelected
                            ? 'bg-champagne text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {amenity.label[lang as keyof typeof amenity.label] || amenity.label.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setIsOpen(false)}
          >
            {lang === 'zh' ? '取消' : lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button 
            className="flex-1 bg-champagne hover:bg-champagne-dark"
            onClick={() => setIsOpen(false)}
          >
            {lang === 'zh' ? '应用' : lang === 'th' ? 'ใช้' : 'Apply'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
