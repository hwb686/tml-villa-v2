import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight, Download } from 'lucide-react';
import { financeApi, type Transaction, type FinanceOverview } from '@/services/api';

interface FinanceProps { view?: 'overview' | 'withdrawal' | 'transactions'; }

const transactionTypeMap: Record<string, { label: string; color: string; icon: any }> = {
  income: { label: '收入', color: '#52C41A', icon: ArrowDownLeft },
  expense: { label: '支出', color: '#F5222D', icon: ArrowUpRight },
};

export default function Finance({ view = 'overview' }: FinanceProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setIsLoading(true);
      
      const [overviewRes, transactionsRes] = await Promise.all([
        financeApi.getOverview(),
        financeApi.getTransactions(),
      ]);
      
      setOverview(overviewRes.data);
      setTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Finance API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

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

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">账户余额</p>
                <p className="text-2xl font-semibold mt-1">฿{balance.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-champagne/10 text-champagne"><Wallet size={24} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总收入</p>
                <p className="text-2xl font-semibold mt-1 text-green-600">฿{totalIncome.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600"><TrendingUp size={24} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总支出</p>
                <p className="text-2xl font-semibold mt-1 text-red-600">฿{totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-600"><TrendingDown size={24} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总订单数</p>
                <p className="text-2xl font-semibold mt-1 text-champagne">{overview?.totalOrders || 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-champagne/10 text-champagne"><ArrowUpRight size={24} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
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
                <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} /><stop offset="95%" stopColor="#C9A962" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value: number) => [`฿${value.toLocaleString()}`, '收入']} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="amount" stroke="#C9A962" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const renderTransactions = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>交易记录</CardTitle>
        <Button variant="outline" className="gap-2"><Download size={16} />导出</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">交易号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">描述</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    暂无交易记录
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => {
                  const TypeIcon = transactionTypeMap[transaction.type]?.icon;
                  return (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{transaction.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {TypeIcon && (<TypeIcon size={16} style={{ color: transactionTypeMap[transaction.type]?.color }} />)}
                          <span className="text-sm">{transactionTypeMap[transaction.type]?.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.description}</td>
                      <td className={`py-3 px-4 text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}฿{transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{transaction.createdAt}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  const renderWithdrawal = () => (
    <Card>
      <CardHeader><CardTitle>提现管理</CardTitle></CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Wallet size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无待处理的提现申请</p>
          <p className="text-sm text-gray-400 mt-2">当有新的提现申请时，将显示在这里</p>
        </div>
      </CardContent>
    </Card>
  );

  const getTitle = () => {
    switch (view) { 
      case 'overview': return '收入统计'; 
      case 'withdrawal': return '提现管理'; 
      case 'transactions': return '交易记录'; 
      default: return '财务管理'; 
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{getTitle()}</h1>
      {view === 'overview' && renderOverview()}
      {view === 'transactions' && renderTransactions()}
      {view === 'withdrawal' && renderWithdrawal()}
    </div>
  );
}
