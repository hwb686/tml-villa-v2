import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, Settings, AlertCircle, Check, Loader2 } from 'lucide-react';
import { homestayApi, stockApi, type Homestay, type StockData, type StockDayInfo } from '@/services/api';

// 生成日历数据
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  // 添加上月空白
  const startPadding = firstDay.getDay();
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }
  
  // 添加当月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 获取库存状态颜色
const getStockStatus = (info: StockDayInfo | undefined): { color: string; label: string; emoji: string } => {
  if (!info) {
    return { color: 'bg-gray-100 text-gray-500', label: '未设置', emoji: '⚪' };
  }
  const available = info.available;
  if (available === 0) {
    return { color: 'bg-red-100 text-red-700', label: '满房', emoji: '🔴' };
  } else if (available === 1) {
    return { color: 'bg-yellow-100 text-yellow-700', label: '紧张', emoji: '🟡' };
  } else {
    return { color: 'bg-green-100 text-green-700', label: '充足', emoji: '🟢' };
  }
};

export default function StockManagement() {
  const [homestays, setHomestays] = useState<Homestay[]>([]);
  const [selectedHomestayId, setSelectedHomestayId] = useState<string>('');
  const [stockData, setStockData] = useState<StockData>({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  
  // 弹窗状态
  const [isInitDialogOpen, setIsInitDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initForm, setInitForm] = useState({ totalStock: 2, price: '' });
  const [editForm, setEditForm] = useState({ totalStock: 1, price: '', booked: 0 });
  const [error, setError] = useState('');

  // 加载民宿列表
  useEffect(() => {
    const fetchHomestays = async () => {
      try {
        const response = await homestayApi.getAll();
        setHomestays(response.data);
        if (response.data.length > 0) {
          setSelectedHomestayId(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch homestays:', err);
      }
    };
    fetchHomestays();
  }, []);

  // 加载库存数据
  useEffect(() => {
    if (!selectedHomestayId) return;
    
    const fetchStock = async () => {
      setIsLoading(true);
      try {
        const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const response = await stockApi.get(selectedHomestayId, { month: monthStr });
        setStockData(response.data);
      } catch (err) {
        console.error('Failed to fetch stock:', err);
        setStockData({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchStock();
  }, [selectedHomestayId, currentYear, currentMonth]);

  // 日历天数
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // 上个月
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // 下个月
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 点击日期
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatDate(date);
    const info = stockData[dateStr];
    setEditForm({
      totalStock: info?.total || 1,
      price: info?.price?.toString() || '',
      booked: info?.booked || 0,
    });
    setError('');
    setIsEditDialogOpen(true);
  };

  // 初始化库存
  const handleInitStock = async () => {
    if (!selectedHomestayId) return;
    if (initForm.totalStock < 1) {
      setError('库存数量必须大于0');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const price = initForm.price ? parseInt(initForm.price) : undefined;
      await stockApi.init(selectedHomestayId, {
        totalStock: initForm.totalStock,
        price,
      });
      setIsInitDialogOpen(false);
      // 重新加载库存
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const response = await stockApi.get(selectedHomestayId, { month: monthStr });
      setStockData(response.data);
    } catch (err: any) {
      setError(err.message || '初始化失败');
    } finally {
      setSaving(false);
    }
  };

  // 更新单日库存
  const handleUpdateStock = async () => {
    if (!selectedHomestayId || !selectedDate) return;
    if (editForm.totalStock < editForm.booked) {
      setError(`总库存不能小于已预订数量 (${editForm.booked})`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const dateStr = formatDate(selectedDate);
      const price = editForm.price ? parseInt(editForm.price) : undefined;
      await stockApi.update(selectedHomestayId, dateStr, {
        totalStock: editForm.totalStock,
        price,
      });
      setIsEditDialogOpen(false);
      // 更新本地状态
      setStockData(prev => ({
        ...prev,
        [dateStr]: {
          total: editForm.totalStock,
          booked: editForm.booked,
          available: editForm.totalStock - editForm.booked,
          price: price || null,
        },
      }));
    } catch (err: any) {
      setError(err.message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">库存管理</h1>
        <div className="flex items-center gap-3">
          <Select value={selectedHomestayId} onValueChange={setSelectedHomestayId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择民宿" />
            </SelectTrigger>
            <SelectContent>
              {homestays.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsInitDialogOpen(true)} className="bg-champagne hover:bg-champagne-dark">
            <Settings size={18} className="mr-2" />初始化库存
          </Button>
        </div>
      </div>

      {/* 日历卡片 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {currentYear}年{monthNames[currentMonth]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setCurrentYear(new Date().getFullYear());
                setCurrentMonth(new Date().getMonth());
              }}>
                今天
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 图例 */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1">
              <span>🟢</span> 充足 (≥2)
            </span>
            <span className="flex items-center gap-1">
              <span>🟡</span> 紧张 (1)
            </span>
            <span className="flex items-center gap-1">
              <span>🔴</span> 满房 (0)
            </span>
            <span className="flex items-center gap-1">
              <span>⚪</span> 未设置
            </span>
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1">
            {/* 星期标题 */}
            {weekDays.map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* 日期格子 */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              
              const dateStr = formatDate(date);
              const info = stockData[dateStr];
              const status = getStockStatus(info);
              const isToday = formatDate(new Date()) === dateStr;
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
              
              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && handleDateClick(date)}
                  className={`
                    aspect-square p-1 rounded-lg flex flex-col items-center justify-center cursor-pointer
                    transition-all hover:ring-2 hover:ring-champagne
                    ${status.color}
                    ${isToday ? 'ring-2 ring-champagne ring-offset-1' : ''}
                    ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className="text-xs font-medium">{date.getDate()}</span>
                  {info && (
                    <span className="text-xs mt-0.5">{status.emoji}{info.available}</span>
                  )}
                  {!info && !isPast && (
                    <span className="text-xs mt-0.5">⚪</span>
                  )}
                </div>
              );
            })}
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-champagne" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 初始化库存弹窗 */}
      <Dialog open={isInitDialogOpen} onOpenChange={setIsInitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>初始化库存</DialogTitle>
            <DialogDescription>
              批量设置未来90天的库存，已存在的日期会被更新
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>每日总库存</Label>
              <Input
                type="number"
                value={initForm.totalStock}
                onChange={(e) => setInitForm({ ...initForm, totalStock: parseInt(e.target.value) || 1 })}
                min={1}
              />
              <p className="text-xs text-gray-500">设置每个日期可预订的房间数量</p>
            </div>
            
            <div className="space-y-2">
              <Label>每日价格 (可选，泰铢)</Label>
              <Input
                type="number"
                value={initForm.price}
                onChange={(e) => setInitForm({ ...initForm, price: e.target.value })}
                placeholder="留空使用民宿默认价格"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInitDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleInitStock} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              确认初始化
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑日期库存弹窗 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`}
            </DialogTitle>
            <DialogDescription>调整当日库存和价格</DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">{editForm.totalStock}</div>
                <div className="text-xs text-gray-500">总库存</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{editForm.booked}</div>
                <div className="text-xs text-gray-500">已预订</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{editForm.totalStock - editForm.booked}</div>
                <div className="text-xs text-gray-500">可预订</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>总库存</Label>
              <Input
                type="number"
                value={editForm.totalStock}
                onChange={(e) => setEditForm({ ...editForm, totalStock: parseInt(e.target.value) || 0 })}
                min={editForm.booked}
              />
              <p className="text-xs text-gray-500">
                不能小于已预订数量 ({editForm.booked})
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>当日价格 (泰铢，可选)</Label>
              <Input
                type="number"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                placeholder="留空使用默认价格"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateStock} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
