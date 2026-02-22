import { useState, useEffect } from 'react';
import { staffApi, type Staff, type StaffCalendarData } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// 员工类型映射
const staffTypeMap: Record<string, string> = {
  cleaner: '清洁工',
  receptionist: '前台',
  admin: '管理员',
  maintenance: '维护人员',
  other: '其他',
};

// 排班状态映射
const scheduleStatusMap: Record<string, { label: string; color: string }> = {
  scheduled: { label: '已排班', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  working: { label: '工作中', color: 'bg-green-100 text-green-800 border-green-300' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  absent: { label: '缺勤', color: 'bg-red-100 text-red-800 border-red-300' },
  off: { label: '休息', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
};

// 星期几映射
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function StaffSchedule() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [calendar, setCalendar] = useState<StaffCalendarData>({});
  const [loading, setLoading] = useState(true);
  
  // 当前显示的月份
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterType, setFilterType] = useState<string>('all');
  
  // 选中的日期（用于显示详情）
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 加载员工列表
  const loadStaffs = async () => {
    try {
      const data = await staffApi.getAll({ status: 'active' });
      setStaffs(data);
    } catch (error) {
      console.error('Failed to load staffs:', error);
    }
  };

  // 加载排班日历
  const loadCalendar = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      const params: { month: string; staffType?: string } = { month: monthStr };
      if (filterType !== 'all') {
        params.staffType = filterType;
      }
      
      const data = await staffApi.getCalendar(params);
      setCalendar(data);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      toast({
        title: '加载失败',
        description: '无法加载排班日历',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  useEffect(() => {
    loadCalendar();
  }, [currentDate, filterType]);

  // 获取月份的天数
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 获取月份第一天是星期几
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 生成日历网格
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: Array<{ date: string; day: number; isCurrentMonth: boolean }> = [];
    
    // 上个月的日期填充
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const dateStr = `${prevMonth.getFullYear()}-${(prevMonth.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push({ date: dateStr, day, isCurrentMonth: false });
    }
    
    // 当前月份的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({ date: dateStr, day: i, isCurrentMonth: true });
    }
    
    // 下个月的日期填充
    const totalCells = Math.ceil(days.length / 7) * 7;
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    for (let i = 1; days.length < totalCells; i++) {
      const dateStr = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      days.push({ date: dateStr, day: i, isCurrentMonth: false });
    }
    
    return days;
  };

  // 切换月份
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  // 获取某一天的员工统计
  const getDayStats = (dateStr: string) => {
    const dayData = calendar[dateStr];
    if (!dayData) return null;
    
    return {
      scheduled: dayData.scheduled?.length || 0,
      working: dayData.working?.length || 0,
      completed: dayData.completed?.length || 0,
      absent: dayData.absent?.length || 0,
      off: dayData.off?.length || 0,
      total: Object.values(dayData).reduce((sum, arr) => sum + arr.length, 0),
    };
  };

  // 获取选中日期的详情
  const getSelectedDateDetails = () => {
    if (!selectedDate || !calendar[selectedDate]) return null;
    return calendar[selectedDate];
  };

  const calendarDays = generateCalendarDays();
  const selectedDetails = getSelectedDateDetails();
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">员工排班</h1>
          <p className="text-muted-foreground">查看和管理员工排班日历</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="员工类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="cleaner">清洁工</SelectItem>
              <SelectItem value="receptionist">前台</SelectItem>
              <SelectItem value="admin">管理员</SelectItem>
              <SelectItem value="maintenance">维护人员</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{staffs.length}</div>
            <div className="text-sm text-muted-foreground">活跃员工</div>
          </CardContent>
        </Card>
        {Object.entries(scheduleStatusMap).map(([key, value]) => (
          <Card key={key}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {Object.values(calendar).reduce(
                  (sum, day) => sum + (day[key as keyof typeof day]?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">{value.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 日历 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => changeMonth(-1)}>
                上月
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                今天
              </Button>
              <Button variant="outline" size="sm" onClick={() => changeMonth(1)}>
                下月
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : (
            <>
              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center py-2 font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const stats = getDayStats(day.date);
                  const isToday = day.date === today;
                  const isSelected = day.date === selectedDate;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                        ${day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${isSelected ? 'bg-primary/10' : ''}
                        hover:bg-muted/50
                      `}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                        {day.day}
                      </div>
                      {stats && (
                        <div className="space-y-1">
                          {stats.scheduled > 0 && (
                            <Badge variant="outline" className="text-xs px-1">
                              📋 {stats.scheduled}
                            </Badge>
                          )}
                          {stats.working > 0 && (
                            <Badge variant="outline" className="text-xs px-1 bg-green-50">
                              🔧 {stats.working}
                            </Badge>
                          )}
                          {stats.off > 0 && (
                            <Badge variant="outline" className="text-xs px-1 bg-yellow-50">
                              💤 {stats.off}
                            </Badge>
                          )}
                          {stats.absent > 0 && (
                            <Badge variant="outline" className="text-xs px-1 bg-red-50">
                              ❌ {stats.absent}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 选中日期详情 */}
      {selectedDate && selectedDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate} 排班详情
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(scheduleStatusMap).map(([status, info]) => {
              const staffList = selectedDetails[status as keyof typeof selectedDetails];
              if (!staffList || staffList.length === 0) return null;
              
              return (
                <div key={status} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={info.color}>{info.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({staffList.length}人)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {staffList.map((staff) => (
                      <div
                        key={staff.id}
                        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{staff.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {staffTypeMap[staff.staffType] || staff.staffType}
                            {staff.workHours && ` · ${staff.workHours}h`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 图例 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            {Object.entries(scheduleStatusMap).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${value.color}`}></div>
                <span className="text-sm">{value.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
