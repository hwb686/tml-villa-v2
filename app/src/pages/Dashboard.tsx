import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ShoppingCart, DollarSign, Users, Clock, ArrowUpRight, ArrowDownRight, CalendarIcon, TrendingUp, Home, Car } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { reportsApi, type ReportOverview, type RevenueReport, type UserReport, type OrderReport } from '@/services/api';
import { useApiState } from '@/hooks/useApiState';
import { LoadingOverlay } from '@/components/common/LoadingComponents';
import { format, subDays, subMonths } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const orderTypeMap: Record<string, { label: string; color: string }> = {
  homestay: { label: '民宿', color: '#C9A962' },
  car: { label: '租车', color: '#3B82F6' },
  ticket: { label: '票务', color: '#10B981' },
  dining: { label: '餐饮', color: '#F59E0B' },
};

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F59E0B' },
  confirmed: { label: '已确认', color: '#3B82F6' },
  completed: { label: '已完成', color: '#10B981' },
  cancelled: { label: '已取消', color: '#EF4444' },
};

type TimeRangeType = '7d' | '30d' | '90d' | 'custom';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRangeType>('7d');
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const overviewState = useApiState<ReportOverview>(null);
  const revenueState = useApiState<RevenueReport>(null);
  const usersState = useApiState<UserReport>(null);
  const ordersState = useApiState<OrderReport>(null);

  // 计算日期范围
  const getDateRange = () => {
    const now = new Date();
    if (timeRange === 'custom' && customDateRange.from && customDateRange.to) {
      return {
        startDate: format(customDateRange.from, 'yyyy-MM-dd'),
        endDate: format(customDateRange.to, 'yyyy-MM-dd'),
      };
    }
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return {
      startDate: format(subDays(now, days), 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      const { startDate, endDate } = getDateRange();
      
      try {
        overviewState.setLoading(true);
        revenueState.setLoading(true);
        usersState.setLoading(true);
        ordersState.setLoading(true);
        
        // 并行获取数据
        const [overviewRes, revenueRes, usersRes, ordersRes] = await Promise.all([
          reportsApi.getOverview({ startDate, endDate }),
          reportsApi.getRevenue({ startDate, endDate, groupBy: timeRange === '90d' ? 'week' : 'day' }),
          reportsApi.getUsers({ startDate, endDate }),
          reportsApi.getOrders({ startDate, endDate }),
        ]);
        
        overviewState.setData(overviewRes.data);
        revenueState.setData(revenueRes.data);
        usersState.setData(usersRes.data);
        ordersState.setData(ordersRes.data);
      } catch (err) {
        console.error('Dashboard API Error:', err);
        overviewState.setError('数据加载失败');
      } finally {
        overviewState.setLoading(false);
        revenueState.setLoading(false);
        usersState.setLoading(false);
        ordersState.setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, customDateRange]);

  const formatCurrency = (value: number) => `฿${value.toLocaleString()}`;

  // 统计卡片数据
  const statCards = [
    { 
      title: '总收入', 
      value: formatCurrency(overviewState.data?.revenue.total || 0), 
      icon: DollarSign, 
      color: 'bg-green-50 text-green-600',
      subValue: `利润 ${formatCurrency(overviewState.data?.cost.profit || 0)}`
    },
    { 
      title: '订单数', 
      value: overviewState.data?.orders.total || 0, 
      icon: ShoppingCart, 
      color: 'bg-blue-50 text-blue-600',
      subValue: `完成 ${overviewState.data?.orders.statusDistribution.completed || 0}`
    },
    { 
      title: '新增用户', 
      value: usersState.data?.newUsers || 0, 
      icon: Users, 
      color: 'bg-purple-50 text-purple-600',
      subValue: `日均 ${usersState.data?.avgDaily || 0}`
    },
    { 
      title: '待处理订单', 
      value: overviewState.data?.orders.statusDistribution.pending || 0, 
      icon: Clock, 
      color: 'bg-orange-50 text-orange-600',
      subValue: `已确认 ${overviewState.data?.orders.statusDistribution.confirmed || 0}`
    },
  ];

  // 收入趋势数据
  const revenueTrend = revenueState.data?.trend.map(item => ({
    date: item.date,
    amount: item.total,
    homestay: item.homestay,
    meal: item.meal,
    car: item.car,
    ticket: item.ticket,
  })) || [];

  // 订单类型分布数据
  const orderTypeData = overviewState.data ? [
    { name: '民宿', value: overviewState.data.orders.typeDistribution.homestay, color: '#C9A962' },
    { name: '租车', value: overviewState.data.orders.typeDistribution.car, color: '#3B82F6' },
    { name: '票务', value: overviewState.data.orders.typeDistribution.ticket, color: '#10B981' },
    { name: '餐饮', value: overviewState.data.orders.typeDistribution.dining, color: '#F59E0B' },
  ].filter(d => d.value > 0) : [];

  // 用户增长数据
  const userTrend = usersState.data?.trend.slice(-14).map(item => ({
    date: format(new Date(item.date), 'MM/dd'),
    count: item.count,
    cumulative: item.cumulative,
  })) || [];

  // 统一的加载状态检查
  if (overviewState.isLoading) {
    return <LoadingOverlay message="正在加载报表数据..." fullscreen />;
  }

  // 错误状态显示
  if (overviewState.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">加载失败: {overviewState.error}</p>
        <Button 
          onClick={() => window.location.reload()}
          className="bg-champagne hover:bg-champagne-dark"
        >
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 日期筛选器 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">运营报表</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? 'bg-champagne hover:bg-champagne-dark' : ''}
              >
                {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
              </Button>
            ))}
          </div>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={timeRange === 'custom' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'gap-2',
                  timeRange === 'custom' && 'bg-champagne hover:bg-champagne-dark'
                )}
              >
                <CalendarIcon size={16} />
                {timeRange === 'custom' && customDateRange.from && customDateRange.to
                  ? `${format(customDateRange.from, 'MM/dd')}-${format(customDateRange.to, 'MM/dd')}`
                  : '自定义'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                locale={zhCN}
                selected={{
                  from: customDateRange.from,
                  to: customDateRange.to,
                }}
                onSelect={(range) => {
                  setCustomDateRange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    setTimeRange('custom');
                    setIsCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-400 mt-1">{stat.subValue}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}><stat.icon size={24} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 收入趋势和订单分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">收入趋势</CardTitle>
            <p className="text-sm text-gray-500">
              总收入: {formatCurrency(revenueState.data?.summary.totalRevenue || 0)} | 
              日均: {formatCurrency(revenueState.data?.summary.avgDaily || 0)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C9A962" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `฿${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          amount: '总收入',
                          homestay: '民宿',
                          meal: '餐饮',
                          car: '租车',
                          ticket: '票务',
                        };
                        return [formatCurrency(value), labels[name] || name];
                      }}
                      labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd')}
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <Area type="monotone" dataKey="amount" stroke="#C9A962" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无收入数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">订单类型分布</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {orderTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={orderTypeData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {orderTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无订单数据
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {orderTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用户增长和订单状态 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users size={20} />
              用户增长趋势
            </CardTitle>
            <p className="text-sm text-gray-500">
              总用户: {usersState.data?.totalUsers || 0} | 新增: {usersState.data?.newUsers || 0}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {userTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <Bar dataKey="count" name="新增用户" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无用户数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart size={20} />
              订单状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overviewState.data && Object.entries(orderStatusMap).map(([key, { label, color }]) => {
                const count = overviewState.data!.orders.statusDistribution[key as keyof typeof overviewState.data.orders.statusDistribution] || 0;
                const total = overviewState.data!.orders.total || 1;
                const percentage = Math.round((count / total) * 100);
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className="text-sm text-gray-500">{count} 单 ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 收入来源分布 */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-4">收入来源</h4>
              <div className="grid grid-cols-2 gap-4">
                {overviewState.data && [
                  { key: 'homestay', label: '民宿', icon: Home },
                  { key: 'car', label: '租车', icon: Car },
                  { key: 'meal', label: '餐饮', icon: ShoppingCart },
                  { key: 'ticket', label: '票务', icon: DollarSign },
                ].map(({ key, label, icon: Icon }) => {
                  const amount = overviewState.data!.revenue[key as keyof typeof overviewState.data.revenue] || 0;
                  return (
                    <div key={key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Icon size={20} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-sm font-semibold">{formatCurrency(amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 利润概览 */}
      {overviewState.data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp size={20} />
              利润概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500">总收入</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(overviewState.data.revenue.total)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-500">总成本</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(overviewState.data.cost.total)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500">净利润</p>
                <p className={`text-2xl font-bold ${overviewState.data.cost.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(overviewState.data.cost.profit)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-500">利润率</p>
                <p className={`text-2xl font-bold ${overviewState.data.cost.profitMargin >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                  {overviewState.data.cost.profitMargin}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
