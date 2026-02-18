import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, DollarSign, Users, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { financeApi, orderApi, type Order, type FinanceOverview } from '@/services/api';
import { useApiState } from '@/hooks/useApiState';
import { LoadingOverlay } from '@/components/common/LoadingComponents';

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

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const overviewState = useApiState<FinanceOverview>(null);
  const ordersState = useApiState<Order[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        overviewState.setLoading(true);
        ordersState.setLoading(true);
        
        // 并行获取数据
        const [overviewRes, ordersRes] = await Promise.all([
          financeApi.getOverview(),
          orderApi.getAll()
        ]);
        
        overviewState.setData(overviewRes.data);
        ordersState.setData(ordersRes.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard API Error:', err);
        overviewState.setError('数据加载失败');
        ordersState.setError('订单数据加载失败');
      } finally {
        overviewState.setLoading(false);
        ordersState.setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { title: '今日订单', value: overviewState.data?.totalOrders || 0, icon: ShoppingCart, change: '+12%', changeType: 'up' as const, color: 'bg-blue-50 text-blue-600' },
    { title: '今日收入', value: `฿${(overviewState.data?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, change: '+8%', changeType: 'up' as const, color: 'bg-green-50 text-green-600' },
    { title: '新增用户', value: 0, icon: Users, change: '+5%', changeType: 'up' as const, color: 'bg-purple-50 text-purple-600' },
    { title: '待处理订单', value: overviewState.data?.pendingWithdrawals || 0, icon: Clock, change: '-2', changeType: 'down' as const, color: 'bg-orange-50 text-orange-600' },
  ];

  // Sample data for charts
  const revenueData = [
    { date: '周一', amount: 12000 },
    { date: '周二', amount: 15000 },
    { date: '周三', amount: 18000 },
    { date: '周四', amount: 14000 },
    { date: '周五', amount: 22000 },
    { date: '周六', amount: 28000 },
    { date: '周日', amount: 25000 },
  ];

  const orderTypeData = [
    { name: '民宿', value: 45, color: '#C9A962' },
    { name: '租车', value: 25, color: '#3B82F6' },
    { name: '票务', value: 20, color: '#10B981' },
    { name: '餐饮', value: 10, color: '#F59E0B' },
  ];

  // 统一的加载状态检查
  if (overviewState.isLoading || ordersState.isLoading) {
    return <LoadingOverlay message="正在加载仪表板数据..." fullscreen />;
  }

  // 错误状态显示
  if (overviewState.error || ordersState.error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">加载失败: {overviewState.error || ordersState.error}</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-semibold mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.changeType === 'up' ? <ArrowUpRight size={16} className="text-green-500" /> : <ArrowDownRight size={16} className="text-red-500" />}
                    <span className={`text-sm ${stat.changeType === 'up' ? 'text-green-500' : 'text-red-500'}`}>{stat.change}</span>
                    <span className="text-sm text-gray-400">较昨日</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}><stat.icon size={24} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">收入趋势</CardTitle>
            <div className="flex gap-2">
              <Button variant={timeRange === '7d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('7d')} className={timeRange === '7d' ? 'bg-champagne hover:bg-champagne-dark' : ''}>近7天</Button>
              <Button variant={timeRange === '30d' ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange('30d')} className={timeRange === '30d' ? 'bg-champagne hover:bg-champagne-dark' : ''}>近30天</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs><linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9A962" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value: number) => [`฿${value.toLocaleString()}`, '收入']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="amount" stroke="#C9A962" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">订单类型分布</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {orderTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {orderTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">待处理订单</CardTitle>
          <Button variant="outline" size="sm">查看全部</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服务类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服务名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                </tr>
              </thead>
              <tbody>
                {ordersState.data && ordersState.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      暂无订单数据
                    </td>
                  </tr>
                ) : (
                  ordersState.data?.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{order.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-champagne/20 flex items-center justify-center text-champagne text-sm font-medium">
                            {order.userName.charAt(0)}
                          </div>
                          <span className="text-sm">{order.userName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${orderTypeMap[order.type]?.color}20`, color: orderTypeMap[order.type]?.color, border: 'none' }}>
                          {orderTypeMap[order.type]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.itemName}</td>
                      <td className="py-3 px-4 text-sm font-medium">฿{order.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${orderStatusMap[order.status]?.color}20`, color: orderStatusMap[order.status]?.color, border: 'none' }}>
                          {orderStatusMap[order.status]?.label}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
