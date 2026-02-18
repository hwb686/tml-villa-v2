import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, ClipboardList, CreditCard, Settings, ChevronDown, ChevronRight, Home, Car, Ticket, UtensilsCrossed, LogOut, Menu, X, Tags } from 'lucide-react';

interface MenuItem { key: string; label: string; icon: React.ElementType; path?: string; children?: MenuItem[]; }

interface SidebarProps { collapsed: boolean; onToggle: () => void; currentPath: string; onNavigate: (path: string) => void; onLogout: () => void; }

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: '仪表板', icon: LayoutDashboard, path: 'dashboard' },
  { key: 'users', label: '用户管理', icon: Users, path: 'users' },
  { key: 'categories', label: '分类管理', icon: Tags, path: 'categories' },
  { key: 'homestays', label: '民宿管理', icon: Home, path: 'homestays' },
  { key: 'orders', label: '订单管理', icon: ClipboardList, children: [
    { key: 'orders-homestay', label: '民宿订单', icon: Home, path: 'orders/homestay' },
    { key: 'orders-car', label: '租车订单', icon: Car, path: 'orders/car' },
    { key: 'orders-ticket', label: '票务订单', icon: Ticket, path: 'orders/ticket' },
    { key: 'orders-meal', label: '订餐订单', icon: UtensilsCrossed, path: 'meal-orders' },
  ]},
  { key: 'configs', label: '业务配置', icon: Settings, children: [
    { key: 'meal-configs', label: '餐饮配置', icon: UtensilsCrossed, path: 'meal-configs' },
    { key: 'car-configs', label: '车辆配置', icon: Car, path: 'car-configs' },
    { key: 'ticket-configs', label: '票务配置', icon: Ticket, path: 'ticket-configs' },
  ]},
  { key: 'finance', label: '财务管理', icon: CreditCard, children: [
    { key: 'finance-overview', label: '收入统计', icon: CreditCard, path: 'finance/overview' },
    { key: 'finance-withdrawal', label: '提现管理', icon: CreditCard, path: 'finance/withdrawal' },
    { key: 'finance-transactions', label: '交易记录', icon: CreditCard, path: 'finance/transactions' },
  ]},
  { key: 'settings', label: '系统设置', icon: Settings, path: 'settings' },
];

export default function Sidebar({ collapsed, onToggle, currentPath, onNavigate, onLogout }: SidebarProps) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['orders', 'configs', 'finance']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleNavigate = (path: string) => { onNavigate(path); setMobileOpen(false); };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedKeys.includes(item.key);
    const isActive = item.path === currentPath || item.children?.some((c) => c.path === currentPath);

    if (hasChildren) {
      return (
        <div key={item.key}>
          <button onClick={() => toggleExpand(item.key)}
            className={cn('w-full flex items-center justify-between px-4 py-3 text-sm transition-colors', isActive ? 'text-champagne bg-champagne/5' : 'text-gray-600 hover:bg-gray-50', level > 0 && 'pl-12')}>
            <div className="flex items-center gap-3"><item.icon size={18} />{!collapsed && <span>{item.label}</span>}</div>
            {!collapsed && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>
          {!collapsed && isExpanded && <div className="bg-gray-50/50">{item.children!.map((child) => renderMenuItem(child, level + 1))}</div>}
        </div>
      );
    }

    return (
      <button key={item.key} onClick={() => item.path && handleNavigate(item.path)}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors', currentPath === item.path ? 'text-champagne bg-champagne/10 border-r-2 border-champagne' : 'text-gray-600 hover:bg-gray-50', level > 0 && 'pl-12')}>
        <item.icon size={18} />{!collapsed && <span>{item.label}</span>}
      </button>
    );
  };

  return (
    <>
      <button className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={cn('fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300', collapsed ? 'w-16' : 'w-64', mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className={cn('h-16 flex items-center border-b border-gray-200', collapsed ? 'justify-center px-2' : 'px-4')}>
          <img src="/images/logo.png" alt="TML Villa" className={cn('h-8 w-auto', collapsed ? 'h-6' : 'h-8')} />
          {!collapsed && <span className="ml-3 font-serif text-lg text-ink">Admin</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-4" style={{ height: 'calc(100% - 128px)' }}>
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
          <button onClick={onLogout} className={cn('w-full flex items-center gap-3 text-sm text-gray-600 hover:text-red-600 transition-colors', collapsed && 'justify-center')}>
            <LogOut size={18} />{!collapsed && <span>退出登录</span>}
          </button>
        </div>
        <button onClick={onToggle} className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm hover:shadow-md transition-shadow">
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} className="-rotate-90" />}
        </button>
      </aside>
    </>
  );
}
