import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, MoreVertical, Eye, Edit, Ban, UserCheck, Save, X } from 'lucide-react';
import { userApi, type User } from '@/services/api';
import { Label } from '@/components/ui/label';

interface UserWithStatus extends User {
  status: 'active' | 'inactive';
  registerTime: string;
  orderCount: number;
}

// Mock users data
const mockUsers: UserWithStatus[] = [
  { id: 'U001', name: '张三', email: 'zhangsan@example.com', avatar: 'https://i.pravatar.cc/150?u=10', phone: '+86 138****1234', isHost: false, status: 'active', registerTime: '2024-01-15', orderCount: 5 },
  { id: 'U002', name: '李四', email: 'lisi@example.com', avatar: 'https://i.pravatar.cc/150?u=11', phone: '+86 139****5678', isHost: false, status: 'active', registerTime: '2024-02-20', orderCount: 3 },
  { id: 'U003', name: '王五', email: 'wangwu@example.com', avatar: 'https://i.pravatar.cc/150?u=12', phone: '+86 137****9012', isHost: true, status: 'inactive', registerTime: '2024-03-10', orderCount: 0 }
];

export default function Users() {
  const [users, setUsers] = useState<UserWithStatus[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithStatus | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getAll?.();
      if (response?.data) {
        // Transform User to UserWithStatus
        const transformedUsers: UserWithStatus[] = response.data.map((u: any) => ({
          ...u,
          status: (u.status as 'active' | 'inactive') || 'active',
          registerTime: u.registerTime || u.createdAt?.split('T')[0] || '2024-01-01',
          orderCount: u.orderCount || 0,
        }));
        setUsers(transformedUsers);
      } else {
        setUsers(mockUsers);
      }
    } catch (err) {
      console.error('Users API Error:', err);
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (user: UserWithStatus) => {
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    setIsDisableDialogOpen(false);
  };

  const handleEdit = (user: UserWithStatus) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, ...editForm } : u));
    setIsEditOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="搜索用户ID、姓名或邮箱..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-72" />
          </div>
          <Button className="bg-champagne hover:bg-champagne-dark">导出数据</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">总用户数</p><p className="text-2xl font-semibold mt-1">{users.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">活跃用户</p><p className="text-2xl font-semibold mt-1 text-green-600">{users.filter((u) => u.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">今日新增</p><p className="text-2xl font-semibold mt-1">0</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>用户列表</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户信息</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">联系方式</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">注册时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-champagne"></div>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{user.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                          <div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.phone || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.registerTime}</td>
                      <td className="py-3 px-4 text-sm">{user.orderCount}</td>
                      <td className="py-3 px-4">
                        <Badge className={user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                          {user.status === 'active' ? '启用' : '禁用'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical size={18} /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDetailOpen(true); }}><Eye size={16} className="mr-2" />查看详情</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => user && handleEdit(user)}><Edit size={16} className="mr-2" />编辑</DropdownMenuItem>
                            <DropdownMenuItem className={user.status === 'active' ? 'text-red-600' : 'text-green-600'} onClick={() => { setSelectedUser(user); setIsDisableDialogOpen(true); }}>
                              {user.status === 'active' ? <><Ban size={16} className="mr-2" />禁用账号</> : <><UserCheck size={16} className="mr-2" />启用账号</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">共 {filteredUsers.length} 条记录</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>上一页</Button>
              <Button variant="outline" size="sm" className="bg-champagne text-white hover:bg-champagne-dark">1</Button>
              <Button variant="outline" size="sm" disabled>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>用户详情</DialogTitle><DialogDescription>查看用户详细信息</DialogDescription></DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-16 h-16 rounded-full object-cover" />
                <div><p className="text-lg font-medium">{selectedUser.name}</p><p className="text-sm text-gray-500">{selectedUser.email}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div><p className="text-sm text-gray-500">用户ID</p><p className="text-sm font-medium">{selectedUser.id}</p></div>
                <div><p className="text-sm text-gray-500">手机号</p><p className="text-sm font-medium">{selectedUser.phone || '-'}</p></div>
                <div><p className="text-sm text-gray-500">注册时间</p><p className="text-sm font-medium">{selectedUser.registerTime}</p></div>
                <div><p className="text-sm text-gray-500">订单数</p><p className="text-sm font-medium">{selectedUser.orderCount}</p></div>
                <div><p className="text-sm text-gray-500">账号状态</p>
                  <Badge className={selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {selectedUser.status === 'active' ? '启用' : '禁用'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedUser?.status === 'active' ? '禁用账号' : '启用账号'}</DialogTitle>
            <DialogDescription>{selectedUser?.status === 'active' ? `确定要禁用用户 "${selectedUser?.name}" 的账号吗？禁用后该用户将无法登录。` : `确定要启用用户 "${selectedUser?.name}" 的账号吗？`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisableDialogOpen(false)}>取消</Button>
            <Button className={selectedUser?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} onClick={() => selectedUser && handleToggleStatus(selectedUser)}>
              {selectedUser?.status === 'active' ? '确认禁用' : '确认启用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>编辑用户信息</DialogTitle><DialogDescription>修改用户的基本信息</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">姓名</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">手机号</Label>
              <Input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}><X size={16} className="mr-2" />取消</Button>
            <Button className="bg-champagne hover:bg-champagne-dark" onClick={handleSaveEdit}><Save size={16} className="mr-2" />保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
