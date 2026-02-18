import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Edit2, Trash2, GripVertical, Home, Waves, Building, Castle, Crown, Trees, Sun, Wheat, Tent, Mountain, Palmtree, Coffee } from 'lucide-react';
import { categoryApi, type Category, type CreateCategoryData } from '@/services/api';

const iconOptions = [
  { name: 'home', icon: Home },
  { name: 'waves', icon: Waves },
  { name: 'building', icon: Building },
  { name: 'castle', icon: Castle },
  { name: 'crown', icon: Crown },
  { name: 'trees', icon: Trees },
  { name: 'sun', icon: Sun },
  { name: 'wheat', icon: Wheat },
  { name: 'tent', icon: Tent },
  { name: 'mountain', icon: Mountain },
  { name: 'palmtree', icon: Palmtree },
  { name: 'coffee', icon: Coffee },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState<CreateCategoryData>({
    label: { zh: '', en: '', th: '' },
    icon: 'home',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await categoryApi.getAll();
      setCategories(response.data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      console.error('Categories API Error:', err);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.label.zh.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.label.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.label.th.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        label: { ...category.label },
        icon: category.icon,
        sortOrder: category.sortOrder,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        label: { zh: '', en: '', th: '' },
        icon: 'home',
        sortOrder: categories.length + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, formData);
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id ? { ...cat, ...formData } : cat
          )
        );
      } else {
        const response = await categoryApi.create(formData);
        setCategories((prev) => [...prev, response.data]);
      }
      setIsDialogOpen(false);
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      await categoryApi.delete(deletingCategory.id);
      setCategories((prev) => prev.filter((cat) => cat.id !== deletingCategory.id));
      setIsDeleteDialogOpen(false);
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleToggleActive = async (category: Category) => {
    const updatedCategory = { ...category, isActive: !category.isActive };
    try {
      await categoryApi.update(category.id, updatedCategory);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === category.id ? updatedCategory : cat
        )
      );
    } catch (err) {
      alert('更新失败');
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.name === iconName);
    return iconOption?.icon || Home;
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
        <h1 className="text-2xl font-semibold">分类管理</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="搜索分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-champagne hover:bg-champagne-dark"
          >
            <Plus size={18} className="mr-2" />
            添加分类
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">总分类数</p>
            <p className="text-2xl font-semibold mt-1">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">已启用</p>
            <p className="text-2xl font-semibold mt-1 text-green-600">
              {categories.filter((c) => c.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">已禁用</p>
            <p className="text-2xl font-semibold mt-1 text-gray-500">
              {categories.filter((c) => !c.isActive).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">排序</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">图标</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">中文名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">英文名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">泰文名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      暂无分类数据
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => {
                    const IconComponent = getIconComponent(category.icon);
                    return (
                      <tr key={category.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <GripVertical size={16} className="text-gray-400" />
                            <span className="text-sm">{category.sortOrder}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center">
                            <IconComponent size={20} className="text-champagne" />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">{category.label.zh}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{category.label.en}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{category.label.th}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(category)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              category.isActive
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category.isActive ? '启用' : '禁用'}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(category)}
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600"
                              onClick={() => {
                                setDeletingCategory(category);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑分类' : '添加分类'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? '修改分类信息' : '创建新的房源分类'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>中文名称</Label>
                <Input
                  value={formData.label.zh}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: { ...prev.label, zh: e.target.value } }))
                  }
                  placeholder="如：海景"
                />
              </div>
              <div>
                <Label>英文名称</Label>
                <Input
                  value={formData.label.en}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: { ...prev.label, en: e.target.value } }))
                  }
                  placeholder="如：Beach"
                />
              </div>
              <div>
                <Label>泰文名称</Label>
                <Input
                  value={formData.label.th}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: { ...prev.label, th: e.target.value } }))
                  }
                  placeholder="如：ชายหาด"
                />
              </div>
            </div>
            <div>
              <Label>图标</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {iconOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.name}
                      onClick={() => setFormData((prev) => ({ ...prev, icon: option.name }))}
                      className={`p-3 rounded-lg border transition-colors ${
                        formData.icon === option.name
                          ? 'border-champagne bg-champagne/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} className={formData.icon === option.name ? 'text-champagne' : 'text-gray-600'} />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>排序</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                }
                placeholder="数字越小越靠前"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-champagne hover:bg-champagne-dark"
              disabled={!formData.label.zh || !formData.label.en || !formData.label.th}
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除分类</DialogTitle>
            <DialogDescription>
              确定要删除分类 "{deletingCategory?.label.zh}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
