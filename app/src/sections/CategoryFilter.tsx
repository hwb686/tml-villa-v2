import { useState, useEffect } from 'react';
import { Home, Waves, Building, Castle, Crown, Trees, Sun, Wheat, Tent, Mountain, Palmtree, Coffee } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { categoryApi, type Category } from '@/services/api';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

// Default icons mapping
const iconMap: { [key: string]: React.ElementType } = {
  home: Home,
  waves: Waves,
  building: Building,
  castle: Castle,
  crown: Crown,
  trees: Trees,
  sun: Sun,
  wheat: Wheat,
  tent: Tent,
  mountain: Mountain,
  palmtree: Palmtree,
  coffee: Coffee,
};

// Fallback categories if API fails
const fallbackCategories: Category[] = [
  { id: 'all', label: { zh: '全部', en: 'All', th: 'ทั้งหมด' }, icon: 'home', sortOrder: 1, isActive: true },
  { id: 'beach', label: { zh: '海景', en: 'Beach', th: 'ชายหาด' }, icon: 'waves', sortOrder: 2, isActive: true },
  { id: 'city', label: { zh: '城市', en: 'City', th: 'เมือง' }, icon: 'building', sortOrder: 3, isActive: true },
  { id: 'villa', label: { zh: '别墅', en: 'Villa', th: 'วิลล่า' }, icon: 'castle', sortOrder: 4, isActive: true },
  { id: 'luxury', label: { zh: '豪华', en: 'Luxury', th: 'หรูหรา' }, icon: 'crown', sortOrder: 5, isActive: true },
  { id: 'cabin', label: { zh: '木屋', en: 'Cabin', th: 'กระท่อม' }, icon: 'trees', sortOrder: 6, isActive: true },
  { id: 'tropical', label: { zh: '热带', en: 'Tropical', th: 'เขตร้อน' }, icon: 'sun', sortOrder: 7, isActive: true },
  { id: 'farm', label: { zh: '农场', en: 'Farm', th: 'ฟาร์ม' }, icon: 'wheat', sortOrder: 8, isActive: true },
];

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await categoryApi.getAll();
        setCategories(response.data);
      } catch (err) {
        console.log('API not available, using fallback categories');
        setCategories(fallbackCategories);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const getLabel = (category: Category) => {
    return category.label[lang] || category.label.en;
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Home;
  };

  if (isLoading) {
    return (
      <div className="sticky top-20 z-40 bg-white border-b border-gray-200">
        <div className="container-luxury py-4">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[60px]">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-20 z-40 bg-white border-b border-gray-200">
      <div className="container-luxury py-4">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((category) => {
            const Icon = getIcon(category.icon);
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`category-pill whitespace-nowrap ${isActive ? 'active' : 'text-gray-500'}`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-xs font-medium">{getLabel(category)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
