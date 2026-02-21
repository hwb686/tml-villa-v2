import { useState, useEffect } from 'react';
import { staffApi, Staff, CreateStaffData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// 员工类型映射
const staffTypeMap: Record<string, { label: string; color: string }> = {
  cleaner: { label: '清洁工', color: 'bg-blue-100 text-blue-800' },
  receptionist: { label: '前台', color: 'bg-green-100 text-green-800' },
  admin: { label: '管理员', color: 'bg-purple-100 text-purple-800' },
  maintenance: { label: '维护人员', color: 'bg-orange-100 text-orange-800' },
  other: { label: '其他', color: 'bg-gray-100 text-gray-800' },
};

// 员工状态映射
const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '在职', color: 'bg-green-100 text-green-800' },
  inactive: { label: '离职', color: 'bg-gray-100 text-gray-800' },
  on_leave: { label: '休假', color: 'bg-yellow-100 text-yellow-800' },
};

export default function Staffs() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // 对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<CreateStaffData>({
    name: '',
    phone: '',
    staffType: 'cleaner',
    dailyWage: 0,
  });
  
  // 删除确认对话框
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);

  // 加载员工列表
  const loadStaffs = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterType !== 'all') params.staffType = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;
      
      const data = await staffApi.getAll(params);
      setStaffs(data);
    } catch (error) {
      console.error('Failed to load staffs:', error);
      toast({
        title: '加载失败',
        description: '无法加载员工列表',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, [filterType, filterStatus]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStaffs();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 打开新增对话框
  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      phone: '',
      staffType: 'cleaner',
      dailyWage: 0,
    });
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      phone: staff.phone,
      avatar: staff.avatar,
      staffType: staff.staffType,
      dailyWage: staff.dailyWage,
      idNumber: staff.idNumber,
      emergencyContact: staff.emergencyContact,
      emergencyPhone: staff.emergencyPhone,
      hireDate: staff.hireDate,
      remark: staff.remark,
    });
    setIsDialogOpen(true);
  };

  // 保存员工
  const handleSave = async () => {
    try {
      if (!formData.name || !formData.phone || !formData.staffType) {
        toast({
          title: '请填写完整信息',
          description: '姓名、电话和员工类型为必填项',
          variant: 'destructive',
        });
        return;
      }

      if (editingStaff) {
        await staffApi.update(editingStaff.id, formData);
        toast({ title: '更新成功', description: '员工信息已更新' });
      } else {
        await staffApi.create(formData);
        toast({ title: '创建成功', description: '新员工已添加' });
      }
      
      setIsDialogOpen(false);
      loadStaffs();
    } catch (error) {
      console.error('Failed to save staff:', error);
      toast({
        title: '保存失败',
        description: '无法保存员工信息',
        variant: 'destructive',
      });
    }
  };

  // 更新员工状态
  const handleStatusChange = async (staff: Staff, newStatus: string) => {
    try {
      await staffApi.update(staff.id, { status: newStatus });
      toast({ title: '状态更新成功' });
      loadStaffs();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: '更新失败',
        variant: 'destructive',
      });
    }
  };

  // 删除员工
  const handleDelete = async () => {
    if (!deletingStaff) return;
    
    try {
      await staffApi.delete(deletingStaff.id);
      toast({ title: '删除成功', description: '员工已删除' });
      setIsDeleteDialogOpen(false);
      setDeletingStaff(null);
      loadStaffs();
    } catch (error) {
      console.error('Failed to delete staff:', error);
      toast({
        title: '删除失败',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">员工管理</h1>
          <p className="text-muted-foreground">管理清洁工、前台、管理员等员工</p>
        </div>
        <Button onClick={handleAdd}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加员工
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="搜索姓名或电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="员工类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="cleaner">清洁工</SelectItem>
                <SelectItem value="receptionist">前台</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
                <SelectItem value="maintenance">维护人员</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">在职</SelectItem>
                <SelectItem value="inactive">离职</SelectItem>
                <SelectItem value="on_leave">休假</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 员工列表 */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : staffs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无员工数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>日薪</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>入职日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffs.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {staff.avatar ? (
                          <img src={staff.avatar} alt={staff.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        {staff.name}
                      </div>
                    </TableCell>
                    <TableCell>{staff.phone}</TableCell>
                    <TableCell>
                      <Badge className={staffTypeMap[staff.staffType]?.color || ''}>
                        {staffTypeMap[staff.staffType]?.label || staff.staffType}
                      </Badge>
                    </TableCell>
                    <TableCell>฿{staff.dailyWage.toLocaleString()}</TableCell>
                    <TableCell>
                      <Select
                        value={staff.status}
                        onValueChange={(value) => handleStatusChange(staff, value)}
                      >
                        <SelectTrigger className="w-[100px] h-8">
                          <Badge className={statusMap[staff.status]?.color || ''}>
                            {statusMap[staff.status]?.label || staff.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">在职</SelectItem>
                          <SelectItem value="on_leave">休假</SelectItem>
                          <SelectItem value="inactive">离职</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {staff.hireDate ? new Date(staff.hireDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(staff)}>
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          setDeletingStaff(staff);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStaff ? '编辑员工' : '添加员工'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? '修改员工信息' : '填写新员工信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">电话 *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffType">员工类型 *</Label>
                <Select
                  value={formData.staffType}
                  onValueChange={(value) => setFormData({ ...formData, staffType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaner">清洁工</SelectItem>
                    <SelectItem value="receptionist">前台</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="maintenance">维护人员</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyWage">日薪 (泰铢)</Label>
                <Input
                  id="dailyWage"
                  type="number"
                  value={formData.dailyWage}
                  onChange={(e) => setFormData({ ...formData, dailyWage: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idNumber">身份证号</Label>
              <Input
                id="idNumber"
                value={formData.idNumber || ''}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">紧急联系人</Label>
                <Input
                  id="emergencyContact"
                  value={formData.emergencyContact || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">紧急联系电话</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyPhone || ''}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hireDate">入职日期</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate ? formData.hireDate.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={formData.remark || ''}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingStaff ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除员工 "{deletingStaff?.name}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
