import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  Server, 
  Database, 
  Globe, 
  Clock, 
  HardDrive,
  RefreshCw, 
  Play,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

// 服务图标映射
const serviceIcons: Record<string, React.ElementType> = {
  supabase: Database,
  netlify: Globe,
  render: Server,
};

// 资源类型图标映射
const resourceIcons: Record<string, React.ElementType> = {
  database: Database,
  bandwidth: Globe,
  storage: HardDrive,
  hours: Clock,
  buildMinutes: Clock,
};

// 服务名称映射
const serviceNames: Record<string, string> = {
  supabase: 'Supabase',
  netlify: 'Netlify',
  render: 'Render',
};

// 资源类型名称映射
const resourceTypeNames: Record<string, string> = {
  database: '数据库',
  bandwidth: '带宽',
  storage: '存储',
  hours: '运行时间',
  buildMinutes: '构建时间',
};

interface UsageStatus {
  id: string;
  service: string;
  resourceType: string;
  limitValue: number;
  unit: string;
  warningThreshold: number;
  criticalThreshold: number;
  description: string | null;
  current: {
    usedValue: number;
    percentage: number;
    status: 'normal' | 'warning' | 'critical';
    recordedAt: string | null;
  };
  trend: Array<{
    date: string;
    usedValue: number;
    percentage: number;
  }>;
}

interface UsageData {
  services: Record<string, UsageStatus[]>;
  summary: {
    total: number;
    normal: number;
    warning: number;
    critical: number;
    hasAlerts: boolean;
  };
}

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function fetchAdminApi(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminToken');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await res.json();
  if (data.code !== 200) {
    throw new Error(data.msg || '请求失败');
  }
  return data.data;
}

