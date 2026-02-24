import { useState, useEffect, lazy, Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import { useAdminHashRouter } from '@/lib/router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// React.lazy 代码分割 — 管理后台页面按需加载，减小首屏体积
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Users = lazy(() => import('@/pages/Users'));
const Orders = lazy(() => import('@/pages/Orders'));
const MealOrders = lazy(() => import('@/pages/MealOrders'));
const MealConfigs = lazy(() => import('@/pages/MealConfigs'));
const CarRentals = lazy(() => import('@/pages/CarRentals'));
const CarConfigs = lazy(() => import('@/pages/CarConfigs'));
const CarStockManagement = lazy(() => import('@/pages/CarStockManagement'));
const Drivers = lazy(() => import('@/pages/Drivers'));
const DriverSchedule = lazy(() => import('@/pages/DriverSchedule'));
const Staffs = lazy(() => import('@/pages/Staffs'));
const StaffSchedule = lazy(() => import('@/pages/StaffSchedule'));
const TicketOrders = lazy(() => import('@/pages/TicketOrders'));
const TicketConfigs = lazy(() => import('@/pages/TicketConfigs'));
const StockManagement = lazy(() => import('@/pages/StockManagement'));
const CalendarView = lazy(() => import('@/pages/CalendarView'));
const UsageMonitor = lazy(() => import('@/pages/UsageMonitor'));
const Coupons = lazy(() => import('@/pages/Coupons'));
const Promotions = lazy(() => import('@/pages/Promotions'));
const MemberLevels = lazy(() => import('@/pages/MemberLevels'));
const Merchants = lazy(() => import('@/pages/Merchants'));
const Finance = lazy(() => import('@/pages/Finance'));
const Costs = lazy(() => import('@/pages/Costs'));
const CostStats = lazy(() => import('@/pages/CostStats'));
const Settings = lazy(() => import('@/pages/Settings'));
const Categories = lazy(() => import('@/pages/Categories'));
const HomestayManage = lazy(() => import('@/pages/HomestayManage'));
const Reviews = lazy(() => import('@/pages/Reviews'));

function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-champagne" />
    </div>
  );
}

export default function AdminApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { path, navigate } = useAdminHashRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (token && loggedIn) {
      setIsLoggedIn(true);
    } else {
      // Clear invalid state
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('adminLoggedIn', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    navigate('login');
  };

  const renderContent = () => {
    // Extract base path (e.g., 'orders/homestay' -> 'orders')
    const basePath = path.split('/')[0];
    
    switch (basePath) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <Users />;
      case 'categories':
        return <Categories />;
      case 'homestays':
        return <HomestayManage />;
      case 'stock':
        return <StockManagement />;
      case 'calendar':
        return <CalendarView />;
      case 'orders':
        const orderType = path.split('/')[1] as 'homestay' | 'car' | 'ticket' | 'dining' | undefined;
        return <Orders type={orderType} />;
      case 'meal-orders':
        return <MealOrders />;
      case 'meal-configs':
        return <MealConfigs />;
case 'car-rentals':
        return <CarRentals />;
      case 'car-configs':
        return <CarConfigs />;
      case 'car-stock':
        return <CarStockManagement />;
      case 'drivers':
        return <Drivers />;
      case 'driver-schedule':
        return <DriverSchedule />;
      case 'staffs':
        return <Staffs />;
      case 'staff-schedule':
        return <StaffSchedule />;
      case 'ticket-orders':
        return <TicketOrders />;
      case 'ticket-configs':
        return <TicketConfigs />;

      case 'finance':
        return <Finance />;
      case 'costs':
        return <Costs />;
      case 'cost-stats':
        return <CostStats />;
      case 'usage-monitor':
        return <UsageMonitor />;
      case 'reviews':
        return <Reviews />;
      case 'coupons':
        return <Coupons />;
      case 'promotions':
        return <Promotions />;
      case 'member-levels':
        return <MemberLevels />;
      case 'merchants':
        return <Merchants />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <MainLayout 
        currentPath={path} 
        onNavigate={navigate} 
        onLogout={handleLogout}
      >
        <Suspense fallback={<LazyFallback />}>
          {renderContent()}
        </Suspense>
      </MainLayout>
    </ErrorBoundary>
  );
}
