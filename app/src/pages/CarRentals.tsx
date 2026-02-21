import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, XCircle, Car } from 'lucide-react';
import { carApi, type CarRental } from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const carStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待确认', color: '#F59E0B' },
  CONFIRMED: { label: '已确认', color: '#10B981' },
  CANCELLED: { label: '已取消', color: '#EF4444' },
};

export default function CarRentals() {
  const [rentals, setRentals] = useState<CarRental[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRental, setSelectedRental] = useState<CarRental | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRentals();
  }, []);

  const fetchRentals = async () => {
    try {
      setIsLoading(true);
      const response = await carApi.getAll();
      setRentals(response.data);
    } catch (err) {
      console.error('Car Rentals API Error:', err);
      setRentals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch = rental.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      rental.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.carConfig.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || rental.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCancel = (rental: CarRental) => { 
    setSelectedRental(rental); 
    setIsCancelDialogOpen(true); 
  };

  const executeCancel = async () => {
    if (!selectedRental) return;
    try {
      await carApi.cancel(selectedRental.id);
      setRentals((prev) => prev.map((r) => r.id === selectedRental.id ? { ...r, status: 'CANCELLED' } : r));
      setIsCancelDialogOpen(false);
    } catch (err) {
      console.error('Cancel failed:', err);
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const handleConfirm = async (rental: CarRental) => {
    try {
      await carApi.updateStatus(rental.id, 'CONFIRMED');
      setRentals((prev) => prev.map((r) => r.id === rental.id ? { ...r, status: 'CONFIRMED' } : r));
    } catch (err) {
      alert('操作失败');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <Car className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold">租车管理</h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="搜索订单号、房号、车辆名称..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="订单状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">待确认</SelectItem>
                <SelectItem value="CONFIRMED">已确认</SelectItem>
                <SelectItem value="CANCELLED">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>租车订单列表</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">房号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">车辆</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">租赁日期</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">天数/总价</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">下单时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRentals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      暂无租车订单数据
                    </td>
                  </tr>
                ) : (
                  filteredRentals.map((rental) => (
                    <tr key={rental.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{rental.id.slice(-8)}</td>
                      <td className="py-3 px-4 text-sm">{rental.roomNumber}</td>
                      <td className="py-3 px-4 text-sm">{rental.carConfig.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {rental.startTime.slice(0, 10)} ~ {rental.endTime.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 text-sm">{rental.days}天 / ฿{rental.totalPrice}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{rental.createTime}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${carStatusMap[rental.status]?.color}20`, color: carStatusMap[rental.status]?.color, border: 'none' }}>
                          {carStatusMap[rental.status]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedRental(rental); setIsDetailOpen(true); }}><Eye size={16} /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>查看详情</p></TooltipContent>
                            </Tooltip>
                            {rental.status === 'PENDING' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600"
                                  onClick={() => handleConfirm(rental)}
                                >
                                  确认
                                </Button>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleCancel(rental)}><XCircle size={16} /></Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>取消订单</p></TooltipContent>
                                </Tooltip>
                              </>
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
            <p className="text-sm text-gray-500">共 {filteredRentals.length} 条记录</p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>租车订单详情</DialogTitle><DialogDescription>查看租车订单详细信息</DialogDescription></DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b"><span className="text-gray-500">订单号</span><span className="font-medium">{selectedRental.id}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">房号</span><span>{selectedRental.roomNumber}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">车辆</span><span>{selectedRental.carConfig.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">车型</span><span>{selectedRental.carConfig.carType}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">取车日期</span><span>{selectedRental.startTime.slice(0, 10)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">还车日期</span><span>{selectedRental.endTime.slice(0, 10)}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">租赁天数</span><span>{selectedRental.days} 天</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">日租金</span><span>฿{selectedRental.carConfig.price}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">总价</span><span className="font-semibold">฿{selectedRental.totalPrice}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">备注</span><span>{selectedRental.remark || '无'}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">下单时间</span><span>{selectedRental.createTime}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">订单状态</span><Badge style={{ backgroundColor: `${carStatusMap[selectedRental.status]?.color}20`, color: carStatusMap[selectedRental.status]?.color, border: 'none' }}>{carStatusMap[selectedRental.status]?.label}</Badge></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>取消订单</DialogTitle><DialogDescription>确定要取消该租车订单吗？</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>取消</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={executeCancel}>确认取消</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
