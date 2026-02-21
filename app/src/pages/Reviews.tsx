import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MessageSquare, Eye, EyeOff, Star, MapPin, Loader2 } from 'lucide-react';
import { reviewApi, type Review } from '@/services/api';
import { StarRating, RatingStats } from '@/components/review';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [stats, setStats] = useState<{
    average: number;
    total: number;
    distribution: { [key: number]: number };
  } | null>(null);
  
  // 回复相关
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getAll({ pageSize: 100 });
      setReviews(response.data.reviews);
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.house.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.content && review.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleReply = (review: Review) => {
    setSelectedReview(review);
    setReplyContent(review.reply || '');
    setReplyDialogOpen(true);
  };

  const submitReply = async () => {
    if (!selectedReview || !replyContent.trim()) return;
    
    try {
      setReplying(true);
      await reviewApi.reply(selectedReview.id, replyContent.trim());
      // 更新本地状态
      setReviews(prev => prev.map(r => 
        r.id === selectedReview.id 
          ? { ...r, reply: replyContent.trim(), replyAt: new Date().toISOString() }
          : r
      ));
      setReplyDialogOpen(false);
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('回复失败');
    } finally {
      setReplying(false);
    }
  };

  const toggleStatus = async (review: Review) => {
    const newStatus = review.status === 'active' ? 'hidden' : 'active';
    try {
      await reviewApi.updateStatus(review.id, newStatus);
      setReviews(prev => prev.map(r => 
        r.id === review.id ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('操作失败');
    }
  };

  const formatDateStr = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-champagne" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">评价管理</h1>
          <p className="text-sm text-gray-500 mt-1">查看、回复和管理用户评价</p>
        </div>
        <Button onClick={fetchReviews} variant="outline">
          刷新数据
        </Button>
      </div>

      {/* 评分统计 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              评分概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingStats
              average={stats.average}
              total={stats.total}
              distribution={stats.distribution}
            />
          </CardContent>
        </Card>
      )}

      {/* 筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索用户、民宿或评价内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">显示中</SelectItem>
                <SelectItem value="hidden">已隐藏</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="评分" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部评分</SelectItem>
                <SelectItem value="5">5 星</SelectItem>
                <SelectItem value="4">4 星</SelectItem>
                <SelectItem value="3">3 星</SelectItem>
                <SelectItem value="2">2 星</SelectItem>
                <SelectItem value="1">1 星</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 评价列表 */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">暂无评价数据</p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className={review.status === 'hidden' ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                {/* 用户和民宿信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={review.user.avatar || undefined} />
                      <AvatarFallback className="bg-champagne text-white">
                        {review.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user.name}</span>
                        {review.status === 'hidden' && (
                          <Badge variant="secondary">已隐藏</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{review.house.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={review.rating} readonly size="sm" />
                    <p className="text-xs text-gray-400 mt-1">{formatDateStr(review.createdAt)}</p>
                  </div>
                </div>

                {/* 评价内容 */}
                {review.content && (
                  <p className="text-gray-600 mb-4 pl-12">{review.content}</p>
                )}

                {/* 评价图片 */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4 pl-12">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`评价图片 ${idx + 1}`}
                        className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* 管理员回复 */}
                {review.reply && (
                  <div className="ml-12 p-3 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>房东回复</span>
                      {review.replyAt && (
                        <span className="text-xs text-blue-500 ml-auto">
                          {formatDateStr(review.replyAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-blue-600">{review.reply}</p>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2 pl-12">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReply(review)}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    {review.reply ? '修改回复' : '回复'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(review)}
                  >
                    {review.status === 'active' ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        隐藏
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        显示
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 回复对话框 */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>回复评价</DialogTitle>
            <DialogDescription>
              为 {selectedReview?.user.name} 的评价撰写回复
            </DialogDescription>
          </DialogHeader>
          
          {selectedReview && (
            <div className="space-y-4">
              {/* 原评价 */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={selectedReview.rating} readonly size="sm" />
                </div>
                {selectedReview.content && (
                  <p className="text-sm text-gray-600">{selectedReview.content}</p>
                )}
              </div>

              {/* 回复输入 */}
              <div>
                <label className="text-sm font-medium mb-2 block">回复内容</label>
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="输入您的回复..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {replyContent.length}/500
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={submitReply} 
              disabled={!replyContent.trim() || replying}
              className="bg-champagne hover:bg-champagne-dark"
            >
              {replying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                '提交回复'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
