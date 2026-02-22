import { useState, useEffect } from 'react';
import { couponApi } from '@/services/api';
import type { Coupon } from '@/services/api';

const COUPON_TYPES = [
  { value: 'cash', label: '现金券', description: '直接减免金额' },
  { value: 'percent', label: '百分比折扣', description: '按百分比减免' },
  { value: 'discount', label: '折扣券', description: '固定折扣金额' },
];

const APPLICABLE_TYPES = [
  { value: 'all', label: '全部适用' },
  { value: 'homestay', label: '仅民宿' },
  { value: 'car', label: '仅租车' },
  { value: 'meal', label: '仅餐饮' },
  { value: 'ticket', label: '仅票务' },
];

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filter, setFilter] = useState({ status: '', applicableType: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'cash' as 'cash' | 'percent' | 'discount',
    value: 0,
    minAmount: 0,
    maxDiscount: 0,
    totalCount: 0,
    perUserLimit: 1,
    startTime: '',
    endTime: '',
    applicableType: 'all' as 'all' | 'homestay' | 'car' | 'meal' | 'ticket',
    applicableIds: '',
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const result = await couponApi.getList({
        ...filter,
        page,
        pageSize,
      });
      if (result.success) {
        setCoupons(result.data.list);
        setTotal(result.data.total);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, filter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await couponApi.update(editingCoupon.id, formData);
      } else {
        await couponApi.create(formData);
      }
      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err) {
      console.error('Error saving coupon:', err);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个优惠券吗？')) return;
    try {
      await couponApi.delete(id);
      fetchCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('删除失败');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      maxDiscount: coupon.maxDiscount || 0,
      totalCount: coupon.totalCount,
      perUserLimit: coupon.perUserLimit,
      startTime: new Date(coupon.startTime).toISOString().slice(0, 16),
      endTime: new Date(coupon.endTime).toISOString().slice(0, 16),
      applicableType: coupon.applicableType,
      applicableIds: coupon.applicableIds || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'cash',
      value: 0,
      minAmount: 0,
      maxDiscount: 0,
      totalCount: 0,
      perUserLimit: 1,
      startTime: '',
      endTime: '',
      applicableType: 'all',
      applicableIds: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      active: '生效中',
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
    const found = COUPON_TYPES.find(t => t.value === type);
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
          <h1 className="text-2xl font-bold text-gray-900">优惠券管理</h1>
          <p className="text-gray-500 mt-1">创建和管理优惠券</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCoupon(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建优惠券
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
            <option value="active">生效中</option>
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

      {/* 优惠券列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无优惠券</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">优惠券代码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">折扣值</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最低消费</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用情况</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有效期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">适用范围</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getTypeLabel(coupon.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coupon.type === 'percent' ? `${coupon.value}%` : `฿${coupon.value}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">฿{coupon.minAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {coupon.usedCount}/{coupon.totalCount || '∞'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(coupon.startTime).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">至 {new Date(coupon.endTime).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getApplicableLabel(coupon.applicableType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(coupon.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
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
              {editingCoupon ? '编辑优惠券' : '创建优惠券'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优惠券代码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="例如: SUMMER2024"
                    required
                    disabled={!!editingCoupon}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优惠券名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="例如: 夏季促销优惠券"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="优惠券使用说明"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    优惠券类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {COUPON_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣值 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2"
                      min="0"
                      required
                    />
                    <span className="absolute right-3 top-2 text-gray-500">
                      {formData.type === 'percent' ? '%' : '฿'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低消费金额</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2"
                      min="0"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">฿</span>
                  </div>
                </div>
                {formData.type === 'percent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最大折扣金额</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.maxDiscount}
                        onChange={(e) => setFormData({ ...formData, maxDiscount: parseInt(e.target.value) || 0 })}
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">฿</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">发行总量</label>
                  <input
                    type="number"
                    value={formData.totalCount}
                    onChange={(e) => setFormData({ ...formData, totalCount: parseInt(e.target.value) || 0 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="0"
                    placeholder="0 表示无限制"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">每人限用次数</label>
                  <input
                    type="number"
                    value={formData.perUserLimit}
                    onChange={(e) => setFormData({ ...formData, perUserLimit: parseInt(e.target.value) || 1 })}
                    className="w-full border rounded-lg px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    生效时间 <span className="text-red-500">*</span>
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
                    失效时间 <span className="text-red-500">*</span>
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

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
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
                  {editingCoupon ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
