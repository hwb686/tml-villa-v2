import { useState, useEffect } from 'react';
import { carConfigApi, carApi, carStockApi, driverScheduleApi, type CarConfig, type Driver } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { useLanguage } from '@/hooks/useLanguage';
import { useHashRouter, getHashLink } from '@/lib/router';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Car, Users, Fuel, Settings, Check, Loader2, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN, enUS, th } from 'date-fns/locale';

export default function CarDetail() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { path } = useHashRouter();
  const [id, setId] = useState<string>('');
  const [carConfig, setCarConfig] = useState<CarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [roomNumber, setRoomNumber] = useState('');
  const [remark, setRemark] = useState('');
  const [needDriver, setNeedDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [showBookingResult, setShowBookingResult] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // 从路径提取ID
  useEffect(() => {
    const pathWithoutQuery = path.split('?')[0];
    const pathParts = pathWithoutQuery.split('/');
    const carId = pathParts[pathParts.length - 1];
    setId(carId);
  }, [path]);

  // 获取车辆配置详情
  useEffect(() => {
    const fetchCarConfig = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const response = await carConfigApi.getAll();
        const config = response.data.find((c: CarConfig) => c.id === id);
        if (config) {
          setCarConfig(config);
          // 尝试获取不可用日期
          try {
            const unavailableResponse = await carStockApi.getUnavailableDates(id);
            setUnavailableDates(unavailableResponse.data || []);
          } catch {
            setUnavailableDates([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch car config:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCarConfig();
  }, [id]);

  // 获取可用司机
  useEffect(() => {
    const fetchDrivers = async () => {
      if (!startDate || !needDriver) return;
      try {
        const dateStr = format(startDate, 'yyyy-MM-dd');
        const response = await driverScheduleApi.getAvailable(dateStr);
        setAvailableDrivers(response.data || []);
      } catch {
        setAvailableDrivers([]);
      }
    };
    fetchDrivers();
  }, [startDate, needDriver]);

  const getLocale = () => {
    switch (lang) {
      case 'zh': return zhCN;
      case 'th': return th;
      default: return enUS;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const calculateTotal = () => {
    if (!carConfig) return 0;
    let total = carConfig.price * calculateDays();
    if (needDriver && carConfig.driverFee) {
      total += carConfig.driverFee * calculateDays();
    }
    return total;
  };

  const handleBooking = async () => {
    if (!carConfig || !startDate || !endDate || !roomNumber) {
      toast({
        title: lang === 'zh' ? '请填写完整信息' : lang === 'th' ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await carApi.create({
        roomNumber,
        carConfigId: carConfig.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        days: calculateDays(),
        remark,
        needDriver,
      });
      setBookingSuccess(true);
      setShowBookingResult(true);
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingSuccess(false);
      setShowBookingResult(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    window.location.hash = getHashLink('/car-rental');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-champagne" />
      </div>
    );
  }

  if (!carConfig) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Car size={48} className="text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">
          {lang === 'zh' ? '车辆未找到' : lang === 'th' ? 'ไม่พบรถ' : 'Vehicle not found'}
        </p>
        <Button onClick={goBack} className="bg-champagne hover:bg-champagne-dark">
          {lang === 'zh' ? '返回租车列表' : lang === 'th' ? 'กลับไปหน้ารถเช่า' : 'Back to Car Rental'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="container-luxury py-4">
          <div className="flex items-center justify-between">
            <button onClick={goBack} className="flex items-center gap-2 text-gray-600 hover:text-champagne transition-colors">
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">{lang === 'zh' ? '返回' : lang === 'th' ? 'กลับ' : 'Back'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="container-luxury py-6">
        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
          {carConfig.image ? (
            <img src={carConfig.image} alt={carConfig.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Car size={64} className="text-gray-300" />
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-champagne text-white border-none text-sm px-3 py-1">
              {carConfig.carType}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-luxury py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-ink">{carConfig.name}</h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Users size={16} className="text-champagne" />
                  <span>{carConfig.seats} {lang === 'zh' ? '座' : lang === 'th' ? 'ที่นั่ง' : 'seats'}</span>
                </div>
                <Badge variant="outline">{carConfig.carType}</Badge>
                {carConfig.hasDriver && (
                  <Badge className="bg-green-100 text-green-800 border-none">
                    <UserCheck size={14} className="mr-1" />
                    {lang === 'zh' ? '可配司机' : lang === 'th' ? 'มีคนขับ' : 'Driver Available'}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            {carConfig.description && (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {lang === 'zh' ? '车辆介绍' : lang === 'th' ? 'รายละเอียดรถ' : 'About this vehicle'}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{carConfig.description}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Features */}
            <div>
              <h2 className="text-xl font-semibold mb-3">
                {lang === 'zh' ? '车辆特点' : lang === 'th' ? 'คุณสมบัติ' : 'Features'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-champagne" />
                  <span className="text-gray-600">{carConfig.carType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-champagne" />
                  <span className="text-gray-600">{carConfig.seats} {lang === 'zh' ? '个座位' : 'seats'}</span>
                </div>
                {carConfig.hasDriver && (
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-champagne" />
                    <span className="text-gray-600">
                      {lang === 'zh' ? '配司机服务' : lang === 'th' ? 'บริการคนขับ' : 'Driver service'}
                      {carConfig.driverFee && ` (+${formatPrice(carConfig.driverFee)}/天)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Available Drivers (if need driver) */}
            {needDriver && availableDrivers.length > 0 && (
              <>
                <Separator />
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {lang === 'zh' ? '可用司机' : lang === 'th' ? 'คนขับที่ว่าง' : 'Available Drivers'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableDrivers.map((driver) => (
                      <div key={driver.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center">
                          <UserCheck size={16} className="text-champagne" />
                        </div>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-sm text-gray-500">{formatPrice(driver.dailyFee)}/日</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">{formatPrice(carConfig.price)}</span>
                <span className="text-gray-500">/ {lang === 'zh' ? '天' : lang === 'th' ? 'วัน' : 'day'}</span>
              </div>

              {/* Room Number */}
              <div className="mb-4">
                <Label htmlFor="roomNumber" className="text-sm font-medium">
                  {lang === 'zh' ? '房号' : lang === 'th' ? 'หมายเลขห้อง' : 'Room Number'} *
                </Label>
                <Input
                  id="roomNumber"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder={lang === 'zh' ? '如 A101' : 'e.g. A101'}
                  className="mt-1"
                />
              </div>

              {/* Date Selection */}
              <div className="mb-4">
                <Calendar
                  mode="range"
                  selected={{ from: startDate, to: endDate }}
                  onSelect={(range) => {
                    setStartDate(range?.from);
                    setEndDate(range?.to);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (date < today) return true;
                    const dateString = date.toISOString().split('T')[0];
                    return unavailableDates.includes(dateString);
                  }}
                  className="rounded-md border w-full"
                  locale={getLocale()}
                />
              </div>

              {/* Driver Option */}
              {carConfig.hasDriver && (
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl">
                    <input
                      type="checkbox"
                      checked={needDriver}
                      onChange={(e) => setNeedDriver(e.target.checked)}
                      className="rounded border-gray-300 text-champagne focus:ring-champagne"
                    />
                    <span className="text-sm">
                      {lang === 'zh' ? '需要配司机' : lang === 'th' ? 'ต้องการคนขับ' : 'Need a driver'}
                      {carConfig.driverFee && (
                        <span className="text-champagne ml-1">(+{formatPrice(carConfig.driverFee)}/天)</span>
                      )}
                    </span>
                  </label>
                </div>
              )}

              {/* Remark */}
              <div className="mb-4">
                <Textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder={lang === 'zh' ? '备注（可选）' : 'Remarks (optional)'}
                  rows={2}
                />
              </div>

              {/* Price Breakdown */}
              {startDate && endDate && (
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{formatPrice(carConfig.price)} x {calculateDays()} {lang === 'zh' ? '天' : 'days'}</span>
                    <span>{formatPrice(carConfig.price * calculateDays())}</span>
                  </div>
                  {needDriver && carConfig.driverFee && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{lang === 'zh' ? '司机费用' : 'Driver fee'}</span>
                      <span>{formatPrice(carConfig.driverFee * calculateDays())}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>{lang === 'zh' ? '总计' : lang === 'th' ? 'รวม' : 'Total'}</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <Button
                onClick={handleBooking}
                disabled={isSubmitting || !roomNumber || !startDate || !endDate}
                className="w-full bg-champagne hover:bg-champagne-dark text-white py-6 rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {lang === 'zh' ? '提交中...' : 'Submitting...'}
                  </>
                ) : (
                  lang === 'zh' ? '立即预订' : lang === 'th' ? 'จองเลย' : 'Book Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Result Modal */}
      {showBookingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 text-center">
            {bookingSuccess ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {lang === 'zh' ? '预订成功！' : lang === 'th' ? 'จองสำเร็จ!' : 'Booking Successful!'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {lang === 'zh' ? '您的租车预订已提交，我们会尽快为您安排。' : 'Your car rental booking has been submitted.'}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 text-2xl">✕</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  {lang === 'zh' ? '预订失败' : lang === 'th' ? 'การจองล้มเหลว' : 'Booking Failed'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {lang === 'zh' ? '请稍后重试' : 'Please try again later'}
                </p>
              </>
            )}
            <Button
              className="w-full bg-champagne hover:bg-champagne-dark"
              onClick={() => {
                setShowBookingResult(false);
                if (bookingSuccess) {
                  window.location.hash = getHashLink('/');
                }
              }}
            >
              {lang === 'zh' ? '确定' : 'OK'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
