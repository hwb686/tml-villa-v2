import { useState, useEffect, useMemo } from 'react';
import { LanguageProvider } from '@/hooks/useLanguage';
import Navbar from '@/sections/Navbar';
import CategoryFilter from '@/sections/CategoryFilter';
import HomestayGrid from '@/sections/HomestayGrid';
import SearchModal from '@/sections/SearchModal';
import Footer from '@/sections/Footer';
import TestPage from '@/pages/TestPage';
import HomestayDetail from '@/pages/HomestayDetail';
import MealOrderPage from '@/pages/MealOrder';
import CarRentalPage from '@/pages/CarRental';
import TicketBookingPage from '@/pages/TicketBooking';
import UserCenter from '@/pages/UserCenter';
import LoginPage from '@/pages/LoginPage';
import SearchResults from '@/pages/SearchResults';
import AdminApp from '@/AdminApp';
import { homestayApi, type Homestay } from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { useHashRouter } from '@/lib/router';
import { Button } from '@/components/ui/button';

// API base URL - should be configured in environment
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await homestayApi.getAll({ category: selectedCategory === 'all' ? undefined : selectedCategory });
        setHomestays(response.data);
      } catch (err: any) {
        console.error('Failed to fetch homestays:', err);
        setError(err.message || '加载失败');
        setHomestays([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomestays();
  }, [selectedCategory]);

  const filteredHomestays = useMemo(() => {
    if (selectedCategory === 'all') return homestays;
    return homestays.filter((h) => h.type === selectedCategory);
  }, [homestays, selectedCategory]);

  if (error) {
    return (
      <div className="min-h-screen pt-36">
        <Navbar onSearchClick={() => setIsSearchOpen(true)} />
        <div className="container-luxury py-20 flex flex-col items-center justify-center">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-gray-600 mb-2">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
            重试
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      <div className="pt-36">
        <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        
        {isLoading ? (
          <div className="container-luxury py-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-champagne" />
          </div>
        ) : (
          <HomestayGrid homestays={filteredHomestays} />
        )}
      </div>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <Footer />
    </>
  );
}

export default function App() {
  const { path } = useHashRouter(); // 修正为path
  
  // Debug logging
  useEffect(() => {
    console.log('Current hash path:', path);
  }, [path]);

  // Route mapping
  const renderRoute = () => {
    // 移除查询参数进行路由匹配
    const pathWithoutQuery = path.split('?')[0];
    
    if (pathWithoutQuery.startsWith('/admin')) {
      return <AdminApp />;
    }
    
    switch (pathWithoutQuery) {
      case '/':
        return <HomePage />;
      case '/test':
        return <TestPage />;
      case '/meal-order':
        return <MealOrderPage />;
      case '/car-rental':
        return <CarRentalPage />;
      case '/ticket-booking':
        return <TicketBookingPage />;
      case '/login':
        return <LoginPage />;
      case '/user':
        return <UserCenter />;
      case '/search':
        return <SearchResults />;
      default:
        if (pathWithoutQuery.startsWith('/homestay/')) {
          return <HomestayDetail />;
        }
        return <HomePage />;
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white">
        {renderRoute()}
      </div>
    </LanguageProvider>
  );
}