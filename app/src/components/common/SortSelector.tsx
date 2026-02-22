import { useState } from 'react';
import { ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating';

interface SortSelectorProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: { zh: string; en: string; th: string }; icon: React.ReactNode }[] = [
  { 
    value: 'default', 
    label: { zh: '推荐排序', en: 'Recommended', th: 'แนะนำ' },
    icon: <ArrowUpDown size={14} />
  },
  { 
    value: 'price_asc', 
    label: { zh: '价格：从低到高', en: 'Price: Low to High', th: 'ราคา: ต่ำไปสูง' },
    icon: <ArrowUp size={14} />
  },
  { 
    value: 'price_desc', 
    label: { zh: '价格：从高到低', en: 'Price: High to Low', th: 'ราคา: สูงไปต่ำ' },
    icon: <ArrowDown size={14} />
  },
  { 
    value: 'rating', 
    label: { zh: '评分最高', en: 'Highest Rating', th: 'คะแนนสูงสุด' },
    icon: <span className="text-sm">⭐</span>
  },
];

export default function SortSelector({ value, onChange }: SortSelectorProps) {
  const { lang } = useLanguage();
  
  const currentOption = SORT_OPTIONS.find(opt => opt.value === value) || SORT_OPTIONS[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[140px]">
          {currentOption.icon}
          <span className="truncate">
            {currentOption.label[lang as keyof typeof currentOption.label] || currentOption.label.en}
          </span>
          <ChevronDown size={14} className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {SORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 ${
              value === option.value ? 'bg-champagne/10 text-champagne-dark' : ''
            }`}
          >
            {option.icon}
            {option.label[lang as keyof typeof option.label] || option.label.en}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
