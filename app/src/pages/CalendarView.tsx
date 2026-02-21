import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Home, Car, Loader2, Users, Phone, Calendar as CalendarIcon } from 'lucide-react';
import { fetchAdminApi, type Homestay, type CarConfig } from '@/services/api';

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

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 获取库存状态
const getStockStatus = (status: string): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'available':
      return { bg: 'bg-green-100', text: 'text-green-700', label: '充足' };
    case 'limited':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '紧张' };
    case 'full':
      return { bg: 'bg-red-100', text: 'text-red-700', label: '满房' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-500', label: '未设置' };
  }
};

// 日历数据类型
interface CalendarDayData {
  totalRooms?: number;
  totalCars?: number;
  totalStock: number;
  totalBooked: number;
  totalAvailable: number;
  status: string;
  homestays?: Array<{ id: string; title: string; total: number; booked: number; available: number; price: number }>;
  cars?: Array<{ id: string; name: string; total: number; booked: number; available: number; price: number; carType: string; hasDriver: boolean }>;
}

interface CalendarData {
  month: string;
  homestays?: Homestay[];
  carConfigs?: CarConfig[];
  calendar: { [date: string]: CalendarDayData };
}

// 详情数据类型
interface RoomDetail {
  id: string;
  title: string;
  total: number;
  booked: number;
  available: number;
  price: number;
  status: string;
}

interface CarDetail {
  id: string;
  name: string;
  carType: string;
  hasDriver: boolean;
  total: number;
  booked: number;
  available: number;
  price: number;
  status: string;
}