export default function UsageMonitor() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsageStatus = async () => {
    try {
      setError(null);
      const data = await fetchAdminApi('/api/usage/status');
      setUsageData(data);
    } catch (err: any) {
      setError(err.message || '获取使用量状态失败');
    }
  };

  const fetchAlerts = async () => {
    try {
      const data = await fetchAdminApi('/api/usage/alerts');
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsageStatus(), fetchAlerts()]);
    setRefreshing(false);
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      await fetchAdminApi('/api/usage/simulate', { method: 'POST' });
      await handleRefresh();
    } catch (err: any) {
      setError(err.message || '模拟数据生成失败');
    }
    setSimulating(false);
  };

  const handleCleanup = async () => {
    try {
      const result = await fetchAdminApi('/api/usage/logs/cleanup', { method: 'DELETE' });
      alert(result.msg || '清理完成');
    } catch (err: any) {
      setError(err.message || '清理失败');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsageStatus(), fetchAlerts()])
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 border-red-300';
      case 'warning': return 'bg-yellow-100 border-yellow-300';
      default: return 'bg-green-100 border-green-300';
    }
  };

  const getProgressColor = (percentage: number, warningThreshold: number, criticalThreshold: number) => {
    if (percentage >= criticalThreshold) return 'bg-red-500';
    if (percentage >= warningThreshold) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">免费额度监控</h1>
          <p className="text-gray-500 mt-1">监控 Supabase / Netlify / Render 免费额度使用情况</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button variant="outline" onClick={handleSimulate} disabled={simulating}>
            <Play className="w-4 h-4 mr-2" />
            模拟数据
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                清理日志
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清理</AlertDialogTitle>
                <AlertDialogDescription>
                  将删除30天前的使用量日志记录，此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleCleanup}>确认清理</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 预警概览 */}
      {usageData?.summary.hasAlerts && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">使用量预警</AlertTitle>
          <AlertDescription className="text-yellow-700">
            当前有 {usageData.summary.warning} 项资源接近限额，{usageData.summary.critical} 项资源即将超限
          </AlertDescription>
        </Alert>
      )}

      {/* 状态概览 */}
      {usageData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{usageData.summary.total}</div>
              <p className="text-sm text-gray-500">监控项目</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{usageData.summary.normal}</div>
              <p className="text-sm text-gray-500">状态正常</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{usageData.summary.warning}</div>
              <p className="text-sm text-gray-500">预警</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{usageData.summary.critical}</div>
              <p className="text-sm text-gray-500">严重</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预警列表 */}
      {alerts.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="w-5 h-5" />
              当前预警 ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${getStatusBgColor(alert.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(alert.status)}
                      <span className="font-medium">
                        {serviceNames[alert.service]} - {resourceTypeNames[alert.resourceType]}
                      </span>
                    </div>
                    <Badge variant={alert.status === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    已用: {alert.usedValue} {alert.unit} / 限额: {alert.limitValue} {alert.unit}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 各服务使用情况 */}
      {usageData && (
        <div className="space-y-6">
          {Object.entries(usageData.services).map(([service, items]) => {
            const ServiceIcon = serviceIcons[service] || Server;
            
            return (
              <Card key={service}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ServiceIcon className="w-5 h-5" />
                    {serviceNames[service] || service}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => {
                      const ResourceIcon = resourceIcons[item.resourceType] || Database;
                      const progressColor = getProgressColor(
                        item.current.percentage,
                        item.warningThreshold,
                        item.criticalThreshold
                      );
                      
                      return (
                        <div key={item.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ResourceIcon className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">
                                {resourceTypeNames[item.resourceType] || item.resourceType}
                              </span>
                              {item.current.status !== 'normal' && (
                                <Badge 
                                  variant={item.current.status === 'critical' ? 'destructive' : 'secondary'}
                                  className="ml-2"
                                >
                                  {item.current.status === 'critical' ? '严重' : '预警'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className={getStatusColor(item.current.status)}>
                                {item.current.percentage.toFixed(1)}%
                              </span>
                              <span>
                                ({item.current.usedValue} / {item.limitValue} {item.unit})
                              </span>
                            </div>
                          </div>
                          
                          {/* 进度条 */}
                          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                            {/* 预警阈值线 */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                              style={{ left: `${item.warningThreshold}%` }}
                            />
                            {/* 严重阈值线 */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                              style={{ left: `${item.criticalThreshold}%` }}
                            />
                            {/* 使用量进度 */}
                            <div 
                              className={`h-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${Math.min(item.current.percentage, 100)}%` }}
                            />
                          </div>
                          
                          {/* 阈值说明 */}
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>0%</span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                              预警 {item.warningThreshold}%
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-red-400 rounded-full" />
                              严重 {item.criticalThreshold}%
                            </span>
                          </div>

                          {/* 趋势图 */}
                          {item.trend.length > 1 && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                <TrendingUp className="w-3 h-3" />
                                最近7天趋势
                              </div>
                              <div className="flex items-end gap-1 h-8">
                                {item.trend.map((t, i) => (
                                  <div 
                                    key={i}
                                    className="flex-1 bg-blue-200 rounded-t"
                                    style={{ 
                                      height: `${Math.min(t.percentage, 100)}%`,
                                      backgroundColor: t.percentage >= item.criticalThreshold 
                                        ? '#ef4444' 
                                        : t.percentage >= item.warningThreshold 
                                          ? '#eab308' 
                                          : '#22c55e'
                                    }}
                                    title={`${t.date}: ${t.percentage.toFixed(1)}%`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 最后更新时间 */}
                          {item.current.recordedAt && (
                            <p className="text-xs text-gray-400">
                              最后更新: {new Date(item.current.recordedAt).toLocaleString('zh-CN')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 空状态 */}
      {usageData && usageData.summary.total === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">暂无使用量数据</p>
            <Button onClick={handleSimulate} disabled={simulating}>
              <Play className="w-4 h-4 mr-2" />
              生成模拟数据
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 服务限额说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">免费额度说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 font-medium text-blue-800 mb-2">
                <Database className="w-4 h-4" />
                Supabase
              </div>
              <ul className="text-blue-700 space-y-1 text-xs">
                <li>• 数据库: 500MB</li>
                <li>• 带宽: 5GB/月</li>
                <li>• 存储: 2GB</li>
              </ul>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 font-medium text-green-800 mb-2">
                <Globe className="w-4 h-4" />
                Netlify
              </div>
              <ul className="text-green-700 space-y-1 text-xs">
                <li>• 带宽: 100GB/月</li>
                <li>• 构建时间: 300分钟/月</li>
                <li>• 并发构建: 1个</li>
              </ul>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 font-medium text-purple-800 mb-2">
                <Server className="w-4 h-4" />
                Render
              </div>
              <ul className="text-purple-700 space-y-1 text-xs">
                <li>• 运行时间: 750小时/月</li>
                <li>• 内存: 512MB</li>
                <li>• 15分钟无活动休眠</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
