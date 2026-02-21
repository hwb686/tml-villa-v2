import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar, User, Loader2, AlertCircle } from 'lucide-react';
import { driverApi, driverScheduleApi, type Driver, type DriverCalendarData } from '@/services/api';

// 生成日历数据
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  const startPadding = firstDay.getDay();
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export default function DriverSchedule() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [calendarData, setCalendarData] = useState<DriverCalendarData>({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 弹窗状态
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<'available' | 'booked' | 'off'>('available');
  const [error, setError] = useState('');

  // 加载司机列表
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await driverApi.getAll({ status: 'active' });
        setDrivers(response.data);
        if (response.data.length > 0) {
          setSelectedDriverId(response.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch drivers:', err);
      }
    };
    fetchDrivers();
  }, []);

  // 加载排班数据
  useEffect(() => {
    if (!selectedDriverId) return;
    
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const response = await driverScheduleApi.getByDriver(selectedDriverId, { month: monthStr });
        // 转换数据格式以适配显示
        const calendar: DriverCalendarData = {};
        for (const [date, info] of Object.entries(response.data)) {
          calendar[date] = {
            available: info.status === 'available' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
            booked: info.status === 'booked' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
            off: info.status === 'off' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
          };
        }
        setCalendarData(calendar);
      } catch (err) {
        console.error('Failed to fetch schedule:', err);
        setCalendarData({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedDriverId, currentYear, currentMonth]);

  // 日历天数
  const calendarDays = useMemo(() => {
    return generateCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // 获取日期状态
  const getDateStatus = (dateStr: string): { status: string; color: string; label: string } => {
    const dayData = calendarData[dateStr];
    if (!dayData) {
      return { status: 'none', color: 'bg-gray-100 text-gray-500', label: '未设置' };
    }
    if (dayData.booked.length > 0) {
      return { status: 'booked', color: 'bg-red-100 text-red-700', label: '已预约' };
    }
    if (dayData.off.length > 0) {
      return { status: 'off', color: 'bg-gray-200 text-gray-600', label: '休息' };
    }
    if (dayData.available.length > 0) {
      return { status: 'available', color: 'bg-green-100 text-green-700', label: '可排班' };
    }
    return { status: 'none', color: 'bg-gray-100 text-gray-500', label: '未设置' };
  };

  // 点击日期（多选）
  const handleDateClick = (dateStr: string) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr];
    });
  };

  // 批量设置排班
  const handleBatchSetSchedule = async () => {
    if (!selectedDriverId || selectedDates.length === 0) return;

    setIsSaving(true);
    setError('');
    try {
      await driverScheduleApi.setSchedule(selectedDriverId, {
        dates: selectedDates,
        status: batchStatus,
      });
      setIsBatchDialogOpen(false);
      setSelectedDates([]);
      // 重新加载排班
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const response = await driverScheduleApi.getByDriver(selectedDriverId, { month: monthStr });
      const calendar: DriverCalendarData = {};
      for (const [date, info] of Object.entries(response.data)) {
        calendar[date] = {
          available: info.status === 'available' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
          booked: info.status === 'booked' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
          off: info.status === 'off' ? [{ id: selectedDriverId, name: '', phone: '' }] : [],
        };
      }
      setCalendarData(calendar);
    } catch (err: any) {
      setError(err.message || '设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          司机排班管理
        </h1>
        <div className="flex items-center gap-3">
          <Select value={selectedDriverId} onValueChange={(id) => {
            setSelectedDriverId(id);
            setSelectedDates([]);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="选择司机" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name} ({driver.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDates.length > 0 && (
            <Button onClick={() => setIsBatchDialogOpen(true)} className="bg-champagne hover:bg-champagne-dark">
              批量设置 ({selectedDates.length}天)
            </Button>
          )}
        </div>
      </div>

      {/* 司机信息 */}
      {selectedDriver && (
        <Card>
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-champagne/20 flex items-center justify-center">
              <User className="w-6 h-6 text-champagne" />
            </div>
            <div>
              <div className="font-medium">{selectedDriver.name}</div>
              <div className="text-sm text-gray-500">{selectedDriver.phone}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm text-gray-500">日薪</div>
              <div className="font-medium">{selectedDriver.dailyFee.toLocaleString()} 泰铢</div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <CardContent className="relative">
          {/* 图例 */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-100"></span> 可排班
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-100"></span> 已预约
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-200"></span> 休息
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-100"></span> 未设置
            </span>
            <span className="text-gray-500 ml-4">
              点击日期可多选，然后批量设置状态
            </span>
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              
              const dateStr = formatDate(date);
              const statusInfo = getDateStatus(dateStr);
              const isToday = formatDate(new Date()) === dateStr;
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
              const isSelected = selectedDates.includes(dateStr);
              
              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && handleDateClick(dateStr)}
                  className={`
                    aspect-square p-1 rounded-lg flex flex-col items-center justify-center cursor-pointer
                    transition-all hover:ring-2 hover:ring-champagne
                    ${statusInfo.color}
                    ${isToday ? 'ring-2 ring-champagne ring-offset-1' : ''}
                    ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                  `}
                >
                  <span className="text-xs font-medium">{date.getDate()}</span>
                  <span className="text-xs mt-0.5">
                    {statusInfo.status === 'available' && '✓'}
                    {statusInfo.status === 'booked' && '✗'}
                    {statusInfo.status === 'off' && '−'}
                  </span>
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

      {/* 批量设置弹窗 */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量设置排班</DialogTitle>
            <DialogDescription>
              为 {selectedDriver?.name} 设置 {selectedDates.length} 天的排班状态
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
              <Label>选择状态</Label>
              <Select
                value={batchStatus}
                onValueChange={(value) => setBatchStatus(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">可排班 (✓)</SelectItem>
                  <SelectItem value="off">休息 (−)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>选中日期</Label>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-2 text-sm">
                {selectedDates.sort().map(date => (
                  <span key={date} className="inline-block mr-2 mb-1">{date}</span>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchSetSchedule} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              确认设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
