import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Eye, Check, X, Ban, RotateCcw, Users } from 'lucide-react';
import { adminMerchantApi, type Merchant } from '@/services/api';

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-800' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800' },
  suspended: { label: '已暂停', color: 'bg-gray-100 text-gray-800' },
};

export default function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'suspend' | 'restore'>('approve');
  const [actionReason, setActionReason] = useState('');
  const [commission, setCommission] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchMerchants();
    fetchStats();
  }, [page, statusFilter]);

  const fetchMerchants = async () => {
    try {
      setIsLoading(true);
      const response = await adminMerchantApi.getList({
        page,
        pageSize: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      setMerchants(response.data.list);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Merchants API Error:', err);
      setMerchants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminMerchantApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Stats API Error:', err);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMerchants();
  };

  const handleAction = async () => {
    if (!selectedMerchant) return;
    
    try {
      switch (actionType) {
        case 'approve':
          await adminMerchantApi.approve(selectedMerchant.id, commission);
          break;
        case 'reject':
          await adminMerchantApi.reject(selectedMerchant.id, actionReason);
          break;
        case 'suspend':
          await adminMerchantApi.suspend(selectedMerchant.id, actionReason);
          break;
        case 'restore':
          await adminMerchantApi.restore(selectedMerchant.id);
          break;
      }
      setIsActionDialogOpen(false);
      setActionReason('');
      setCommission(10);
      fetchMerchants();
      fetchStats();
    } catch (err) {
      alert('操作失败');
    }
  };

  const openActionDialog = (merchant: Merchant, type: 'approve' | 'reject' | 'suspend' | 'restore') => {
    setSelectedMerchant(merchant);
    setActionType(type);
    setActionReason('');
    setCommission(merchant.commission || 10);
    setIsActionDialogOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">商家管理</h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总商家数</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⏳</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">待审核</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已通过</p>
                <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('suspended')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Ban className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已暂停</p>
                <p className="text-2xl font-semibold text-gray-600">{stats.suspended}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="搜索商家名称、电话或邮箱..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10" 
              />
            </div>
            <Button onClick={handleSearch}>搜索</Button>
            {statusFilter && (
              <Button variant="outline" onClick={() => { setStatusFilter(''); setSearchQuery(''); fetchMerchants(); }}>
                清除筛选
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 商家列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">商家名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">联系电话</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">邮箱</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">佣金</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">申请时间</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {merchants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      暂无商家数据
                    </td>
                  </tr>
                ) : (
                  merchants.map((merchant) => (
                    <tr key={merchant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{merchant.name}</td>
                      <td className="px-4 py-3">{merchant.phone}</td>
                      <td className="px-4 py-3">{merchant.email || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge className={statusMap[merchant.status]?.color}>
                          {statusMap[merchant.status]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{merchant.commission}%</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(merchant.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedMerchant(merchant); setIsDetailOpen(true); }}
                          >
                            <Eye size={16} className="mr-1" /> 查看
                          </Button>
                          {merchant.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => openActionDialog(merchant, 'approve')}
                              >
                                <Check size={16} className="mr-1" /> 通过
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => openActionDialog(merchant, 'reject')}
                              >
                                <X size={16} className="mr-1" /> 拒绝
                              </Button>
                            </>
                          )}
                          {merchant.status === 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                              onClick={() => openActionDialog(merchant, 'suspend')}
                            >
                              <Ban size={16} className="mr-1" /> 暂停
                            </Button>
                          )}
                          {merchant.status === 'suspended' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => openActionDialog(merchant, 'restore')}
                            >
                              <RotateCcw size={16} className="mr-1" /> 恢复
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 商家详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>商家详情</DialogTitle>
          </DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">商家名称</Label>
                  <p className="font-medium">{selectedMerchant.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">状态</Label>
                  <p>
                    <Badge className={statusMap[selectedMerchant.status]?.color}>
                      {statusMap[selectedMerchant.status]?.label}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">联系电话</Label>
                  <p>{selectedMerchant.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-500">邮箱</Label>
                  <p>{selectedMerchant.email || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">佣金比例</Label>
                  <p>{selectedMerchant.commission}%</p>
                </div>
                <div>
                  <Label className="text-gray-500">银行名称</Label>
                  <p>{selectedMerchant.bankName || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">银行账号</Label>
                  <p>{selectedMerchant.bankAccount || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">商家介绍</Label>
                  <p className="whitespace-pre-wrap">{selectedMerchant.description || '-'}</p>
                </div>
                {selectedMerchant.rejectReason && (
                  <div className="col-span-2">
                    <Label className="text-red-500">拒绝原因</Label>
                    <p className="text-red-600">{selectedMerchant.rejectReason}</p>
                  </div>
                )}
                <div>
                  <Label className="text-gray-500">申请时间</Label>
                  <p>{formatDate(selectedMerchant.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">更新时间</Label>
                  <p>{formatDate(selectedMerchant.updatedAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 操作确认弹窗 */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && '审核通过'}
              {actionType === 'reject' && '审核拒绝'}
              {actionType === 'suspend' && '暂停商家'}
              {actionType === 'restore' && '恢复商家'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && `确定要通过商家「${selectedMerchant?.name}」的入驻申请吗？`}
              {actionType === 'reject' && `确定要拒绝商家「${selectedMerchant?.name}」的入驻申请吗？`}
              {actionType === 'suspend' && `确定要暂停商家「${selectedMerchant?.name}」吗？暂停后商家将无法正常营业。`}
              {actionType === 'restore' && `确定要恢复商家「${selectedMerchant?.name}」吗？`}
            </DialogDescription>
          </DialogHeader>
          
          {actionType === 'approve' && (
            <div className="py-4">
              <Label htmlFor="commission">佣金比例 (%)</Label>
              <Input
                id="commission"
                type="number"
                min={0}
                max={100}
                value={commission}
                onChange={(e) => setCommission(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">平台从商家订单中抽取的佣金百分比</p>
            </div>
          )}
          
          {(actionType === 'reject' || actionType === 'suspend') && (
            <div className="py-4">
              <Label htmlFor="reason">原因</Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="请输入原因..."
                className="mt-1"
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>取消</Button>
            <Button 
              className={
                actionType === 'approve' || actionType === 'restore' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }
              onClick={handleAction}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
