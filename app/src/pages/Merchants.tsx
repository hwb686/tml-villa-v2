import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Eye, Edit, Power, PowerOff } from 'lucide-react';
import { merchantApi, type Merchant } from '@/services/api';

interface MerchantsProps { type?: 'homestay' | 'car' | 'ticket' | 'dining'; }

const merchantTypeMap: Record<string, { label: string; color: string }> = {
  homestay: { label: '民宿', color: '#C9A962' },
  car: { label: '租车', color: '#3B82F6' },
  ticket: { label: '票务', color: '#10B981' },
  dining: { label: '餐饮', color: '#F59E0B' },
};

export default function Merchants({ type }: MerchantsProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMerchants();
  }, [type]);

  const fetchMerchants = async () => {
    try {
      setIsLoading(true);
      const response = await merchantApi.getAll(type ? { type } : undefined);
      setMerchants(response.data);
    } catch (err) {
      console.error('Merchants API Error:', err);
      setMerchants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMerchants = merchants.filter((merchant) => 
    merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    merchant.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (merchant: Merchant) => {
    try {
      const newStatus = merchant.status === 'active' ? 'inactive' : 'active';
      await merchantApi.update(merchant.id, { status: newStatus });
      setMerchants((prev) => prev.map((m) => m.id === merchant.id ? { ...m, status: newStatus } : m));
      setIsToggleDialogOpen(false);
    } catch (err) {
      alert('操作失败');
    }
  };

  const getTypeTitle = () => {
    if (!type) return '全部商家';
    const typeNames: Record<string, string> = { homestay: '民宿管理', car: '租车管理', ticket: '票务管理', dining: '餐饮管理' };
    return typeNames[type];
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
        <h1 className="text-2xl font-semibold">{getTypeTitle()}</h1>
        <div className="flex items-center gap-3">
          <Button className="bg-champagne hover:bg-champagne-dark"><Plus size={18} className="mr-2" />新增商家</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">总商家数</p><p className="text-2xl font-semibold mt-1">{merchants.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">营业中</p><p className="text-2xl font-semibold mt-1 text-green-600">{merchants.filter((m) => m.status === 'active').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-gray-500">已下架</p><p className="text-2xl font-semibold mt-1 text-gray-500">{merchants.filter((m) => m.status === 'inactive').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input placeholder="搜索商家名称或联系人..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMerchants.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            暂无商家数据
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <Card key={merchant.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge style={{ backgroundColor: `${merchantTypeMap[merchant.type]?.color}20`, color: merchantTypeMap[merchant.type]?.color, border: 'none' }}>
                      {merchantTypeMap[merchant.type]?.label}
                    </Badge>
                    <Badge className={merchant.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-100'}>
                      {merchant.status === 'active' ? '营业中' : '已下架'}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-lg mb-2">{merchant.name}</h3>
                  <p className="text-sm text-gray-500 mb-1">{merchant.contact}</p>
                  <p className="text-sm text-gray-500 mb-3">{merchant.phone}</p>
                  <p className="text-sm text-gray-500">{merchant.email}</p>
                </div>
                <div className="flex border-t border-gray-100">
                  <Button variant="ghost" className="flex-1 rounded-none h-10 text-gray-600" onClick={() => { setSelectedMerchant(merchant); setIsDetailOpen(true); }}>
                    <Eye size={16} className="mr-2" />查看
                  </Button>
                  <Button variant="ghost" className="flex-1 rounded-none h-10 text-gray-600"><Edit size={16} className="mr-2" />编辑</Button>
                  <Button variant="ghost" className={`flex-1 rounded-none h-10 ${merchant.status === 'active' ? 'text-red-600' : 'text-green-600'}`} onClick={() => { setSelectedMerchant(merchant); setIsToggleDialogOpen(true); }}>
                    {merchant.status === 'active' ? <><PowerOff size={16} className="mr-2" />下架</> : <><Power size={16} className="mr-2" />上架</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>商家详情</DialogTitle><DialogDescription>查看商家详细信息</DialogDescription></DialogHeader>
          {selectedMerchant && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b"><span className="text-gray-500">商家ID</span><span className="font-medium">{selectedMerchant.id}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">商家名称</span><span className="font-medium">{selectedMerchant.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">类型</span>
                <Badge style={{ backgroundColor: `${merchantTypeMap[selectedMerchant.type]?.color}20`, color: merchantTypeMap[selectedMerchant.type]?.color, border: 'none' }}>
                  {merchantTypeMap[selectedMerchant.type]?.label}
                </Badge>
              </div>
              <div className="flex justify-between items-center"><span className="text-gray-500">联系人</span><span>{selectedMerchant.contact}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">联系电话</span><span>{selectedMerchant.phone}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">邮箱</span><span>{selectedMerchant.email}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">创建时间</span><span>{selectedMerchant.createdAt}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">状态</span>
                <Badge className={selectedMerchant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {selectedMerchant.status === 'active' ? '营业中' : '已下架'}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedMerchant?.status === 'active' ? '下架商家' : '上架商家'}</DialogTitle>
            <DialogDescription>{selectedMerchant?.status === 'active' ? `确定要下架商家 "${selectedMerchant?.name}" 吗？下架后用户将无法预订。` : `确定要上架商家 "${selectedMerchant?.name}" 吗？`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsToggleDialogOpen(false)}>取消</Button>
            <Button className={selectedMerchant?.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} onClick={() => selectedMerchant && handleToggleStatus(selectedMerchant)}>
              {selectedMerchant?.status === 'active' ? '确认下架' : '确认上架'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
