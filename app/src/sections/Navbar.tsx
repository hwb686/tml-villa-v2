import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, Menu, User, Search, Heart, Package, LogOut, LogIn } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { getHashLink } from '@/lib/router';
import { userApi } from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavbarProps {
  onSearchClick: () => void;
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const { t, lang, setLang } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // 检查用户登录状态
    const token = localStorage.getItem('userToken');
    if (token) {
      userApi.getMe()
        .then(res => {
          setUser({
            id: res.data.id,
            username: res.data.username,
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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
      <div className="container-luxury">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href={getHashLink('/')} className="flex items-center gap-2">
            <img src="/images/logo.png" alt="TML Villa" className="h-8 w-auto" />
            <span className="font-serif text-xl font-medium text-champagne hidden sm:block">TML Villa</span>
          </a>

          {/* Center Nav - Desktop */}
          <div className="hidden md:flex items-center gap-8">
            <a href={getHashLink('/')} className="text-sm font-medium text-ink hover:text-champagne transition-colors">{t.nav.homestay}</a>
            <a href={getHashLink('/car-rental')} className="text-sm font-medium text-gray-500 hover:text-champagne transition-colors">{t.nav.carRental}</a>
            <a href={getHashLink('/meal-order')} className="text-sm font-medium text-gray-500 hover:text-champagne transition-colors">{t.nav.dining}</a>
            <a href={getHashLink('/ticket-booking')} className="text-sm font-medium text-gray-500 hover:text-champagne transition-colors">票务预订</a>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
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

            {/* User Menu */}
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
                        个人中心
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/user')} className="w-full flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        我的订单
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/user')} className="w-full flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        我的收藏
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="h-4 w-4 mr-2" />
                      退出登录
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <a href={getHashLink('/login')} className="w-full flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        登录 / 注册
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <a href={getHashLink('/meal-order')} className="w-full">订餐登记</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/car-rental')} className="w-full">租车登记</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href={getHashLink('/ticket-booking')} className="w-full">票务预订</a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>帮助中心</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar - Airbnb Style */}
        <div className="pb-4">
          <div onClick={onSearchClick} className="search-bar max-w-4xl mx-auto cursor-pointer">
            <div className="flex-1 px-6 py-3 border-r border-gray-200">
              <p className="text-xs font-medium text-ink">{t.search.where}</p>
              <p className="text-sm text-gray-500">搜索目的地</p>
            </div>
            <div className="hidden sm:block px-6 py-3 border-r border-gray-200">
              <p className="text-xs font-medium text-ink">{t.search.checkin}</p>
              <p className="text-sm text-gray-500">添加日期</p>
            </div>
            <div className="hidden sm:block px-6 py-3 border-r border-gray-200">
              <p className="text-xs font-medium text-ink">{t.search.checkout}</p>
              <p className="text-sm text-gray-500">添加日期</p>
            </div>
            <div className="flex-1 px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-ink">{t.search.who}</p>
                <p className="text-sm text-gray-500">{t.search.addGuests}</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-champagne flex items-center justify-center hover:bg-champagne-dark transition-colors">
                <Search size={18} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
