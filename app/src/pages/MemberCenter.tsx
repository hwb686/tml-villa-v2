import React, { useState, useEffect } from 'react';
import { membershipApi } from '../services/api';
import type { MemberLevel, PointLog, UserMembership } from '../services/api';

const MemberCenter: React.FC = () => {
  const [membershipInfo, setMembershipInfo] = useState<UserMembership | null>(null);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'levels'>('overview');
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  // 加载会员信息
  const loadMembershipInfo = async () => {
    try {
      const [infoRes, levelsRes] = await Promise.all([
        membershipApi.getMyInfo(),
        membershipApi.getLevels(),
      ]);
      
      if (infoRes.success) {
        setMembershipInfo(infoRes.data);
      }
      if (levelsRes.success) {
        setLevels(levelsRes.data);
      }
    } catch (error) {
      console.error('加载会员信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载积分记录
  const loadPointLogs = async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const response = await membershipApi.getPointLogs({ page, pageSize: 10 });
      if (response.success) {
        setPointLogs(response.data.list);
        setLogsTotal(response.data.total);
        setLogsPage(page);
      }
    } catch (error) {
      console.error('加载积分记录失败:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadMembershipInfo();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadPointLogs(1);
    }
  }, [activeTab]);

  // 计算升级进度
  const getProgressPercent = () => {
    if (!membershipInfo || !membershipInfo.level) return 0;
    
    const current = membershipInfo.totalPoints;
    const minPoints = membershipInfo.level.minPoints;
    const maxPoints = membershipInfo.level.maxPoints;
    
    return Math.min(100, ((current - minPoints) / (maxPoints - minPoints)) * 100);
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 积分类型标签
  const getPointTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      earn_order: { text: '订单获得', color: 'text-green-600' },
      earn_review: { text: '评价获得', color: 'text-green-600' },
      consume: { text: '积分消费', color: 'text-red-600' },
      admin: { text: '管理员调整', color: 'text-blue-600' },
      expire: { text: '积分过期', color: 'text-gray-600' },
    };
    return labels[type] || { text: type, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部会员卡片 */}
      <div 
        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 pb-12"
        style={{
          background: membershipInfo?.level?.color 
            ? `linear-gradient(135deg, ${membershipInfo.level.color}, ${membershipInfo.level.color}dd)`
            : undefined
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">{membershipInfo?.level?.icon || '🥉'}</div>
            <div>
              <div className="text-2xl font-bold">{membershipInfo?.level?.name || '普通会员'}</div>
              <div className="text-sm opacity-80">{membershipInfo?.level?.nameEn || 'Regular Member'}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">当前积分</div>
              <div className="text-3xl font-bold">{membershipInfo?.points?.toLocaleString() || 0}</div>
            </div>
            <div className="bg-white/20 rounded-lg p-4">
              <div className="text-sm opacity-80">累计积分</div>
              <div className="text-3xl font-bold">{membershipInfo?.totalPoints?.toLocaleString() || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 升级进度 */}
      {membershipInfo?.nextLevel && (
        <div className="max-w-4xl mx-auto px-4 -mt-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>距离升级到「{membershipInfo.nextLevel.name}」</span>
              <span>还需 {membershipInfo.pointsToNextLevel.toLocaleString()} 积分</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercent()}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 会员权益 */}
      {membershipInfo?.level?.benefits && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-gray-900 mb-3">当前等级权益</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(() => {
                try {
                  const benefits = JSON.parse(membershipInfo.level.benefits);
                  return benefits.map((benefit: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      {benefit}
                    </div>
                  ));
                } catch {
                  return null;
                }
              })()}
            </div>
            {membershipInfo.level.discount > 0 && (
              <div className="mt-3 pt-3 border-t text-sm">
                <span className="text-red-500 font-medium">{membershipInfo.level.discount}% 折扣</span>
                <span className="text-gray-500 ml-2">消费时自动享受优惠</span>
              </div>
            )}
            {membershipInfo.level.pointsRate > 1 && (
              <div className="mt-2 text-sm">
                <span className="text-blue-500 font-medium">{membershipInfo.level.pointsRate}x 积分倍率</span>
                <span className="text-gray-500 ml-2">消费时获得更多积分</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 标签页 */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            等级说明
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            积分记录
          </button>
          <button
            onClick={() => setActiveTab('levels')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'levels'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            等级对比
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="py-6">
          {/* 等级说明 */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">如何获取积分？</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
                    🛒
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">消费获得积分</div>
                    <div>每消费 1 元可获得 1 积分（会员等级越高，倍率越高）</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                    ⭐
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">评价获得积分</div>
                    <div>完成订单后发表评价可获得额外积分奖励</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                    🎁
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">活动奖励</div>
                    <div>参与平台活动可获得额外积分奖励</div>
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 mt-6 mb-4">积分有什么用？</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
                    💰
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">兑换优惠券</div>
                    <div>积分可兑换各类优惠券，享受更多折扣</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">升级会员等级</div>
                    <div>累计积分达到一定数量可升级会员等级，享受更多权益</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 积分记录 */}
          {activeTab === 'logs' && (
            <div>
              {logsLoading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : pointLogs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  暂无积分记录
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">时间</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">类型</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">积分</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">余额</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">备注</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pointLogs.map((log) => {
                        const typeInfo = getPointTypeLabel(log.type);
                        return (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{formatDate(log.createdAt)}</td>
                            <td className={`px-4 py-3 ${typeInfo.color}`}>{typeInfo.text}</td>
                            <td className={`px-4 py-3 font-medium ${log.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {log.points > 0 ? '+' : ''}{log.points}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{log.balance}</td>
                            <td className="px-4 py-3 text-gray-500">{log.remark || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* 分页 */}
                  {logsTotal > 10 && (
                    <div className="px-4 py-3 flex justify-center gap-2 border-t">
                      <button
                        onClick={() => loadPointLogs(logsPage - 1)}
                        disabled={logsPage === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        上一页
                      </button>
                      <span className="px-3 py-1">
                        {logsPage} / {Math.ceil(logsTotal / 10)}
                      </span>
                      <button
                        onClick={() => loadPointLogs(logsPage + 1)}
                        disabled={logsPage >= Math.ceil(logsTotal / 10)}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        下一页
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 等级对比 */}
          {activeTab === 'levels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {levels.map((level) => (
                <div
                  key={level.id}
                  className={`rounded-lg overflow-hidden ${
                    membershipInfo?.level?.id === level.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div
                    className="p-4 text-white text-center"
                    style={{ backgroundColor: level.color || '#CD7F32' }}
                  >
                    <div className="text-3xl mb-2">{level.icon}</div>
                    <div className="font-bold">{level.name}</div>
                    <div className="text-xs opacity-80">{level.nameEn}</div>
                    {membershipInfo?.level?.id === level.id && (
                      <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5 inline-block">
                        当前等级
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-4 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">升级积分</span>
                      <span className="font-medium">{level.minPoints.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-500">折扣</span>
                      <span className={`font-medium ${level.discount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {level.discount > 0 ? `${level.discount}% off` : '无'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">积分倍率</span>
                      <span className="font-medium">{level.pointsRate}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberCenter;
