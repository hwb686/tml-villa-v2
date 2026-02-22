import { useState, useEffect } from 'react';
import { promotionApi } from '@/services/api';
import type { Promotion } from '@/services/api';

const PROMOTION_TYPES = [
  { value: 'discount', label: '折扣活动', description: '限时折扣优惠' },
  { value: 'special', label: '特价活动', description: '特价促销' },
  { value: 'bundle', label: '套餐活动', description: '组合套餐优惠' },
];

const APPLICABLE_TYPES = [
  { value: 'all', label: '全部适用' },
  { value: 'homestay', label: '仅民宿' },
  { value: 'car', label: '仅租车' },
  { value: 'meal', label: '仅餐饮' },
  { value: 'ticket', label: '仅票务' },
];

export default function Promotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState({ status: '', applicableType: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'discount' as 'discount' | 'special' | 'bundle',
    discountValue: 0,
    discountType: 'percent' as 'percent' | 'cash',
    applicableType: 'all' as 'all' | 'homestay' | 'car' | 'meal' | 'ticket',
    applicableIds: '',
    startTime: '',
    endTime: '',
    image: '',
    bannerText: '',
  });

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const result = await promotionApi.getList({
        ...filter,
        page,
        pageSize,
      });
      if (result.success) {
        setPromotions(result.data.list);
        setTotal(result.data.total);
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [page, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPromotion) {
        await promotionApi.update(editingPromotion.id, formData);
      } else {
        await promotionApi.create(formData);
      }
      setShowModal(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (err) {
      console.error('Error saving promotion:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个促销活动吗？')) return;
    try {
      await promotionApi.delete(id);
      fetchPromotions();
    } catch (err) {
      console.error('Error deleting promotion:', err);
      alert('删除失败');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      type: promotion.type,
      discountValue: promotion.discountValue,
      discountType: promotion.discountType,
      applicableType: promotion.applicableType,
      applicableIds: promotion.applicableIds || '',
      startTime: new Date(promotion.startTime).toISOString().slice(0, 16),
      endTime: new Date(promotion.endTime).toISOString().slice(0, 16),
      image: promotion.image || '',
      bannerText: promotion.bannerText || '',
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (promotion: Promotion) => {
    try {
      const newStatus = promotion.status === 'active' ? 'inactive' : 'active';
      await promotionApi.update(promotion.id, { status: newStatus });
      fetchPromotions();
    } catch (err) {
      console.error('Error toggling promotion status:', err);
      alert('操作失败');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'discount',
      discountValue: 0,
      discountType: 'percent',
      applicableType: 'all',
      applicableIds: '',
      startTime: '',
      endTime: '',
      image: '',
      bannerText: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      active: '进行中',
      inactive: '已停用',
      expired: '已过期',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || styles.inactive}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeLabel = (type: string) => {
    const found = PROMOTION_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  const getApplicableLabel = (type: string) => {
    const found = APPLICABLE_TYPES.find(t => t.value === type);
    return found?.label || type;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">促销活动管理</h1>
          <p className="text-gray-500 mt-1">创建和管理促销活动</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingPromotion(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建促销活动
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">进行中</option>
            <option value="inactive">已停用</option>
            <option value="expired">已过期</option>
          </select>
          <select
            value={filter.applicableType}
            onChange={(e) => setFilter({ ...filter, applicableType: e.target.value })}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">全部适用类型</option>
            {APPLICABLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 促销活动列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无促销活动</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">活动名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">折扣</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">适用范围</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">横幅文案</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                    {promotion.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-1">{promotion.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTypeLabel(promotion.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {promotion.discountType === 'percent' 
                      ? `${promotion.discountValue}% 折扣` 
                      : `฿${promotion.discountValue} 减免`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getApplicableLabel(promotion.applicableType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(promotion.startTime).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">至 {new Date(promotion.endTime).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {promotion.bannerText && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {promotion.bannerText}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(promotion.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleToggleStatus(promotion)}
                      className={`mr-3 ${promotion.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {promotion.status === 'active' ? '停用' : '启用'}
                    </button>
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
            disabled={page >= Math.ceil(total / pageSize)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPromotion ? '编辑促销活动' : '创建促销活动'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="例如: 夏季特惠"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="活动详情说明"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    活动类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {PROMOTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="percent">百分比折扣</option>
                    <option value="cash">现金减免</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  折扣值 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">
                    {formData.discountType === 'percent' ? '%' : '฿'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适用范围</label>
                  <select
                    value={formData.applicableType}
                    onChange={(e) => setFormData({ ...formData, applicableType: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {APPLICABLE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">适用项目ID</label>
                  <input
                    type="text"
                    value={formData.applicableIds}
                    onChange={(e) => setFormData({ ...formData, applicableIds: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="多个ID用逗号分隔"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">活动图片</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="图片URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">横幅文案</label>
                <input
                  type="text"
                  value={formData.bannerText}
                  onChange={(e) => setFormData({ ...formData, bannerText: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="例如: 限时优惠，全场8折！"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPromotion ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
