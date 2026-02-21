import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, User, AlertCircle, Loader2 } from 'lucide-react';
import { driverApi, type Driver, type CreateDriverData } from '@/services/api';

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '在职', color: 'bg-green-100 text-green-700' },
  inactive: { label: '离职', color: 'bg-gray-100 text-gray-700' },
  on_leave: { label: '请假', color: 'bg-yellow-100 text-yellow-700' },
};

export default function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // 弹窗状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState<CreateDriverData>({
    name: '',
    phone: '',
    avatar: '',
    licenseNumber: '',
    status: 'active',
    dailyFee: 0,
    remark: '',
  });
  const [error, setError] = useState('');

  // 加载司机列表
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const response = await driverApi.getAll();
      setDrivers(response.data);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      phone: '',
      avatar: '',
      licenseNumber: '',
      status: 'active',
      dailyFee: 0,
      remark: '',
    });
    setError('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      avatar: driver.avatar || '',
      licenseNumber: driver.licenseNumber || '',
      status: driver.status as 'active' | 'inactive' | 'on_leave',
      dailyFee: driver.dailyFee,
      remark: driver.remark || '',
    });
    setError('');
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setDeletingDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      setError('姓名和电话为必填项');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      if (editingDriver) {
        await driverApi.update(editingDriver.id, formData);
      } else {
        await driverApi.create(formData);
      }
      setIsDialogOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDriver) return;
    
    setIsSaving(true);
    try {
      await driverApi.delete(deletingDriver.id);
      setIsDeleteDialogOpen(false);
      fetchDrivers();
    } catch (err: any) {
      console.error('Failed to delete driver:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <User className="w-6 h-6" />
          司机管理
        </h1>
        <Button onClick={openCreateDialog} className="bg-champagne hover:bg-champagne-dark">
          <Plus size={18} className="mr-2" />添加司机
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(d => d.status === 'active').length}
            </div>
            <div className="text-sm text-gray-500">在职司机</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {drivers.filter(d => d.status === 'on_leave').length}
            </div>
            <div className="text-sm text-gray-500">请假中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">
              {drivers.filter(d => d.status === 'inactive').length}
            </div>
            <div className="text-sm text-gray-500">已离职</div>
          </CardContent>
        </Card>
      </div>

      {/* 司机列表 */}
      <Card>
        <CardHeader>
          <CardTitle>司机列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-champagne" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无司机数据，点击"添加司机"创建
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>驾照号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>日薪(泰铢)</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.licenseNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusMap[driver.status]?.color}>
                        {statusMap[driver.status]?.label || driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{driver.dailyFee.toLocaleString()}</TableCell>
                    <TableCell className="max-w-32 truncate">{driver.remark || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(driver)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(driver)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? '编辑司机' : '添加司机'}</DialogTitle>
            <DialogDescription>
              {editingDriver ? '修改司机信息' : '添加新的司机'}
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="司机姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>电话 *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="联系电话"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>驾照号</Label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div className="space-y-2">
                <Label>日薪 (泰铢)</Label>
                <Input
                  type="number"
                  value={formData.dailyFee}
                  onChange={(e) => setFormData({ ...formData, dailyFee: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="on_leave">请假</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingDriver ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除司机 "{deletingDriver?.name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDelete} disabled={isSaving} variant="destructive">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
