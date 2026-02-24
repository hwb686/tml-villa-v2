import { useState, useEffect } from 'react';
import { Heart, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { favoriteApi, type Homestay } from '@/services/api';
import { useLanguage } from '@/hooks/useLanguage';
import { getHashLink } from '@/lib/router';
import { useToast } from '@/hooks/use-toast';

interface HomestayCardProps {
  homestay: Homestay;
}

export default function HomestayCard({ homestay }: HomestayCardProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(homestay.isFavorite);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setIsFavorite(homestay.isFavorite);
  }, [homestay.isFavorite]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const token = localStorage.getItem('userToken');
    if (!token) {
      toast({
        title: '请先登录',
        description: '登录后即可收藏房源',
        variant: 'default',
      });
      window.location.hash = getHashLink('/login');
      return;
    }

    if (isToggling) return;
    
    setIsToggling(true);
    try {
      const response = await favoriteApi.toggle(homestay.id);
      setIsFavorite(response.data.isFavorite);
      toast({
        title: response.data.isFavorite ? '已收藏' : '已取消收藏',
        duration: 1500,
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);
  };

  const handleCardClick = () => {
    window.location.hash = getHashLink(`/homestay/${homestay.id}`);
  };

  return (
    <div className="card-luxury group cursor-pointer" onClick={handleCardClick}>
      {/* Image Carousel */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl">
        <img
          src={homestay.images[currentImage]}
          alt={homestay.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Heart Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isToggling}
          className="heart-btn"
        >
          <Heart size={18} className={`${isFavorite ? 'fill-champagne text-champagne' : 'text-gray-600'} ${isToggling ? 'animate-pulse' : ''}`} />
        </button>

        {/* Image Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {homestay.images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${currentImage === idx ? 'bg-white w-3' : 'bg-white/60'}`}
            />
          ))}
        </div>

      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-medium text-ink line-clamp-1">{homestay.location}</h3>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{homestay.title}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-champagne text-champagne" />
            <span className="text-sm font-medium">{homestay.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <span>{homestay.guests} 位客人</span>
          <span>·</span>
          <span>{homestay.bedrooms} 间卧室</span>
          <span>·</span>
          <span>{homestay.beds} 张床</span>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-ink">{formatPrice(homestay.price)}</span>
            <span className="text-sm text-gray-500">/ {t.listing.perNight}</span>
          </div>
          <span className="text-sm text-gray-400">({homestay.reviews} {t.listing.reviews})</span>
        </div>
      </div>
    </div>
  );
}
