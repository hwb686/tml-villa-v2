import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ClipboardList, CreditCard, Settings, ChevronDown, ChevronRight, Home, Car, Ticket, UtensilsCrossed, LogOut, Menu, X, Tags, Calendar, User, MessageSquare, Users2 } from 'lucide-react';

interface MenuItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表板', icon: LayoutDashboard, path: 'dashboard' },
  { key: 'users', label: '用户管理', icon: Users, path: 'users' },
  { key: 'categories', label: '分类管理', icon: Tags, path: 'categories' },
  { key: 'homestays', label: '民宿管理', icon: Home, path: 'homestays' },
  { key: 'stock', label: '民宿库存', icon: Calendar, path: 'stock' },
  { 
    key: 'car-management', 
    label: '车辆管理', 
    icon: Car, 
    children: [
      { key: 'car-configs', label: '车辆配置', icon: Car, path: 'car-configs' },
      { key: 'car-stock', label: '车辆库存', icon: Calendar, path: 'car-stock' },
      { key: 'car-rentals', label: '租车订单', icon: ClipboardList, path: 'car-rentals' },
      { key: 'drivers', label: '司机管理', icon: User, path: 'drivers' },
      { key: 'driver-schedule', label: '司机排班', icon: Calendar, path: 'driver-schedule' },
    ]
  },
  { 
    key: 'staff-management', 
    label: '员工管理', 
    icon: Users2, 
    children: [
      { key: 'staffs', label: '员工列表', icon: Users2, path: 'staffs' },
      { key: 'staff-schedule', label: '员工排班', icon: Calendar, path: 'staff-schedule' },
    ]
  },
  { 
    key: 'orders', 
    label: '订单管理', 
    icon: ClipboardList, 
    children: [
      { key: 'orders-homestay', label: '民宿订单', icon: Home, path: 'orders/homestay' },
      { key: 'orders-ticket', label: '票务订单', icon: Ticket, path: 'ticket-orders' },
      { key: 'orders-meal', label: '订餐订单', icon: UtensilsCrossed, path: 'meal-orders' },
    ]
  },
  { 
    key: 'configs', 
    label: '业务配置', 
    icon: Settings, 
    children: [
      { key: 'meal-configs', label: '餐饮配置', icon: UtensilsCrossed, path: 'meal-configs' },
      { key: 'ticket-configs', label: '票务配置', icon: Ticket, path: 'ticket-configs' },
    ]
  },
  { 
    key: 'finance', 
    label: '财务管理', 
    icon: CreditCard, 
    children: [
      { key: 'finance-overview', label: '收入统计', icon: CreditCard, path: 'finance/overview' },
      { key: 'finance-withdrawal', label: '提现管理', icon: CreditCard, path: 'finance/withdrawal' },
      { key: 'finance-transactions', label: '交易记录', icon: CreditCard, path: 'finance/transactions' },
    ]
  },
  { key: 'reviews', label: '评价管理', icon: MessageSquare, path: 'reviews' },
  { key: 'settings', label: '系统设置', icon: Settings, path: 'settings' },
];

export default function Sidebar({ collapsed, onToggle, currentPath, onNavigate, onLogout }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['orders', 'configs', 'car-management', 'staff-management']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleExpanded = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMobileOpen(false);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.key);

    return (
      <div key={item.key}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.key);
            } else if (item.path) {
              handleNavigate(item.path);
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
            level > 0 && 'ml-4 text-sm',
            isActive
              ? 'bg-champagne/10 text-champagne font-medium'
              : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <item.icon size={20} className={isActive ? 'text-champagne' : ''} />
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {hasChildren && (
                isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </>
          )}
        </button>
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-champagne rounded-lg flex items-center justify-center">
                <Home className="text-white" size={24} />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="font-bold text-lg">TML Villa</h1>
                  <p className="text-xs text-gray-500">管理后台</p>
                </div>
              )}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => renderMenuItem(item))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              {!collapsed && <span>退出登录</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
