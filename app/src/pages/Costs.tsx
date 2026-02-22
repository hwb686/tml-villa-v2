import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { costApi, type Cost, type CostType, type CostTypeInfo, type CreateCostData } from '@/services/api';

const COST_TYPE_COLORS: Record<CostType, string> = {
  rent: '#1890ff',
  utilities: '#52c41a',
  salary: '#faad14',
  maintenance: '#eb2f96',
  procurement: '#722ed1',
  other: '#8c8c8c',
};

export default function Costs() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [costTypes, setCostTypes] = useState<CostTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  
  // 筛选条件
  const [filterCostType, setFilterCostType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 弹窗状态
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<Cost | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState<CreateCostData>({
    costType: 'other',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
    remark: '',
  });

  // 获取成本类型
  useEffect(() => {
    const fetchCostTypes = async () => {
      try {
        const res = await costApi.getTypes();
        setCostTypes(res.data);
      } catch (err) {
        console.error('Error fetching cost types:', err);
      }
    };
    fetchCostTypes();
  }, []);

  // 获取成本列表
  const fetchCosts = async () => {
    try {
      setIsLoading(true);
      const params: any = { page: pagination.page, pageSize: pagination.pageSize };
      if (filterCostType !== 'all') params.costType = filterCostType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      
      const res = await costApi.getAll(params);
      setCosts(res.data.list);
      setPagination(prev => ({ ...prev, ...res.data.pagination }));
    } catch (err) {
      console.error('Error fetching costs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, [pagination.page, filterCostType, filterStatus, filterStartDate, filterEndDate]);

  // 创建成本
  const handleCreate = async () => {
    try {
      await costApi.create(formData);
      setIsAddDialogOpen(false);
      resetForm();
      fetchCosts();
    } catch (err) {
      console.error('Error creating cost:', err);
      alert('创建失败');
    }
  };

  // 更新成本
  const handleUpdate = async () => {
    if (!selectedCost) return;
    try {
      await costApi.update(selectedCost.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
      fetchCosts();
    } catch (err) {
      console.error('Error updating cost:', err);
      alert('更新失败');
    }
  };

  // 删除成本
  const handleDelete = async () => {
    if (!selectedCost) return;
    try {
      await costApi.delete(selectedCost.id);
      setIsDeleteDialogOpen(false);
      setSelectedCost(null);
      fetchCosts();
    } catch (err) {
      console.error('Error deleting cost:', err);
      alert('删除失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      costType: 'other',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: '',
      remark: '',
    });
    setSelectedCost(null);
  };

  // 打开编辑弹窗
  const openEditDialog = (cost: Cost) => {
    setSelectedCost(cost);
    setFormData({
      costType: cost.costType,
      amount: cost.amount,
      date: cost.date,
      description: cost.description || '',
      relatedId: cost.relatedId,
      relatedType: cost.relatedType,
      remark: cost.remark || '',
    });
    setIsEditDialogOpen(true);
  };

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `฿${amount.toLocaleString()}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '待确认', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '已确认', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
    };
    const info = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>
        {info.label}
      </span>
    );
  };

  // 计算总成本
  const totalAmount = costs.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">成本管理</h1>
        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="bg-champagne hover:bg-champagne-dark">
          <Plus className="mr-2 h-4 w-4" /> 新增成本
        </Button>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-gray-500">成本类型</Label>
              <Select value={filterCostType} onValueChange={setFilterCostType}>
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {costTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">状态</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="pending">待确认</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">开始日期</Label>
              <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-gray-500">结束日期</Label>
              <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setFilterCostType('all');
                setFilterStatus('all');
                setFilterStartDate('');
                setFilterEndDate('');
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <Filter className="mr-2 h-4 w-4" /> 重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">当前页成本</p>
            <p className="text-2xl font-semibold text-red-600">{formatAmount(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">记录数</p>
            <p className="text-2xl font-semibold">{costs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">总记录数</p>
            <p className="text-2xl font-semibold">{pagination.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* 成本列表 */}
      <Card>
        <CardHeader>
          <CardTitle>成本列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : costs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无成本记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map(cost => (
                  <TableRow key={cost.id}>
                    <TableCell>{formatDate(cost.date)}</TableCell>
                    <TableCell>
                      <span
                        className="px-2 py-1 rounded text-white text-xs"
                        style={{ backgroundColor: COST_TYPE_COLORS[cost.costType] || '#8c8c8c' }}
                      >
                        {cost.costTypeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-red-600">{formatAmount(cost.amount)}</TableCell>
                    <TableCell className="max-w-xs truncate">{cost.description || '-'}</TableCell>
                    <TableCell>{getStatusBadge(cost.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(cost)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedCost(cost); setIsDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增成本弹窗 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增成本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>成本类型 *</Label>
              <Select value={formData.costType} onValueChange={v => setFormData(prev => ({ ...prev, costType: v as CostType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>金额（泰铢） *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                min={1}
              />
            </div>
            <div>
              <Label>日期 *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>描述</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简要描述成本用途"
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="其他备注信息"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button className="bg-champagne hover:bg-champagne-dark" onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑成本弹窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑成本</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>成本类型</Label>
              <Select value={formData.costType} onValueChange={v => setFormData(prev => ({ ...prev, costType: v as CostType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>金额（泰铢）</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                min={1}
              />
            </div>
            <div>
              <Label>日期</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label>描述</Label>
              <Input
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button className="bg-champagne hover:bg-champagne-dark" onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条成本记录吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
