import { useState } from 'react';
import { Search, Calendar } from 'lucide-react';
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
  checkIn: Date | undefined;
  checkOut: Date | undefined;
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const { t, lang } = useLanguage();
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

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
    // BUG-017: 必须选择入住和退房日期才能搜索
    if (!checkIn || !checkOut) {
      setShowCalendar(true);
      return;
    }

    if (onSearch) {
      onSearch({ checkIn, checkOut });
    }
    
    // BUG-017: 导航到搜索结果页面，只传递日期参数
    const searchParams = new URLSearchParams();
    searchParams.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    searchParams.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    
    window.location.hash = `/search?${searchParams.toString()}`;
    
    onClose();
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return lang === 'zh' ? '选择日期' : lang === 'th' ? 'เลือกวันที่' : 'Select date';
    return format(date, 'MM月dd日', { locale: getLocale() });
  };

  // 判断搜索按钮是否可用
  const canSearch = checkIn && checkOut;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-center">{t.search.search}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Date Selection - When */}
          <div className="p-4 rounded-xl border-2 border-champagne bg-champagne/5">
            <label className="text-xs font-medium text-ink">{t.search.when}</label>
            <div className="flex gap-4 mt-2">
              <div 
                className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-champagne cursor-pointer hover:bg-white transition-colors bg-white"
                onClick={() => setShowCalendar(true)}
              >
                <Calendar size={18} className="text-champagne" />
                <div>
                  <p className="text-xs text-gray-500">{t.search.checkin}</p>
                  <p className={`text-sm ${checkIn ? 'text-ink font-medium' : 'text-gray-400'}`}>{formatDate(checkIn)}</p>
                </div>
              </div>
              <div 
                className="flex-1 flex items-center gap-2 p-3 rounded-lg border border-champagne cursor-pointer hover:bg-white transition-colors bg-white"
                onClick={() => setShowCalendar(true)}
              >
                <Calendar size={18} className="text-champagne" />
                <div>
                  <p className="text-xs text-gray-500">{t.search.checkout}</p>
                  <p className={`text-sm ${checkOut ? 'text-ink font-medium' : 'text-gray-400'}`}>{formatDate(checkOut)}</p>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            {showCalendar && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-champagne/30">
                <p className="text-sm text-gray-600 mb-3">
                  {!checkIn 
                    ? (lang === 'zh' ? '请选择入住日期' : lang === 'th' ? 'กรุณาเลือกวันที่เช็คอิน' : 'Please select check-in date')
                    : !checkOut 
                      ? (lang === 'zh' ? '请选择退房日期' : lang === 'th' ? 'กรุณาเลือกวันที่เช็คเอาท์' : 'Please select check-out date')
                      : (lang === 'zh' ? '日期已选择，点击搜索' : lang === 'th' ? 'เลือกวันที่แล้ว กดค้นหา' : 'Dates selected, click search')
                  }
                </p>
                <CalendarComponent
                  mode="single"
                  selected={checkOut || checkIn}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border bg-white mx-auto"
                />
              </div>
            )}
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={!canSearch}
            className="w-full bg-champagne hover:bg-champagne-dark text-white py-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search size={18} className="mr-2" />
            {lang === 'zh' 
              ? (canSearch ? '搜索可用房源' : '请选择入住和退房日期') 
              : lang === 'th' 
                ? (canSearch ? 'ค้นหาที่พักว่าง' : 'กรุณาเลือกวันที่เช็คอินและเช็คเอาท์')
                : (canSearch ? 'Search available stays' : 'Please select check-in and check-out dates')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
