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
      <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="border-blue-200">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">预订成功</h2>
              <p className="text-gray-600 mb-6">您的票务预订已提交，我们会尽快为您安排。</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-blue-300"
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
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">票务预订</CardTitle>
                <CardDescription>预订景点、表演、游艇等票务</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber">房号 <span className="text-red-500">*</span></Label>
                <Input
                  id="roomNumber"
                  placeholder="请输入您的房号，如：A101"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="border-blue-200 focus:border-blue-400"
                  required
                />
              </div>

              {/* Ticket Selection */}
              <div className="space-y-2">
                <Label>
                  选择票务 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-blue-600">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {configs.length === 0 ? (
                  <p className="text-gray-500 text-sm">暂无可预订票务</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-lg border-2 transition-all overflow-hidden relative ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {formData.selectedConfig?.id === config.id && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                            ✓ 已选中
                          </div>
                        )}
                        <div className="aspect-video bg-gray-100">
                          {config.image ? (
                            <img src={config.image} alt={config.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <Ticket size={32} />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium">{config.name}</h4>
                            <Badge className="bg-blue-100 text-blue-800">฿{config.price}/张</Badge>
                          </div>
                          <Badge variant="outline" className="mb-1">{config.ticketType}</Badge>
                          <p className="text-sm text-gray-500 whitespace-pre-wrap">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-red-500 mt-2">请点击上方卡片选择一个票务</p>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">预订数量 <span className="text-red-500">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={20}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="border-blue-200 focus:border-blue-400 w-32"
                  required
                />
              </div>

              {/* Visit Date */}
              <div className="space-y-2">
                <Label htmlFor="visitDate">
                  <CalendarDays className="inline w-4 h-4 mr-1" />
                  期望参观日期 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="border-blue-200 focus:border-blue-400 w-48"
                  required
                />
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-blue-200 focus:border-blue-400 min-h-[100px]"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">{formData.selectedConfig.name}</span>
                    <span>฿{formData.selectedConfig.price} × {formData.quantity}张</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex items-center justify-between font-semibold text-lg">
                    <span>总计</span>
                    <span className="text-blue-600">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12"
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
