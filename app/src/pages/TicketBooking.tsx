import { useState, useEffect } from 'react';
import { ticketApi, ticketConfigApi, type TicketConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Ticket, ArrowLeft, CheckCircle, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TicketBookingPage() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<TicketConfig[]>([]);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    selectedConfig: null as TicketConfig | null,
    quantity: 1,
    visitDate: '',
    remark: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await ticketConfigApi.getAll({ isActive: true });
      setConfigs(response.data);
    } catch (err) {
      console.error('Error fetching ticket configs:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.roomNumber) {
      setError('请输入房号');
      return;
    }
    if (!formData.selectedConfig) {
      setError('请选择票务');
      return;
    }
    if (!formData.visitDate) {
      setError('请选择期望参观日期');
      return;
    }

    setIsLoading(true);

    try {
      await ticketApi.create({
        roomNumber: formData.roomNumber,
        ticketConfigId: formData.selectedConfig.id,
        quantity: formData.quantity,
        visitDate: formData.visitDate || undefined,
        remark: formData.remark,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const totalPrice = formData.selectedConfig 
    ? formData.selectedConfig.price * formData.quantity 
    : 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream py-12 px-4 animate-fade-in">
        <div className="max-w-md mx-auto">
          <Card className="border-champagne/20 shadow-card">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 bg-champagne/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-champagne" />
              </div>
              <h2 className="text-2xl font-serif font-semibold text-ink mb-2">预订成功</h2>
              <p className="text-warm-gray mb-6">您的票务预订已提交，我们会尽快为您安排。</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-champagne text-champagne hover:bg-champagne hover:text-white rounded-lg"
                >
                  返回首页
                </Button>
                <Button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({
                      roomNumber: '',
                      selectedConfig: null,
                      quantity: 1,
                      visitDate: '',
                      remark: '',
                    });
                  }}
                  className="bg-champagne hover:bg-champagne-dark text-white rounded-lg"
                >
                  继续预订
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-warm-gray hover:text-ink hover:bg-champagne/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-champagne/20 shadow-card">
          <CardHeader className="relative h-[200px] overflow-hidden p-0">
            <img 
              src="https://images.unsplash.com/photo-1553603227-2358aabe821e?w=1200&auto=format&fit=crop" 
              alt="Ticket Booking" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
            <div className="relative z-10 p-6 flex items-end h-full">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-champagne rounded-xl backdrop-blur-sm shadow-lg">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-serif font-medium text-white">票务预订</CardTitle>
                  <CardDescription className="text-white/80">预订景点、表演、游艇等票务</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-ink">房号 <span className="text-red-500">*</span></Label>
                <Input
                  id="roomNumber"
                  placeholder="请输入您的房号，如：A101"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 rounded-lg"
                  required
                />
              </div>

              {/* Ticket Selection */}
              <div className="space-y-2">
                <Label className="text-ink">
                  选择票务 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-champagne">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {configs.length === 0 ? (
                  <p className="text-warm-gray text-sm">暂无可预订票务</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden relative bg-white group ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-champagne shadow-card ring-1 ring-champagne/20'
                            : 'border-champagne/20 hover:border-champagne/50 hover:shadow-md'
                        }`}
                      >
                        {formData.selectedConfig?.id === config.id && (
                          <div className="absolute top-3 left-3 bg-champagne text-white text-xs px-2 py-1 rounded-full z-10 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            已选中
                          </div>
                        )}
                        <div className="aspect-video bg-cream">
                          {config.image ? (
                            <img 
                              src={config.image} 
                              alt={config.name} 
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-champagne/40">
                              <Ticket size={32} />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-ink font-serif">{config.name}</h4>
                            <Badge className="bg-champagne/10 text-champagne border-champagne/20">฿{config.price}/张</Badge>
                          </div>
                          <Badge variant="outline" className="mb-2 border-champagne/30 text-warm-gray">{config.ticketType}</Badge>
                          <p className="text-sm text-warm-gray whitespace-pre-wrap leading-relaxed">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-warm-gray mt-2">请点击上方卡片选择一个票务</p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-ink">预订数量 <span className="text-red-500">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 w-32 rounded-lg"
                  required
                />
              </div>

              {/* Visit Date */}
              <div className="space-y-2">
                <Label htmlFor="visitDate" className="text-ink">
                  <CalendarDays className="inline w-4 h-4 mr-1 text-champagne" />
                  期望参观日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 w-48 rounded-lg"
                  required
                />
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-ink">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne/20 min-h-[100px] rounded-lg"
                  maxLength={200}
                />
                <p className="text-xs text-warm-gray text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-champagne/5 rounded-xl p-5 border border-champagne/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-warm-gray">{formData.selectedConfig.name}</span>
                    <span className="text-ink">฿{formData.selectedConfig.price} × {formData.quantity}张</span>
                  </div>
                  <div className="border-t border-champagne/20 pt-3 flex items-center justify-between">
                    <span className="font-serif text-lg text-ink">总计</span>
                    <span className="font-serif text-2xl font-semibold text-champagne">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-champagne hover:bg-champagne-dark text-white h-12 rounded-lg text-base transition-all duration-300 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交预订'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
