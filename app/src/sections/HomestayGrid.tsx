import HomestayCard from './HomestayCard';
import type { Homestay } from '@/services/api';

interface HomestayGridProps {
  homestays: Homestay[];
}

export default function HomestayGrid({ homestays }: HomestayGridProps) {
  if (homestays.length === 0) {
    return (
      <div className="container-luxury py-20 text-center">
        <p className="text-gray-500 text-lg">暂无符合条件的房源</p>
        <p className="text-gray-400 text-sm mt-2">请尝试其他筛选条件</p>
      </div>
    );
  }

  return (
    <div className="container-luxury py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {homestays.map((homestay) => (
          <HomestayCard key={homestay.id} homestay={homestay} />
        ))}
      </div>
    </div>
  );
}
