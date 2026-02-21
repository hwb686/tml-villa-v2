import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit, Trash2, Upload, X, Home, Star, Settings } from 'lucide-react';
import { homestayApi, type Homestay, type CreateHomestayData } from '@/services/api';
import { PlatformMappingManager } from '@/components/PlatformMappingManager';
import { uploadImage, deleteImages } from '@/lib/supabase';

// 预定义民宿类型
const HOMESTAY_TYPES = ['城市', '海景', '别墅', '豪华', '木屋', '热带', '历史'];

// 预定义设施
const AMENITIES_OPTIONS = ['WiFi', '空调', '游泳池', '健身房', '停车场', '厨房', '海景', '私人泳池', '花园', '洗衣机', '电视', '冰箱'];

export default function HomestayManage() {
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHomestay, setSelectedHomestay] = useState<Homestay | null>(null);
  const [formData, setFormData] = useState<CreateHomestayData>({
    title: '',
    location: '',
    price: 0,
    images: [],
    type: '城市',
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [],
    description: '',
  });
  const [saveError, setSaveError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHomestays();
  }, []);

  const fetchHomestays = async () => {
    try {
      setIsLoading(true);
      const response = await homestayApi.getAll();
      setHomestays(response.data);
    } catch (err) {
      console.error('Error fetching homestays:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHomestays = homestays.filter((h) =>
    h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedHomestay(null);
    setFormData({
      title: '',
      location: '',
      price: 0,
      images: [],
      type: '城市',
      guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      amenities: [],
      description: '',
    });
    setSaveError('');
    setIsEditDialogOpen(true);
  };

  const handleEdit = (homestay: Homestay) => {
    setSelectedHomestay(homestay);
    setFormData({
      title: homestay.title,
      location: homestay.location,
      price: homestay.price,
      images: homestay.images,
      type: homestay.type,
      guests: homestay.guests,
      bedrooms: homestay.bedrooms,
      beds: homestay.beds,
      bathrooms: homestay.bathrooms,
      amenities: homestay.amenities,
      description: homestay.description || '',
    });
    setSaveError('');
    setIsEditDialogOpen(true);
  };

  const handleDelete = (homestay: Homestay) => {
    setSelectedHomestay(homestay);
    setIsDeleteDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setSaveError('');
    
    try {
      const newImageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 验证文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
          setSaveError(`第 ${i + 1} 张图片超过5MB限制`);
          continue;
        }
        
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          setSaveError(`第 ${i + 1} 个文件不是图片格式`);
          continue;
        }
        
        // 直接上传到Supabase
        const imageUrl = await uploadImage(file);
        newImageUrls.push(imageUrl);
      }
      
      if (newImageUrls.length > 0) {
        setFormData({ ...formData, images: [...formData.images, ...newImageUrls] });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setSaveError(err.message || '图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const toggleAmenity = (amenity: string) => {
    if (formData.amenities.includes(amenity)) {
      setFormData({
        ...formData,
        amenities: formData.amenities.filter((a) => a !== amenity),
      });
    } else {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenity],
      });
    }
  };

  const handleSave = async () => {
    setSaveError('');
    
    if (!formData.title.trim()) {
      setSaveError('请输入民宿名称');
      return;
    }
    if (!formData.location.trim()) {
      setSaveError('请输入位置');
      return;
    }
    if (formData.images.length === 0) {
      setSaveError('请至少上传一张图片');
      return;
    }
    if (formData.price <= 0) {
      setSaveError('价格必须大于0');
      return;
    }

    try {
      if (selectedHomestay) {
        await homestayApi.update(selectedHomestay.id, formData);
      } else {
        await homestayApi.create(formData);
      }
      setIsEditDialogOpen(false);
      fetchHomestays();
    } catch (err: any) {
      console.error('Save error:', err);
      setSaveError(err.message || '保存失败，请检查网络连接');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedHomestay) return;
    try {
      // 先删除Supabase Storage中的图片
      if (selectedHomestay.images && selectedHomestay.images.length > 0) {
        await deleteImages(selectedHomestay.images);
      }
      // 再删除数据库记录
      await homestayApi.delete(selectedHomestay.id);
      setIsDeleteDialogOpen(false);
      fetchHomestays();
    } catch (err) {
      alert('删除失败');
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">民宿管理</h1>
        <Button onClick={handleCreate} className="bg-champagne hover:bg-champagne-dark">
          <Plus size={18} className="mr-2" />新增民宿
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="搜索民宿名称或位置..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHomestays.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            暂无民宿数据
          </div>
        ) : (
          filteredHomestays.map((homestay) => (
            <Card key={homestay.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                {homestay.images[0] ? (
                  <img src={homestay.images[0]} alt={homestay.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Home size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge className="bg-champagne text-white">
                    <Star size={12} className="mr-1" />
                    {homestay.rating}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{homestay.type}</Badge>
                  <span className="text-lg font-semibold text-champagne">฿{homestay.price}/晚</span>
                </div>
                <h3 className="font-medium text-lg mb-1 line-clamp-1">{homestay.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{homestay.location}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {homestay.guests}位客人 · {homestay.bedrooms}间卧室 · {homestay.beds}张床
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(homestay)}>
                    <Edit size={14} className="mr-1" />编辑
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(homestay)}>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHomestay ? '编辑民宿' : '新增民宿'}</DialogTitle>
            <DialogDescription>配置民宿信息</DialogDescription>
          </DialogHeader>
          
          {saveError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {saveError}
            </div>
          )}
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="platform" disabled={!selectedHomestay}>平台映射</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 py-4">
            {/* Images Upload */}
            <div className="space-y-2">
              <Label>民宿图片 <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500">支持 JPG、PNG 格式，单张图片不超过 5MB，直接上传到云端存储</p>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="grid grid-cols-4 gap-2">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square">
                    <img src={img} alt={`Image ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-champagne transition-colors"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-champagne"></div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">上传</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>民宿名称 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="如：曼谷市中心豪华公寓"
                />
              </div>
              <div className="space-y-2">
                <Label>位置 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="如：曼谷，素坤逸区"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {HOMESTAY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>价格 (฿/晚) <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="如：3500"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>客人数量</Label>
                <Input
                  type="number"
                  value={formData.guests || ''}
                  onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div className="space-y-2">
                <Label>卧室数量</Label>
                <Input
                  type="number"
                  value={formData.bedrooms || ''}
                  onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>床铺数量</Label>
                <Input
                  type="number"
                  value={formData.beds || ''}
                  onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>浴室数量</Label>
                <Input
                  type="number"
                  value={formData.bathrooms || ''}
                  onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>设施</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES_OPTIONS.map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      formData.amenities.includes(amenity)
                        ? 'bg-champagne text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="民宿详细描述..."
                rows={4}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="platform" className="pt-4">
            {selectedHomestay && (
              <PlatformMappingManager homestayId={selectedHomestay.id} />
            )}
          </TabsContent>
        </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              {uploading ? '上传中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个民宿吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}