import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Orders from '@/pages/Orders';
import MealOrders from '@/pages/MealOrders';
import MealConfigs from '@/pages/MealConfigs';
import CarRentals from '@/pages/CarRentals';
import CarConfigs from '@/pages/CarConfigs';
import CarStockManagement from '@/pages/CarStockManagement';
import Drivers from '@/pages/Drivers';
import DriverSchedule from '@/pages/DriverSchedule';
import Staffs from '@/pages/Staffs';
import StaffSchedule from '@/pages/StaffSchedule';
import TicketOrders from '@/pages/TicketOrders';
import TicketConfigs from '@/pages/TicketConfigs';
import StockManagement from '@/pages/StockManagement';

import Finance from '@/pages/Finance';
import Settings from '@/pages/Settings';
import Categories from '@/pages/Categories';
import HomestayManage from '@/pages/HomestayManage';
import Reviews from '@/pages/Reviews';
import { useAdminHashRouter } from '@/lib/router';

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
      case 'reviews':
        return <Reviews />;
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
    <MainLayout 
      currentPath={path} 
      onNavigate={navigate} 
      onLogout={handleLogout}
    >
      {renderContent()}
    </MainLayout>
  );
}
