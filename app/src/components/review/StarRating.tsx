import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className,
}: StarRatingProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          disabled={readonly}
          className={cn(
            'transition-colors',
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              sizeMap[size],
              value <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// 评分统计条
interface RatingBarProps {
  rating: number;
  count: number;
  total: number;
}

export function RatingBar({ rating, count, total }: RatingBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-gray-600">{rating} 星</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-gray-500 text-right">{count}</span>
    </div>
  );
}

// 评分统计概览
interface RatingStatsProps {
  average: number;
  total: number;
  distribution: { [key: number]: number };
}

export function RatingStats({ average, total, distribution }: RatingStatsProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 rounded-xl">
      {/* 总体评分 */}
      <div className="flex flex-col items-center justify-center md:w-32">
        <span className="text-4xl font-bold text-ink">{average.toFixed(1)}</span>
        <StarRating rating={Math.round(average)} readonly size="sm" className="mt-2" />
        <span className="text-sm text-gray-500 mt-1">{total} 条评价</span>
      </div>
      
      {/* 分布图 */}
      <div className="flex-1 space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <RatingBar
            key={rating}
            rating={rating}
            count={distribution[rating] || 0}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}
