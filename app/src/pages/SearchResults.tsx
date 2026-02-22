import { useState, useEffect, useMemo } from 'react';
import { Search, X, Loader2, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import { homestayApi, type Homestay } from '@/services/api';
import FilterPanel, { type FilterParams } from '@/components/common/FilterPanel';
import SortSelector, { type SortOption } from '@/components/common/SortSelector';
import HighlightedText from '@/components/common/HighlightedText';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';
import { useHashRouter } from '@/lib/router';

export default function SearchResults() {
  const { lang } = useLanguage();
  const { query } = useHashRouter();
  
  // 从URL参数获取初始值
  const initialKeyword = query?.keyword || '';
  const initialCategory = query?.category || '';
  
  // 状态
  const [keyword, setKeyword] = useState(initialKeyword);
  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterParams>({});
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 搜索房源
  const searchHomestays = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: Record<string, string | number | undefined> = {};
      
      if (keyword) params.keyword = keyword;
      if (initialCategory) params.category = initialCategory;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.bedrooms) params.bedrooms = filters.bedrooms;
      if (filters.amenities && filters.amenities.length > 0) {
        params.amenities = filters.amenities.join(',');
      }
      if (sortBy !== 'default') params.sortBy = sortBy;
      
      const response = await homestayApi.getAll(params);
      setHomestays(response.data);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || '搜索失败');
      setHomestays([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始搜索和参数变化时搜索
  useEffect(() => {
    searchHomestays();
  }, [keyword, filters, sortBy, initialCategory]);

  // 处理搜索
  const handleSearch = () => {
    setKeyword(searchInput);
  };

  // 处理筛选变化
  const handleFiltersChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({});
  };

  // 获取筛选后的描述
  const getFilterDescription = () => {
    const parts: string[] = [];
    if (filters.minPrice || filters.maxPrice) {
      if (filters.minPrice && filters.maxPrice) {
        parts.push(`¥${filters.minPrice} - ¥${filters.maxPrice}`);
      } else if (filters.minPrice) {
        parts.push(`¥${filters.minPrice}+`);
      } else {
        parts.push(`¥${filters.maxPrice}以下`);
      }
    }
    if (filters.bedrooms) {
      parts.push(`${filters.bedrooms}+间卧室`);
    }
    if (filters.amenities && filters.amenities.length > 0) {
      parts.push(`${filters.amenities.length}项设施`);
    }
    return parts.join(' · ');
  };

  return (
    <>
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      
      <main className="pt-24 min-h-screen">
        <div className="container-luxury">
          {/* 搜索栏 */}
          <div className="sticky top-20 z-30 bg-white py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={lang === 'zh' ? '搜索目的地、房源名称...' : lang === 'th' ? 'ค้นหาจุดหมาย, ชื่อที่พัก...' : 'Search destinations, properties...'}
                  className="pl-10 pr-10"
                />
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setKeyword('');
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <FilterPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
              <SortSelector value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* 搜索结果头部 */}
          <div className="py-6">
            {keyword ? (
              <div>
                <h1 className="text-2xl font-semibold text-ink">
                  {lang === 'zh' ? `"${keyword}" 的搜索结果` : lang === 'th' ? `ผลการค้นหา "${keyword}"` : `Search results for "${keyword}"`}
                </h1>
                <p className="text-gray-500 mt-1">
                  {isLoading 
                    ? (lang === 'zh' ? '搜索中...' : lang === 'th' ? 'กำลังค้นหา...' : 'Searching...')
                    : `${homestays.length} ${lang === 'zh' ? '个结果' : lang === 'th' ? 'ผลลัพธ์' : 'results'}`
                  }
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-semibold text-ink">
                  {lang === 'zh' ? '全部房源' : lang === 'th' ? 'ที่พักทั้งหมด' : 'All Properties'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {!isLoading && `${homestays.length} ${lang === 'zh' ? '个房源' : lang === 'th' ? 'ที่พัก' : 'properties'}`}
                </p>
              </div>
            )}
            
            {/* 筛选标签显示 */}
            {getFilterDescription() && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <SlidersHorizontal size={14} />
                <span>{getFilterDescription()}</span>
                <button 
                  onClick={handleResetFilters}
                  className="text-champagne hover:text-champagne-dark"
                >
                  {lang === 'zh' ? '清除' : lang === 'th' ? 'ล้าง' : 'Clear'}
                </button>
              </div>
            )}
          </div>

          {/* 结果列表 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-champagne" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <p className="text-gray-600 mb-2">{error}</p>
              <Button onClick={searchHomestays} variant="outline" className="mt-4">
                {lang === 'zh' ? '重试' : lang === 'th' ? 'ลองอีกครั้ง' : 'Retry'}
              </Button>
            </div>
          ) : homestays.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {lang === 'zh' ? '未找到相关房源' : lang === 'th' ? 'ไม่พบที่พักที่เกี่ยวข้อง' : 'No properties found'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {lang === 'zh' ? '尝试调整搜索条件或筛选' : lang === 'th' ? 'ลองปรับเงื่อนไขการค้นหาหรือตัวกรอง' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {homestays.map((homestay) => (
                <HomestayCard 
                  key={homestay.id} 
                  homestay={homestay} 
                  keyword={keyword}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}

// 民宿卡片组件（带高亮）
function HomestayCard({ homestay, keyword }: { homestay: Homestay; keyword: string }) {
  const { lang } = useLanguage();
  
  // 使用高亮字段（如果存在）
  const title = (homestay as any).highlightedTitle || homestay.title;
  const location = (homestay as any).highlightedLocation || homestay.location;
  
  const handleClick = () => {
    window.location.hash = `/homestay/${homestay.id}`;
  };
  
  return (
    <div 
      onClick={handleClick}
      className="group cursor-pointer"
    >
      <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
        {/* 图片 */}
        <div className="aspect-[4/3] relative overflow-hidden">
          {homestay.images && homestay.images.length > 0 ? (
            <img
              src={homestay.images[0]}
              alt={homestay.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          
          {/* 评分 */}
          {homestay.rating && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              {homestay.rating.toFixed(1)}
            </div>
          )}
        </div>
        
        {/* 内容 */}
        <div className="p-4">
          <h3 className="font-medium text-ink mb-1 line-clamp-1">
            <HighlightedText text={title} />
          </h3>
          
          <p className="text-gray-500 text-sm mb-2 line-clamp-1">
            <HighlightedText text={location} />
          </p>
          
          <div className="flex items-center justify-between">
            <p className="text-champagne-dark font-semibold">
              ¥{homestay.price}
              <span className="text-gray-400 font-normal text-sm">
                {lang === 'zh' ? '/晚' : lang === 'th' ? '/คืน' : '/night'}
              </span>
            </p>
            
            <div className="text-gray-400 text-xs flex items-center gap-1">
              <span>{homestay.bedrooms} {lang === 'zh' ? '室' : 'bd'}</span>
              <span>·</span>
              <span>{homestay.beds} {lang === 'zh' ? '床' : 'bed'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
