import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, XCircle, Utensils } from 'lucide-react';
import { mealApi, type MealOrder } from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const mealStatusMap: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: '已确认', color: '#10B981' },
  CANCELLED: { label: '已取消', color: '#EF4444' },
};

const mealTypeMap: Record<string, { label: string; color: string }> = {
  BREAKFAST: { label: '早餐', color: '#F59E0B' },
  DINNER: { label: '晚餐', color: '#8B5CF6' },
};

export default function MealOrders() {
  const [orders, setOrders] = useState<MealOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<MealOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await mealApi.getAll();
      setOrders(response.data);
    } catch (err) {
      console.error('Meal Orders API Error:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.mealConfig.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.mealType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCancel = (order: MealOrder) => { 
    setSelectedOrder(order); 
    setIsCancelDialogOpen(true); 
  };

  const executeCancel = async () => {
    if (!selectedOrder) return;
    try {
      await mealApi.cancel(selectedOrder.id);
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: 'CANCELLED' } : o));
      setIsCancelDialogOpen(false);
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-lg">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">订餐管理</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="搜索订单号、房号、套餐名称..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="用餐类型" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="BREAKFAST">早餐</SelectItem>
                <SelectItem value="DINNER">晚餐</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="订单状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="CONFIRMED">已确认</SelectItem>
                <SelectItem value="CANCELLED">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">早餐订单</p>
            <p className="text-2xl font-semibold mt-1">{orders.filter((o) => o.mealType === 'BREAKFAST').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">晚餐订单</p>
            <p className="text-2xl font-semibold mt-1">{orders.filter((o) => o.mealType === 'DINNER').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>订餐列表</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">套餐</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用餐类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">人数/总价</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">下单时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      暂无订餐数据
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{order.id.slice(-8)}</td>
                      <td className="py-3 px-4 text-sm">{order.roomNumber}</td>
                      <td className="py-3 px-4 text-sm">{order.mealConfig.name}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${mealTypeMap[order.mealType]?.color}20`, color: mealTypeMap[order.mealType]?.color, border: 'none' }}>
                          {mealTypeMap[order.mealType]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm">{order.peopleCount}人 / ฿{order.totalPrice}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.createTime}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${mealStatusMap[order.status]?.color}20`, color: mealStatusMap[order.status]?.color, border: 'none' }}>
                          {mealStatusMap[order.status]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}><Eye size={16} /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>查看详情</p></TooltipContent>
                            </Tooltip>
                            {order.status === 'CONFIRMED' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleCancel(order)}><XCircle size={16} /></Button>
                                </TooltipTrigger>
                                <TooltipContent><p>取消订餐</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">共 {filteredOrders.length} 条记录</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>订餐详情</DialogTitle><DialogDescription>查看订餐详细信息</DialogDescription></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b"><span className="text-gray-500">订单号</span><span className="font-medium">{selectedOrder.id}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">房号</span><span>{selectedOrder.roomNumber}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">套餐</span><span>{selectedOrder.mealConfig.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">用餐类型</span><Badge style={{ backgroundColor: `${mealTypeMap[selectedOrder.mealType]?.color}20`, color: mealTypeMap[selectedOrder.mealType]?.color, border: 'none' }}>{mealTypeMap[selectedOrder.mealType]?.label}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">用餐人数</span><span>{selectedOrder.peopleCount} 人</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">总价</span><span className="font-semibold">฿{selectedOrder.totalPrice}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">备注</span><span>{selectedOrder.remark || '无'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">下单时间</span><span>{selectedOrder.createTime}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">订单状态</span><Badge style={{ backgroundColor: `${mealStatusMap[selectedOrder.status]?.color}20`, color: mealStatusMap[selectedOrder.status]?.color, border: 'none' }}>{mealStatusMap[selectedOrder.status]?.label}</Badge></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>取消订餐</DialogTitle><DialogDescription>确定要取消订餐订单吗？</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={executeCancel}>确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
