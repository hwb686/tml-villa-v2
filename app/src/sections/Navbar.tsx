import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe, Menu, User, Search } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getHashLink } from '@/lib/router';

interface NavbarProps {
  onSearchClick: () => void;
}

export default function Navbar({ onSearchClick }: NavbarProps) {
  const { t, lang, setLang } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
                  <Menu size={18} className="text-gray-600" />
                  <div className="w-8 h-8 rounded-full bg-champagne/20 flex items-center justify-center">
                    <User size={16} className="text-champagne" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
