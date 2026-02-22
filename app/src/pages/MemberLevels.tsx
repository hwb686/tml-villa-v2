import React, { useState, useEffect } from 'react';
import { adminMembershipApi } from '../services/api';
import type { MemberLevel } from '../services/api';

const MemberLevels: React.FC = () => {
  const [levels, setLevels] = useState<(MemberLevel & { userCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    minPoints: 0,
    maxPoints: 0,
    discount: 0,
    pointsRate: 1,
    icon: '',
    color: '#CD7F32',
    benefits: '',
    sortOrder: 0,
  });

  // 加载等级列表
  const loadLevels = async () => {
    try {
      setLoading(true);
      const response = await adminMembershipApi.getLevels();
      if (response.success) {
        setLevels(response.data);
      }
    } catch (error) {
      console.error('加载会员等级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  // 打开编辑对话框
  const handleEdit = (level: MemberLevel) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      nameEn: level.nameEn,
      minPoints: level.minPoints,
      maxPoints: level.maxPoints,
      discount: level.discount,
      pointsRate: level.pointsRate,
      icon: level.icon || '',
      color: level.color || '#CD7F32',
      benefits: level.benefits || '',
      sortOrder: level.sortOrder,
    });
    setIsCreating(false);
    setShowDialog(true);
  };

  // 打开创建对话框
  const handleCreate = () => {
    setEditingLevel(null);
    setFormData({
      name: '',
      nameEn: '',
      minPoints: 0,
      maxPoints: 0,
      discount: 0,
      pointsRate: 1,
      icon: '',
      color: '#CD7F32',
      benefits: '',
      sortOrder: levels.length + 1,
    });
    setIsCreating(true);
    setShowDialog(true);
  };

  // 保存等级
  const handleSave = async () => {
    try {
      if (isCreating) {
        const response = await adminMembershipApi.createLevel({
          ...formData,
          benefits: formData.benefits,
        });
        if (response.success) {
          alert('创建成功');
          setShowDialog(false);
          loadLevels();
        }
      } else if (editingLevel) {
        const response = await adminMembershipApi.updateLevel(editingLevel.id, formData);
        if (response.success) {
          alert('更新成功');
          setShowDialog(false);
          loadLevels();
        }
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    }
  };

  // 删除等级
  const handleDelete = async (level: MemberLevel & { userCount: number }) => {
    if (level.userCount > 0) {
      alert(`无法删除，有 ${level.userCount} 个用户正在使用该等级`);
      return;
    }
    
    if (!confirm(`确定要删除等级「${level.name}」吗？`)) {
      return;
    }
    
    try {
      const response = await adminMembershipApi.deleteLevel(level.id);
      if (response.success) {
        alert('删除成功');
        loadLevels();
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">会员等级管理</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新建等级
        </button>
      </div>

      {/* 等级卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {levels.map((level) => (
          <div
            key={level.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden"
          >
            {/* 等级头部 */}
            <div
              className="p-4 text-white text-center"
              style={{ backgroundColor: level.color || '#CD7F32' }}
            >
              <div className="text-4xl mb-2">{level.icon}</div>
              <div className="text-xl font-bold">{level.name}</div>
              <div className="text-sm opacity-80">{level.nameEn}</div>
            </div>
            
            {/* 等级信息 */}
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">升级积分</span>
                <span className="font-medium">{level.minPoints.toLocaleString()} 分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">最高积分</span>
                <span className="font-medium">{level.maxPoints.toLocaleString()} 分</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">折扣</span>
                <span className="font-medium text-red-500">
                  {level.discount > 0 ? `${level.discount}% off` : '无折扣'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">积分倍率</span>
                <span className="font-medium">{level.pointsRate}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">用户数量</span>
                <span className="font-medium">{level.userCount} 人</span>
              </div>
              {level.benefits && (
                <div className="pt-2 border-t">
                  <div className="text-gray-500 mb-1">权益</div>
                  <div className="text-xs text-gray-600">
                    {(() => {
                      try {
                        const benefits = JSON.parse(level.benefits);
                        return benefits.map((b: string, i: number) => (
                          <div key={i}>• {b}</div>
                        ));
                      } catch {
                        return level.benefits;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            {/* 操作按钮 */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                onClick={() => handleEdit(level)}
                className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(level)}
                className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm"
                disabled={level.userCount > 0}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 编辑/创建对话框 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isCreating ? '新建会员等级' : '编辑会员等级'}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  等级名称（中文）
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如：普通会员"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  等级名称（英文）
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="如：Regular Member"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低积分
                  </label>
                  <input
                    type="number"
                    value={formData.minPoints}
                    onChange={(e) => setFormData({ ...formData, minPoints: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最高积分
                  </label>
                  <input
                    type="number"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData({ ...formData, maxPoints: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣百分比
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="如 5 表示 95折"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    积分倍率
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pointsRate}
                    onChange={(e) => setFormData({ ...formData, pointsRate: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    图标
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="如：🥉"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    颜色
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  权益描述（JSON数组格式）
                </label>
                <textarea
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder='["权益1", "权益2"]'
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  排序
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberLevels;
