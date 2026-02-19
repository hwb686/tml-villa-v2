import { useState, useEffect } from 'react';
import { Heart, Share, Star, ChevronLeft, ChevronRight, Home, Users, Bed, Bath, Check, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { homestayApi, type Homestay } from '@/services/api';
import { platformSyncApi } from '@/services/platformSyncApi';
import { format } from 'date-fns';
import { zhCN, enUS, th } from 'date-fns/locale';
import { getHashLink } from '@/lib/router';

export default function HomestayDetail() {
  const { t, lang } = useLanguage();
  const [id, setId] = useState<string>('');
  const [homestay, setHomestay] = useState<Homestay | null>(null);
  
  // Get ID from hash URL
  useEffect(() => {
    const hash = window.location.hash;
    const pathParts = hash.replace('#', '').split('/');
    const homestayId = pathParts[pathParts.length - 1];
    setId(homestayId);
  }, []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [guests, setGuests] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);

  useEffect(() => {
    const fetchHomestay = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        // 分别处理两个API调用，提高容错性
        const homestayResponse = await homestayApi.getById(id);
        setHomestay(homestayResponse.data);
        setIsFavorite(homestayResponse.data.isFavorite);
        
        // 单独处理平台同步API，即使失败也不影响主要功能
        try {
          const unavailableResponse = await platformSyncApi.getUnavailableDates(id);
          setUnavailableDates(unavailableResponse.data || []);
        } catch (syncError) {
          console.warn('Failed to fetch unavailable dates, using empty array:', syncError);
          setUnavailableDates([]);
        }
      } catch (err) {
        console.error('Failed to fetch homestay:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomestay();
  }, [id]);

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

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const calculateTotal = () => {
    if (!homestay) return 0;
    return homestay.price * calculateNights();
  };

  const nextImage = () => {
    if (homestay) {
      setCurrentImageIndex((prev) => (prev + 1) % homestay.images.length);
    }
  };

  const prevImage = () => {
    if (homestay) {
      setCurrentImageIndex((prev) => (prev - 1 + homestay.images.length) % homestay.images.length);
    }
  };

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      alert(lang === 'zh' ? '请选择入住和退房日期' : lang === 'th' ? 'กรุณาเลือกวันเช็คอินและเช็คเอาท์' : 'Please select check-in and check-out dates');
      return;
    }
    setShowBookingModal(true);
  };

  const goBack = () => {
    window.location.hash = getHashLink('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne"></div>
      </div>
    );
  }

  if (!homestay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{lang === 'zh' ? '房源未找到' : lang === 'th' ? 'ไม่พบที่พัก' : 'Property not found'}</p>
        <Button onClick={goBack} className="bg-champagne hover:bg-champagne-dark">
          {lang === 'zh' ? '返回首页' : lang === 'th' ? 'กลับหน้าหลัก' : 'Back to Home'}
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
            <button 
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-champagne transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">{lang === 'zh' ? '返回' : lang === 'th' ? 'กลับ' : 'Back'}</span>
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Heart size={20} className={isFavorite ? 'fill-champagne text-champagne' : 'text-gray-600'} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Share size={20} className="text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Image Gallery */}
      <div className="container-luxury py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
            <img 
              src={homestay.images[currentImageIndex]} 
              alt={homestay.title}
              className="w-full h-full object-cover"
            />
            {homestay.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {homestay.images.length}
            </div>
          </div>
          
          {/* Thumbnail Grid */}
          <div className="hidden md:grid grid-cols-2 gap-4">
            {homestay.images.slice(0, 4).map((image, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`relative aspect-square rounded-xl overflow-hidden ${currentImageIndex === idx ? 'ring-2 ring-champagne' : ''}`}
              >
                <img src={image} alt={`${homestay.title} ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-luxury py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-ink">{homestay.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <MapPin size={16} />
                <span>{homestay.location}</span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-champagne text-champagne" />
                  <span className="font-medium">{homestay.rating}</span>
                  <span className="text-gray-500">({homestay.reviews} {t.listing.reviews})</span>
                </div>
                {homestay.host.isSuperhost && (
                  <Badge className="bg-champagne/10 text-champagne border-none">
                    {t.listing.superhost}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Host Info */}
            <div className="flex items-center gap-4">
              <img 
                src={homestay.host.avatar} 
                alt={homestay.host.name}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-lg">{lang === 'zh' ? '房东：' : lang === 'th' ? 'เจ้าของ: ' : 'Host: '}{homestay.host.name}</p>
                {homestay.host.isSuperhost && (
                  <p className="text-sm text-gray-500">{t.listing.superhost}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Property Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Users size={20} className="text-champagne" />
                <div>
                  <p className="font-medium">{homestay.guests}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '位客人' : lang === 'th' ? 'คน' : 'guests'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Home size={20} className="text-champagne" />
                <div>
                  <p className="font-medium">{homestay.bedrooms}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '间卧室' : lang === 'th' ? 'ห้องนอน' : 'bedrooms'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Bed size={20} className="text-champagne" />
                <div>
                  <p className="font-medium">{homestay.beds}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '张床' : lang === 'th' ? 'เตียง' : 'beds'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Bath size={20} className="text-champagne" />
                <div>
                  <p className="font-medium">{homestay.bathrooms}</p>
                  <p className="text-sm text-gray-500">{lang === 'zh' ? '间卫生间' : lang === 'th' ? 'ห้องน้ำ' : 'bathrooms'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">
                {lang === 'zh' ? '关于此房源' : lang === 'th' ? 'เกี่ยวกับที่พัก' : 'About this place'}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {homestay.description || (lang === 'zh' 
                  ? '这是一处舒适宜人的住宿，位于泰国绝佳位置。房源设施齐全，环境优雅，是您度假旅行的理想选择。'
                  : lang === 'th' 
                    ? 'ที่พักสบาย ๆ ในทำเลที่ดีที่สุดของประเทศไทย พร้อมสิ่งอำนวยความสะดวกครบครันและบรรยากาศสวยงาม'
                    : 'A comfortable stay in a prime location in Thailand. Fully equipped with beautiful ambiance.')}
              </p>
            </div>

            <Separator />

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-semibold mb-3">
                {lang === 'zh' ? '设施与服务' : lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Amenities'}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {homestay.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check size={16} className="text-champagne" />
                    <span className="text-gray-600">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-semibold">{formatPrice(homestay.price)}</span>
                <span className="text-gray-500">/ {t.listing.perNight}</span>
              </div>

              {/* Date Selection */}
              <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-gray-300">
                  <div className="p-3">
                    <p className="text-xs font-medium text-ink">{t.search.checkin}</p>
                    <p className="text-sm text-gray-500">
                      {checkIn ? format(checkIn, 'MM/dd', { locale: getLocale() }) : '添加日期'}
                    </p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-ink">{t.search.checkout}</p>
                    <p className="text-sm text-gray-500">
                      {checkOut ? format(checkOut, 'MM/dd', { locale: getLocale() }) : '添加日期'}
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-300 p-3">
                  <p className="text-xs font-medium text-ink">{t.search.who}</p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-champagne"
                    >
                      -
                    </button>
                    <span className="text-sm">{guests} {lang === 'zh' ? '位客人' : lang === 'th' ? 'คน' : 'guests'}</span>
                    <button 
                      onClick={() => setGuests(guests + 1)}
                      className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:border-champagne"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="mb-4">
                <Calendar
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(range) => {
                    setCheckIn(range?.from);
                    setCheckOut(range?.to);
                  }}
                  disabled={(date) => {
                    // 禁用过去的日期和已被预订的日期
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (date < today) return true;
                    
                    const dateString = date.toISOString().split('T')[0];
                    return unavailableDates.includes(dateString);
                  }}
                  className="rounded-md border w-full"
                  captionLayout="dropdown"
                  formatters={{
                    formatMonthDropdown: (date) => {
                      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                      return months[date.getMonth()];
                    }
                  }}
                />
              </div>

              {/* Price Breakdown */}
              {checkIn && checkOut && (
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{formatPrice(homestay.price)} x {calculateNights()} {lang === 'zh' ? '晚' : lang === 'th' ? 'คืน' : 'nights'}</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
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
                className="w-full bg-champagne hover:bg-champagne-dark text-white py-6 rounded-xl"
              >
                {lang === 'zh' ? '预订' : lang === 'th' ? 'จอง' : 'Reserve'}
              </Button>

              <p className="text-center text-sm text-gray-500 mt-3">
                {lang === 'zh' ? '您暂时不会被收费' : lang === 'th' ? 'คุณจะยังไม่ถูกเรียกเก็บเงิน' : 'You won\'t be charged yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {lang === 'zh' ? '确认预订' : lang === 'th' ? 'ยืนยันการจอง' : 'Confirm Booking'}
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">{homestay.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{lang === 'zh' ? '入住' : lang === 'th' ? 'เช็คอิน' : 'Check-in'}</span>
                <span>{checkIn && format(checkIn, 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{lang === 'zh' ? '退房' : lang === 'th' ? 'เช็คเอาท์' : 'Check-out'}</span>
                <span>{checkOut && format(checkOut, 'yyyy-MM-dd')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{lang === 'zh' ? '客人' : lang === 'th' ? 'ผู้เข้าพัก' : 'Guests'}</span>
                <span>{guests}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>{lang === 'zh' ? '总计' : lang === 'th' ? 'รวม' : 'Total'}</span>
                <span className="text-champagne">{formatPrice(calculateTotal() * 1.12)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowBookingModal(false)}
              >
                {lang === 'zh' ? '取消' : lang === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
              <Button 
                className="flex-1 bg-champagne hover:bg-champagne-dark"
                onClick={() => {
                  alert(lang === 'zh' ? '预订成功！' : lang === 'th' ? 'จองสำเร็จ!' : 'Booking successful!');
                  setShowBookingModal(false);
                }}
              >
                {lang === 'zh' ? '确认预订' : lang === 'th' ? 'ยืนยัน' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
