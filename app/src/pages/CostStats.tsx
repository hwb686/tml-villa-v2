import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
  BarChart, Bar,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, Calendar } from 'lucide-react';
import { costApi, type CostStatsData, type CostByType, type CostMonthlyTrend } from '@/services/api';

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#8c8c8c'];

export default function CostStats() {
  const [statsData, setStatsData] = useState<CostStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 默认查询最近30天
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const res = await costApi.getStats(params);
      setStatsData(res.data);
    } catch (err) {
      console.error('Error fetching cost stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchStats();
    }
  }, [startDate, endDate]);

  // 格式化金额
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `฿${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `฿${(amount / 1000).toFixed(1)}K`;
    }
    return `฿${amount}`;
  };

  // 饼图数据
  const pieData = statsData?.byType.map(item => ({
    name: item.label,
    value: item.amount,
    count: item.count,
  })) || [];

  // 趋势图数据
  const trendData = statsData?.monthlyTrend.map(item => ({
    month: item.month,
    成本: item.cost,
    收入: item.income,
    利润: item.profit,
  })) || [];

  // 自定义饼图标签
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null;
    
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">成本统计</h1>
      </div>

      {/* 日期筛选 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div>
              <Label className="text-xs text-gray-500">开始日期</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs text-gray-500">结束日期</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-40" />
            </div>
            <Button variant="outline" onClick={fetchStats}>
              <Calendar className="mr-2 h-4 w-4" /> 查询
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne"></div>
        </div>
      ) : !statsData ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            暂无数据
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 汇总卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总收入</p>
                    <p className="text-2xl font-semibold mt-1 text-green-600">
                      {formatAmount(statsData.summary.totalIncome)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总成本</p>
                    <p className="text-2xl font-semibold mt-1 text-red-600">
                      {formatAmount(statsData.summary.totalCost)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 text-red-600">
                    <TrendingDown size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">净利润</p>
                    <p className={`text-2xl font-semibold mt-1 ${statsData.summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(statsData.summary.profit)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${statsData.summary.profit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <DollarSign size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">利润率</p>
                    <p className={`text-2xl font-semibold mt-1 ${statsData.summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {statsData.summary.profitMargin}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${statsData.summary.profitMargin >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Percent size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 成本类型分布饼图 */}
            <Card>
              <CardHeader>
                <CardTitle>成本类型分布</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatAmount(value)}
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 成本类型明细 */}
            <Card>
              <CardHeader>
                <CardTitle>成本类型明细</CardTitle>
              </CardHeader>
              <CardContent>
                {statsData.byType.length > 0 ? (
                  <div className="space-y-4">
                    {statsData.byType.map((item, index) => (
                      <div key={item.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{item.label}</span>
                          <span className="text-sm text-gray-500">({item.count}笔)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-red-600">{formatAmount(item.amount)}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({statsData.summary.totalCost > 0 ? ((item.amount / statsData.summary.totalCost) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex items-center justify-between font-semibold">
                        <span>总计</span>
                        <span className="text-red-600">{formatAmount(statsData.summary.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    暂无数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 趋势图 */}
          <Card>
            <CardHeader>
              <CardTitle>收支趋势</CardTitle>
            </CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f5222d" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f5222d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip 
                        formatter={(value: number) => formatAmount(value)}
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="收入" 
                        stroke="#52c41a" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorIncome)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="成本" 
                        stroke="#f5222d" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorCost)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="利润" 
                        stroke="#1890ff" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorProfit)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-gray-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>

          {/* 月度明细 */}
          <Card>
            <CardHeader>
              <CardTitle>月度明细</CardTitle>
            </CardHeader>
            <CardContent>
              {statsData.monthlyTrend.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">月份</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">收入</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">成本</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">利润</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">利润率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData.monthlyTrend.map((item) => (
                        <tr key={item.month} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{item.month}</td>
                          <td className="py-3 px-4 text-right text-green-600">{formatAmount(item.income)}</td>
                          <td className="py-3 px-4 text-right text-red-600">{formatAmount(item.cost)}</td>
                          <td className={`py-3 px-4 text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatAmount(item.profit)}
                          </td>
                          <td className={`py-3 px-4 text-right ${item.income > 0 ? (item.profit >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                            {item.income > 0 ? `${((item.profit / item.income) * 100).toFixed(1)}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  暂无数据
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
