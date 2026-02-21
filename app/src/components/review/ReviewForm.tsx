import { useState, useRef } from 'react';
import { Star, ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import { reviewApi, type CreateReviewData, type Booking } from '@/services/api';

interface ReviewFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  booking: Booking | null;
}

export function ReviewForm({ open, onClose, onSuccess, booking }: ReviewFormProps) {
  const { lang } = useLanguage();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CONTENT_LENGTH = 200;
  const MAX_IMAGES = 3;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(lang === 'zh' ? `最多只能上传 ${MAX_IMAGES} 张图片` : `Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    // 转换为 base64（实际项目中应该上传到服务器）
    for (const file of Array.from(files)) {
      if (images.length >= MAX_IMAGES) break;
      
      try {
        const base64 = await fileToBase64(file);
        setImages(prev => [...prev, base64]);
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!booking) return;

    if (rating < 1) {
      setError(lang === 'zh' ? '请选择评分' : 'Please select a rating');
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(lang === 'zh' ? `评价内容不能超过 ${MAX_CONTENT_LENGTH} 字` : `Review content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: CreateReviewData = {
        orderId: booking.id,
        houseId: booking.homestayId,
        rating,
        content: content || undefined,
        images: images.length > 0 ? images : undefined,
      };

      await reviewApi.create(data);
      onSuccess();
      onClose();
      
      // 重置表单
      setRating(5);
      setContent('');
      setImages([]);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError(err.message || (lang === 'zh' ? '提交失败，请重试' : 'Failed to submit, please try again'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError(null);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {lang === 'zh' ? '评价订单' : 'Review Order'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 民宿信息 */}
          {booking.homestay && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <img
                src={booking.homestay.images?.[0] || '/images/placeholder.jpg'}
                alt={booking.homestay.title}
                className="w-16 h-16 rounded object-cover"
              />
              <div>
                <p className="font-medium text-ink">{booking.homestay.title}</p>
                <p className="text-sm text-gray-500">{booking.homestay.location}</p>
              </div>
            </div>
          )}

          {/* 评分 */}
          <div>
            <Label className="text-base font-medium">
              {lang === 'zh' ? '评分' : 'Rating'}
            </Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      value <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-medium text-gray-600">
                {rating} {lang === 'zh' ? '星' : 'Stars'}
              </span>
            </div>
          </div>

          {/* 评价内容 */}
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="content" className="text-base font-medium">
                {lang === 'zh' ? '评价内容' : 'Review Content'}
              </Label>
              <span className={`text-sm ${content.length > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                {content.length}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={lang === 'zh' ? '分享您的入住体验（选填，最多200字）' : 'Share your experience (optional, max 200 chars)'}
              className="mt-2"
              rows={4}
              maxLength={MAX_CONTENT_LENGTH}
            />
          </div>

          {/* 图片上传 */}
          <div>
            <Label className="text-base font-medium">
              {lang === 'zh' ? '上传图片' : 'Upload Images'}
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({lang === 'zh' ? '最多' : 'Max'} {MAX_IMAGES} {lang === 'zh' ? '张' : 'images'})
              </span>
            </Label>
            
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img
                    src={img}
                    alt={`上传图片 ${idx + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-champagne transition-colors"
                >
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                </button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {lang === 'zh' ? '取消' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-champagne hover:bg-champagne-dark"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {lang === 'zh' ? '提交中...' : 'Submitting...'}
              </>
            ) : (
              lang === 'zh' ? '提交评价' : 'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
