import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, Menu, User, Search, Heart, Package, LogOut, LogIn, Home, Car, UtensilsCrossed, Ticket } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { getHashLink } from '@/lib/router';
import { userApi } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from '@/components/notification/NotificationBell';
import { format } from 'date-fns';
import { zhCN, enUS, th } from 'date-fns/locale';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export default function Navbar() {
  const { t, lang, setLang } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      userApi.getMe()
        .then(res => {
        setUser({
          id: res.data.id,
          username: res.data.username || res.data.name || '',
          email: res.data.email,
          avatar: res.data.avatar || undefined,
        });
        })
        .catch(() => {
          localStorage.removeItem('userToken');
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    setUser(null);
    window.location.hash = '/';
  };

  const getLocale = () => {
    switch (lang) {
      case 'zh': return zhCN;
      case 'th': return th;
      default: return enUS;
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return lang === 'zh' ? '选择日期' : lang === 'th' ? 'เลือกวันที่' : 'Select date';
    return format(date, 'MM月dd日', { locale: getLocale() });
  };

  const handleCheckInSelect = (date: Date | undefined) => {
    setCheckIn(date);
    setCheckInOpen(false);
    if (date && !checkOut) {
      setTimeout(() => setCheckOutOpen(true), 100);
    }
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    if (checkIn && date && date > checkIn) {
      setCheckOut(date);
      setCheckOutOpen(false);
    } else if (checkIn && date && date <= checkIn) {
      return;
    } else {
      setCheckOut(date);
      setCheckOutOpen(false);
    }
  };

  const handleSearch = () => {
    if (!checkIn || !checkOut) {
      // Open the appropriate popover if dates not selected
      if (!checkIn) {
        setCheckInOpen(true);
      } else if (!checkOut) {
        setCheckOutOpen(true);
      }
      return;
    }

    const searchParams = new URLSearchParams();
    searchParams.set('checkIn', format(checkIn, 'yyyy-MM-dd'));
    searchParams.set('checkOut', format(checkOut, 'yyyy-MM-dd'));
    
    window.location.hash = `/search?${searchParams.toString()}`;
  };

  const canSearch = checkIn && checkOut;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      <div className="container-luxury">
        <div className="flex items-center justify-between h-20">
          <a href={getHashLink('/')} className="flex items-center gap-2">
            <img src="/images/logo.png" alt="TML Villa" className="h-8 w-auto" />
            <span className="font-serif text-xl font-medium text-champagne hidden sm:block">TML Villa</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a href={getHashLink('/')} className="flex flex-col items-center gap-1 text-sm font-medium text-ink hover:text-champagne transition-colors group">
              <Home size={20} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100 transition-opacity rounded-sm" />
              {t.nav.homestay}
            </a>
            <a href={getHashLink('/car-rental')} className="flex flex-col items-center gap-1 text-sm font-medium text-gray-500 hover:text-champagne transition-colors group">
              <Car size={20} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100 transition-opacity rounded-sm" />
              {t.nav.carRental}
            </a>
            <a href={getHashLink('/meal-order')} className="flex flex-col items-center gap-1 text-sm font-medium text-gray-500 hover:text-champagne transition-colors group">
              <UtensilsCrossed size={20} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100 transition-opacity rounded-sm" />
              {t.nav.dining}
            </a>
            <a href={getHashLink('/ticket-booking')} className="flex flex-col items-center gap-1 text-sm font-medium text-gray-500 hover:text-champagne transition-colors group">
              <Ticket size={20} strokeWidth={2.5} className="opacity-70 group-hover:opacity-100 transition-opacity rounded-sm" />
              {lang === 'zh' ? '票务' : t.nav.ticketBooking}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Globe size={18} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">{lang.toUpperCase()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(['th', 'en', 'zh'] as const).map((l) => (
                  <DropdownMenuItem key={l} onClick={() => setLang(l)} className={lang === l ? 'bg-champagne/10 text-champagne' : ''}>
                    {l === 'th' ? 'ไทย' : l === 'en' ? 'English' : '中文'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <NotificationBell
              onNotificationClick={(notification) => {
                if (notification.data?.orderId) {
                  window.location.hash = `/user?tab=orders`;
                }
              }}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-gray-200 hover:shadow-md transition-all">
                  <Menu size={18} className="text-gray-600 sm:hidden" />
                  {user ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-champagne text-white text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-champagne/20 flex items-center justify-center">
                      <User size={16} className="text-champagne" />
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <div className="px-2 py-3 border-b">
                      <p className="font-medium">{user.username}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem>
                      <a href={getHashLink('/user')} className="w-full flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.userMenu.personalCenter}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/user')} className="w-full flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t.userMenu.myOrders}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/user')} className="w-full flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {t.userMenu.myFavorites}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="h-4 w-4 mr-2" />
                      {t.userMenu.logout}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <a href={getHashLink('/login')} className="w-full flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        {t.userMenu.loginRegister}
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <a href={getHashLink('/meal-order')} className="w-full">{t.userMenu.mealRegistration}</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/car-rental')} className="w-full">{t.userMenu.carRegistration}</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/ticket-booking')} className="w-full">{t.userMenu.ticketBooking}</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>{t.userMenu.helpCenter}</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="pb-4 px-4 sm:px-6 lg:px-8">
          <div className="search-bar max-w-2xl mx-auto flex items-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
              <PopoverTrigger asChild>
                <div className="flex-1 px-4 sm:px-6 py-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 rounded-l-full transition-colors min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{t.search.checkin}</p>
                  <p className={`text-sm truncate ${checkIn ? 'text-ink font-medium' : 'text-gray-400'}`}>
                    {formatDate(checkIn)}
                  </p>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-3" 
                align="start"
                sideOffset={4}
              >
                <p className="text-sm text-gray-600 mb-2 font-medium text-center">
                  {lang === 'zh' ? '请选择入住日期' : lang === 'th' ? 'กรุณาเลือกวันที่เช็คอิน' : 'Please select check-in date'}
                </p>
                <CalendarComponent
                  mode="single"
                  selected={checkIn}
                  onSelect={handleCheckInSelect}
                  disabled={(date) => date < new Date()}
                  className="[&_td]:w-10 [&_td]:h-10 [&_button]:w-10 [&_button]:h-10 [&_.rdp-caption]:text-base [&_.rdp-head_th]:w-10"
                />
              </PopoverContent>
            </Popover>

            <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
              <PopoverTrigger asChild>
                <div className="flex-1 px-4 sm:px-6 py-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{t.search.checkout}</p>
                  <p className={`text-sm truncate ${checkOut ? 'text-ink font-medium' : 'text-gray-400'}`}>
                    {formatDate(checkOut)}
                  </p>
                </div>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-3" 
                align="center"
                sideOffset={4}
              >
                <p className="text-sm text-gray-600 mb-2 font-medium text-center">
                  {!checkIn 
                    ? (lang === 'zh' ? '请先选择入住日期' : lang === 'th' ? 'กรุณาเลือกวันที่เช็คอินก่อน' : 'Please select check-in date first')
                    : (lang === 'zh' ? '请选择退房日期' : lang === 'th' ? 'กรุณาเลือกวันที่เช็คเอาท์' : 'Please select check-out date')
                  }
                </p>
                <CalendarComponent
                  mode="single"
                  selected={checkOut}
                  onSelect={handleCheckOutSelect}
                  disabled={(date) => {
                    if (date < new Date()) return true;
                    if (checkIn && date <= checkIn) return true;
                    return false;
                  }}
                  className="[&_td]:w-10 [&_td]:h-10 [&_button]:w-10 [&_button]:h-10 [&_.rdp-caption]:text-base [&_.rdp-head_th]:w-10"
                />
              </PopoverContent>
            </Popover>

            <div className="px-2 sm:px-4 py-3 flex-shrink-0">
              <button 
                onClick={handleSearch}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                  canSearch 
                    ? 'bg-champagne hover:bg-champagne-dark text-white' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={canSearch 
                  ? (lang === 'zh' ? '搜索' : lang === 'th' ? 'ค้นหา' : 'Search')
                  : (lang === 'zh' ? '请选择入住和退房日期' : lang === 'th' ? 'กรุณาเลือกวันที่' : 'Please select dates')
                }
              >
                <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