interface BookingDetail {
  id: string;
  guestName: string;
  guestPhone: string;
  homestayTitle: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

interface RentalDetail {
  id: string;
  roomNumber: string;
  carName: string;
  startTime: string;
  endTime: string;
  days: number;
  needDriver: boolean;
  driverName?: string;
  status: string;
  totalPrice: number;
}

interface DetailData {
  date: string;
  type: string;
  rooms?: RoomDetail[];
  cars?: CarDetail[];
  bookings?: BookingDetail[];
  rentals?: RentalDetail[];
}

export default function CalendarView() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'cars'>('rooms');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 详情弹窗
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // 加载日历数据
  useEffect(() => {
    const fetchCalendar = async () => {
      setIsLoading(true);
      try {
        const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const response = await fetchAdminApi<CalendarData>(`/calendar/${activeTab}?month=${monthStr}`);
        setCalendarData(response.data);
      } catch (err) {
        console.error('Failed to fetch calendar:', err);
        setCalendarData(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCalendar();
  }, [activeTab, currentYear, currentMonth]);

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

  // 点击日期查看详情
  const handleDateClick = async (date: Date) => {
    setSelectedDate(date);
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    
    try {
      const dateStr = formatDate(date);
      const response = await fetchAdminApi<DetailData>(`/calendar/detail?date=${dateStr}&type=${activeTab}`);
      setDetailData(response.data);
    } catch (err) {
      console.error('Failed to fetch detail:', err);
      setDetailData(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" />
          日历视图
        </h1>
        <p className="text-gray-500 text-sm">查看房间和车辆的可用性概况</p>
      </div>

      {/* 标签页切换 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rooms' | 'cars')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <Home size={16} />
            房间日历
          </TabsTrigger>
          <TabsTrigger value="cars" className="flex items-center gap-2">
            <Car size={16} />
            车辆日历
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
          <CalendarCard
            type="rooms"
            calendarDays={calendarDays}
            calendarData={calendarData}
            currentYear={currentYear}
            currentMonth={currentMonth}
            isLoading={isLoading}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onResetMonth={() => {
              setCurrentYear(new Date().getFullYear());
              setCurrentMonth(new Date().getMonth());
            }}
            onDateClick={handleDateClick}
            monthNames={monthNames}
            weekDays={weekDays}
          />
        </TabsContent>

        <TabsContent value="cars" className="mt-4">
          <CalendarCard
            type="cars"
            calendarDays={calendarDays}
            calendarData={calendarData}
            currentYear={currentYear}
            currentMonth={currentMonth}
            isLoading={isLoading}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onResetMonth={() => {
              setCurrentYear(new Date().getFullYear());
              setCurrentMonth(new Date().getMonth());
            }}
            onDateClick={handleDateClick}
            monthNames={monthNames}
            weekDays={weekDays}
          />
        </TabsContent>
      </Tabs>

      {/* 详情弹窗 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`}
              {activeTab === 'rooms' ? ' - 房间详情' : ' - 车辆详情'}
            </DialogTitle>
            <DialogDescription>
              查看当日的库存和预订情况
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-champagne" />
            </div>
          ) : detailData ? (
            <div className="space-y-4">
              {activeTab === 'rooms' && detailData.rooms && (
                <>
                  {/* 房间库存汇总 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{detailData.rooms.length}</div>
                      <div className="text-xs text-gray-500">房间数</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {detailData.rooms.reduce((sum, r) => sum + r.booked, 0)}
                      </div>
                      <div className="text-xs text-gray-500">已预订</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {detailData.rooms.reduce((sum, r) => sum + r.available, 0)}
                      </div>
                      <div className="text-xs text-gray-500">可预订</div>
                    </div>
                  </div>
                  
                  {/* 房间列表 */}
                  <div>
                    <h4 className="font-medium mb-2">房间库存</h4>
                    <div className="space-y-2">
                      {detailData.rooms.map((room) => {
                        const status = getStockStatus(room.status);
                        return (
                          <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{room.title}</div>
                              <div className="text-sm text-gray-500">
                                {room.booked}/{room.total} 已预订 | {room.price} 泰铢
                              </div>
                            </div>
                            <Badge className={`${status.bg} ${status.text}`}>{status.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 预订列表 */}
                  {detailData.bookings && detailData.bookings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">当日入住预订</h4>
                      <div className="space-y-2">
                        {detailData.bookings.map((booking) => (
                          <div key={booking.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-gray-400" />
                                <span className="font-medium">{booking.guestName}</span>
                              </div>
                              <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                {booking.status === 'confirmed' ? '已确认' : '待确认'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              <Phone size={12} className="inline mr-1" />
                              {booking.guestPhone}
                            </div>
                            <div className="text-sm text-gray-500">
                              {booking.homestayTitle} | {booking.checkIn} ~ {booking.checkOut}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {activeTab === 'cars' && detailData.cars && (
                <>
                  {/* 车辆库存汇总 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <div className="text-2xl font-bold">{detailData.cars.length}</div>
                      <div className="text-xs text-gray-500">车型数</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {detailData.cars.reduce((sum, c) => sum + c.booked, 0)}
                      </div>
                      <div className="text-xs text-gray-500">已预订</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {detailData.cars.reduce((sum, c) => sum + c.available, 0)}
                      </div>
                      <div className="text-xs text-gray-500">可预订</div>
                    </div>
                  </div>
                  
                  {/* 车辆列表 */}
                  <div>
                    <h4 className="font-medium mb-2">车辆库存</h4>
                    <div className="space-y-2">
                      {detailData.cars.map((car) => {
                        const status = getStockStatus(car.status);
                        return (
                          <div key={car.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {car.name}
                                {car.hasDriver && <span className="text-xs text-champagne">可配司机</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {car.carType} | {car.booked}/{car.total} 已预订 | {car.price} 泰铢
                              </div>
                            </div>
                            <Badge className={`${status.bg} ${status.text}`}>{status.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 租车订单列表 */}
                  {detailData.rentals && detailData.rentals.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">当日租车订单</h4>
                      <div className="space-y-2">
                        {detailData.rentals.map((rental) => (
                          <div key={rental.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{rental.carName}</div>
                              <Badge variant={rental.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                                {rental.status === 'CONFIRMED' ? '已确认' : '待确认'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              房号: {rental.roomNumber} | {rental.days}天
                              {rental.needDriver && rental.driverName && (
                                <span> | 司机: {rental.driverName}</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(rental.startTime).toLocaleDateString()} ~ {new Date(rental.endTime).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 日历卡片组件
interface CalendarCardProps {
  type: 'rooms' | 'cars';
  calendarDays: (Date | null)[];
  calendarData: CalendarData | null;
  currentYear: number;
  currentMonth: number;
  isLoading: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetMonth: () => void;
  onDateClick: (date: Date) => void;
  monthNames: string[];
  weekDays: string[];
}

function CalendarCard({
  type,
  calendarDays,
  calendarData,
  currentYear,
  currentMonth,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  onDateClick,
  monthNames,
  weekDays,
}: CalendarCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {type === 'rooms' ? <Home size={20} /> : <Car size={20} />}
            {currentYear}年{monthNames[currentMonth]}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPrevMonth}>
              <ChevronLeft size={18} />
            </Button>
            <Button variant="outline" size="sm" onClick={onResetMonth}>
              今天
            </Button>
            <Button variant="outline" size="sm" onClick={onNextMonth}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        {/* 图例 */}
        <div className="flex items-center gap-4 mb-4 text-sm flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span> 充足 (&gt;50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span> 紧张 (10%-50%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> 满/租完 (&lt;10%)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-300"></span> 未设置
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
            const dayData = calendarData?.calendar[dateStr];
            const status = dayData ? getStockStatus(dayData.status) : getStockStatus('unknown');
            const isToday = formatDate(new Date()) === dateStr;
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            
            return (
              <div
                key={dateStr}
                onClick={() => !isPast && onDateClick(date)}
                className={`
                  aspect-square p-1 rounded-lg flex flex-col items-center justify-center cursor-pointer
                  transition-all hover:ring-2 hover:ring-champagne
                  ${status.bg} ${status.text}
                  ${isToday ? 'ring-2 ring-champagne ring-offset-1' : ''}
                  ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className="text-xs font-medium">{date.getDate()}</span>
                {dayData && (
                  <span className="text-xs mt-0.5 font-bold">
                    {dayData.totalAvailable}
                  </span>
                )}
                {!dayData && !isPast && (
                  <span className="text-xs mt-0.5">-</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 统计信息 */}
        {calendarData && (
          <div className="mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-champagne">
                {type === 'rooms' 
                  ? (calendarData as any).homestays?.length || 0
                  : (calendarData as any).carConfigs?.length || 0}
              </div>
              <div className="text-xs text-gray-500">{type === 'rooms' ? '房源数' : '车型数'}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Object.values(calendarData.calendar).reduce((sum, d) => sum + d.totalBooked, 0)}
              </div>
              <div className="text-xs text-gray-500">本月已预订</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Object.values(calendarData.calendar).reduce((sum, d) => sum + d.totalAvailable, 0)}
              </div>
              <div className="text-xs text-gray-500">本月可预订</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-600">
                {Object.keys(calendarData.calendar).length}
              </div>
              <div className="text-xs text-gray-500">有库存天数</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-champagne" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
