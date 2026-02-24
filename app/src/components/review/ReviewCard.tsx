import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import type { Review } from '@/services/api';

interface ReviewCardProps {
  review: Review;
  showHouse?: boolean;
  onReply?: (review: Review) => void;
}

export function ReviewCard({ review, showHouse = false, onReply }: ReviewCardProps) {
  const formatDateStr = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy年MM月dd日', { locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* 用户信息 */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.user.avatar || undefined} />
            <AvatarFallback className="bg-champagne text-white">
              {review.user.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{review.user.name}</span>
              <span className="text-xs text-gray-400">{formatDateStr(review.createdAt)}</span>
            </div>
            
            <StarRating rating={review.rating} readonly size="sm" className="mt-1" />
          </div>
        </div>

        {/* 民宿信息（可选） */}
        {showHouse && review.house && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <img
              src={review.house.image}
              alt={review.house.title}
              className="w-12 h-12 rounded object-cover"
            />
            <span className="text-sm text-gray-600 truncate">{review.house.title}</span>
          </div>
        )}

        {/* 评价内容 */}
        {review.content && (
          <p className="mt-3 text-gray-600 text-sm leading-relaxed">
            {review.content}
          </p>
        )}

        {/* 评价图片 */}
        {review.images && review.images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {review.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`评价图片 ${idx + 1}`}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(img, '_blank')}
              />
            ))}
          </div>
        )}

        {/* 订单信息 */}
        {review.order && (
          <div className="mt-3 text-xs text-gray-400">
            入住日期：{review.order.checkIn} ~ {review.order.checkOut}
          </div>
        )}

        {/* 管理员回复 */}
        {review.reply && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <MessageSquare className="h-4 w-4" />
              <span>回复</span>
              {review.replyAt && (
                <span className="text-xs text-blue-500 ml-auto">
                  {formatDateStr(review.replyAt)}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-blue-600">{review.reply}</p>
          </div>
        )}

        {/* 回复按钮（管理员可见） */}
        {onReply && !review.reply && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onReply(review)}
              className="text-sm text-champagne hover:underline"
            >
              回复评价
            </button>
          </div>
        )}

        {/* 状态标签 */}
        {review.status === 'hidden' && (
          <Badge variant="secondary" className="mt-2">已隐藏</Badge>
        )}
      </CardContent>
    </Card>
  );
}

// 评价列表
interface ReviewListProps {
  reviews: Review[];
  showHouse?: boolean;
  onReply?: (review: Review) => void;
  loading?: boolean;
}

export function ReviewList({ reviews, showHouse = false, onReply, loading }: ReviewListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex gap-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">暂无评价</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          showHouse={showHouse}
          onReply={onReply}
        />
      ))}
    </div>
  );
}
