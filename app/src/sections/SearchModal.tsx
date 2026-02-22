import { useState } from 'react';
import { Search, MapPin, Calendar, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useLanguage } from '@/hooks/useLanguage';
import { format } from 'date-fns';
import { zhCN, enUS, th } from 'date-fns/locale';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (params: SearchParams) => void;
}

export interface SearchParams {
  location: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: { adults: number; children: number; infants: number };
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const { t, lang } = useLanguage();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [activeTab, setActiveTab] = useState<'where' | 'when' | 'who'>('where');
  const [showCalendar, setShowCalendar] = useState(false);

  const totalGuests = guests.adults + guests.children;

  const updateGuests = (type: keyof typeof guests, delta: number) => {
    setGuests(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
  };

  const getLocale = () => {
    switch (lang) {
      case 'zh': return zhCN;
      case 'th': return th;
      default: return enUS;
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date);
      setCheckOut(undefined);
    } else if (checkIn && !checkOut && date && date > checkIn) {
      setCheckOut(date);
      setShowCalendar(false);
    }
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ location, checkIn, checkOut, guests });
    }
    
    // F017: 导航到搜索结果页面
    if (location.trim()) {
      // 使用 hash router 导航
      const searchParams = new URLSearchParams();
      searchParams.set('keyword', location.trim());
      if (checkIn) searchParams.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
      if (checkOut) searchParams.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
      if (totalGuests > 0) searchParams.set('guests', totalGuests.toString());
      
      window.location.hash = `/search?${searchParams.toString()}`;
    }
    
    onClose();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return '添加日期';
    return format(date, 'MM月dd日', { locale: getLocale() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-center">{t.search.search}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Where */}
          <div className={`p-4 rounded-xl border-2 transition-all ${activeTab === 'where' ? 'border-champagne bg-champagne/5' : 'border-gray-200'}`}
            onClick={() => { setActiveTab('where'); setShowCalendar(false); }}>
            <label className="text-xs font-medium text-ink">{t.search.where}</label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin size={18} className="text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={lang === 'zh' ? '搜索目的地' : lang === 'th' ? 'ค้นหาจุดหมาย' : 'Search destinations'}
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* When */}
          <div className={`p-4 rounded-xl border-2 transition-all ${activeTab === 'when' ? 'border-champagne bg-champagne/5' : 'border-gray-200'}`}>
            <label className="text-xs font-medium text-ink">{t.search.when}</label>
            <div className="flex gap-4 mt-2">
              <div 
                className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-champagne transition-colors"
                onClick={() => { setActiveTab('when'); setShowCalendar(true); }}
              >
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t.search.checkin}</p>
                  <p className={`text-sm ${checkIn ? 'text-ink font-medium' : 'text-gray-400'}`}>{formatDate(checkIn)}</p>
                </div>
              </div>
              <div 
                className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:border-champagne transition-colors"
                onClick={() => { setActiveTab('when'); setShowCalendar(true); }}
              >
                <Calendar size={18} className="text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t.search.checkout}</p>
                  <p className={`text-sm ${checkOut ? 'text-ink font-medium' : 'text-gray-400'}`}>{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            {activeTab === 'when' && showCalendar && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-3">
                  {!checkIn ? '请选择入住日期' : !checkOut ? '请选择退房日期' : '日期已选择'}
                </p>
                <CalendarComponent
                  mode="single"
                  selected={checkOut || checkIn}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border bg-white"
                />
              </div>
            )}
          </div>

          {/* Who */}
          <div className={`p-4 rounded-xl border-2 transition-all ${activeTab === 'who' ? 'border-champagne bg-champagne/5' : 'border-gray-200'}`}
            onClick={() => { setActiveTab('who'); setShowCalendar(false); }}>
            <label className="text-xs font-medium text-ink">{t.search.who}</label>
            <div className="space-y-4 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lang === 'zh' ? '成人' : lang === 'th' ? 'ผู้ใหญ่' : 'Adults'}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '13岁及以上' : lang === 'th' ? '13 ปีขึ้นไป' : 'Ages 13+'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateGuests('adults', -1)} disabled={guests.adults <= 1}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:border-champagne hover:text-champagne transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-medium">{guests.adults}</span>
                  <button onClick={() => updateGuests('adults', 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-champagne hover:text-champagne transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lang === 'zh' ? '儿童' : lang === 'th' ? 'เด็ก' : 'Children'}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '2-12岁' : lang === 'th' ? '2-12 ปี' : 'Ages 2-12'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateGuests('children', -1)} disabled={guests.children <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:border-champagne hover:text-champagne transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-medium">{guests.children}</span>
                  <button onClick={() => updateGuests('children', 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-champagne hover:text-champagne transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{lang === 'zh' ? '婴幼儿' : lang === 'th' ? 'ทารก' : 'Infants'}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '2岁以下' : lang === 'th' ? 'ต่ำกว่า 2 ปี' : 'Under 2'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateGuests('infants', -1)} disabled={guests.infants <= 0}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 hover:border-champagne hover:text-champagne transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-medium">{guests.infants}</span>
                  <button onClick={() => updateGuests('infants', 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-champagne hover:text-champagne transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full bg-champagne hover:bg-champagne-dark text-white py-6 rounded-xl transition-colors"
          >
            <Search size={18} className="mr-2" />
            {lang === 'zh' ? '搜索' : lang === 'th' ? 'ค้นหา' : 'Search'} 
            {totalGuests > 0 && ` · ${totalGuests} ${lang === 'zh' ? '位客人' : lang === 'th' ? 'คน' : 'guests'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
