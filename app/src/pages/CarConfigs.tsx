import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Plus, Edit, Trash2, Upload, X, Car, Users } from 'lucide-react';
import { carConfigApi, type CarConfig, type CreateCarConfigData } from '@/services/api';
import { uploadImage, deleteImage } from '@/lib/supabase';

// 预定义车型
const CAR_TYPES = ['SUV', '轿车', '电动车', 'MPV', '跑车', '其他'];

export default function CarConfigs() {
  const [configs, setConfigs] = useState<CarConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<CarConfig | null>(null);
  const [formData, setFormData] = useState<CreateCarConfigData>({
    name: '',
    description: '',
    image: '',
    price: 0,
    carType: '轿车',
    seats: 5,
    sortOrder: 0,
  });
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const response = await carConfigApi.getAll();
      setConfigs(response.data);
    } catch (err) {
      console.error('Error fetching car configs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConfigs = configs.filter((config) =>
    config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.carType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedConfig(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      price: 0,
      carType: '轿车',
      seats: 5,
      sortOrder: 0,
    });
    setSaveError('');
    setIsEditDialogOpen(true);
  };

  const handleEdit = (config: CarConfig) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      description: config.description || '',
      image: config.image,
      price: config.price,
      carType: config.carType,
      seats: config.seats,
      sortOrder: config.sortOrder,
    });
    setSaveError('');
    setIsEditDialogOpen(true);
  };

  const handleDelete = (config: CarConfig) => {
    setSelectedConfig(config);
    setIsDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件大小
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    setSaveError('');
    try {
      // 直接上传到Supabase
      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, image: imageUrl });
    } catch (err: any) {
      console.error('Upload error:', err);
      setSaveError(err.message || '图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaveError('');
    
    if (!formData.name.trim()) {
      setSaveError('请输入车辆名称');
      return;
    }
    if (!formData.image) {
      setSaveError('请上传车辆图片');
      return;
    }
    if (formData.price <= 0) {
      setSaveError('价格必须大于0');
      return;
    }
    if (formData.seats < 1) {
      setSaveError('座位数必须大于0');
      return;
    }

    try {
      if (selectedConfig) {
        await carConfigApi.update(selectedConfig.id, formData);
      } else {
        await carConfigApi.create(formData);
      }
      setIsEditDialogOpen(false);
      fetchConfigs();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || '保存失败，请检查网络连接');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedConfig) return;
    try {
      // 先删除Supabase Storage中的图片
      if (selectedConfig.image) {
        await deleteImage(selectedConfig.image);
      }
      // 再删除数据库记录
      await carConfigApi.delete(selectedConfig.id);
      setIsDeleteDialogOpen(false);
      fetchConfigs();
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleToggleActive = async (config: CarConfig) => {
    try {
      await carConfigApi.update(config.id, { isActive: !config.isActive });
      fetchConfigs();
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
        <h1 className="text-2xl font-semibold">车辆配置</h1>
        <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
          <Plus size={18} className="mr-2" />新增车辆
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="搜索车辆名称或类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConfigs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            暂无车辆配置
          </div>
        ) : (
          filteredConfigs.map((config) => (
            <Card key={config.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {config.image ? (
                  <img src={config.image} alt={config.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Car size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge className={config.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {config.isActive ? '上架中' : '已下架'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{config.carType}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users size={12} />
                    {config.seats}座
                  </Badge>
                </div>
                <h3 className="font-medium text-lg mb-1">{config.name}</h3>
                <p className="text-lg font-semibold text-green-600 mb-2">฿{config.price}/天</p>
                <p className="text-sm text-gray-500 whitespace-pre-wrap mb-3">{config.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(config)}>
                    <Edit size={14} className="mr-1" />编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleActive(config)}
                  >
                    {config.isActive ? '下架' : '上架'}
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(config)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedConfig ? '编辑车辆' : '新增车辆'}</DialogTitle>
            <DialogDescription>配置车辆信息</DialogDescription>
          </DialogHeader>
          
          {saveError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {saveError}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>车辆图片 <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500">支持 JPG、PNG 格式，原始图片建议不超过 10MB，系统会自动压缩优化</p>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              {formData.image ? (
                <div className="relative">
                  <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">点击上传图片</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>车辆名称 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：丰田凯美瑞"
              />
            </div>

            <div className="space-y-2">
              <Label>车型 <span className="text-red-500">*</span></Label>
              <select
                value={formData.carType}
                onChange={(e) => setFormData({ ...formData, carType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {CAR_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>价格（泰铢/天） <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>座位数 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.seats}
                  onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="车辆配置描述..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={uploading}>
              {uploading ? '上传中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除车辆</DialogTitle>
            <DialogDescription>确定要删除车辆 "{selectedConfig?.name}" 吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
