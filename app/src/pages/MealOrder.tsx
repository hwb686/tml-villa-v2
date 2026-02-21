import { useState, useEffect } from 'react';
import { mealApi, mealConfigApi, type MealConfig } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Utensils, ArrowLeft, CheckCircle, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function MealOrderPage() {
  const navigate = (path: string) => {
    window.location.hash = path;
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configs, setConfigs] = useState<MealConfig[]>([]);
  const [activeTab, setActiveTab] = useState('BREAKFAST');
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    selectedConfig: null as MealConfig | null,
    peopleCount: 1,
    remark: '',
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await mealConfigApi.getAll({ isActive: true });
      setConfigs(response.data);
    } catch (err) {
      console.error('Error fetching meal configs:', err);
    }
  };

  const filteredConfigs = configs.filter(c => c.mealType === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.roomNumber) {
      setError('请输入房号');
      return;
    }
    if (!formData.selectedConfig) {
      setError('请选择套餐');
      return;
    }

    setIsLoading(true);

    try {
      await mealApi.create({
        roomNumber: formData.roomNumber,
        mealConfigId: formData.selectedConfig.id,
        peopleCount: formData.peopleCount,
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
    ? formData.selectedConfig.price * formData.peopleCount 
    : 0;

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] py-12 px-4 animate-fade-in">
        <div className="max-w-md mx-auto">
          <Card className="border-champagne/20 shadow-card">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-champagne/10 flex items-center justify-center mx-auto mb-6 animate-scale-in">
                <CheckCircle className="w-10 h-10 text-champagne" />
              </div>
              <h2 className="text-2xl font-serif font-medium text-ink mb-2">订餐登记成功</h2>
              <p className="text-warm-gray mb-8">您的订餐信息已提交，我们会尽快为您安排。</p>
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
                      peopleCount: 1,
                      remark: '',
                    });
                  }}
                  className="bg-champagne hover:bg-champagne-dark text-white rounded-lg"
                >
                  继续订餐
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-warm-gray hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <Card className="border-champagne/20 shadow-card overflow-hidden">
          <CardHeader className="relative h-[200px] overflow-hidden p-0">
            <img
              src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&auto=format&fit=crop"
              alt="Dining"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
            <div className="relative z-10 p-6 flex items-end h-full">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-champagne rounded-xl backdrop-blur-sm">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-serif font-medium text-white">订餐登记</CardTitle>
                  <CardDescription className="text-white/80">选择您喜欢的套餐</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4 rounded-lg border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Room Number */}
              <div className="space-y-2">
                <Label htmlFor="roomNumber" className="text-ink font-medium">房号 <span className="text-red-500">*</span></Label>
                <Input
                  id="roomNumber"
                  placeholder="请输入您的房号，如：A101"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="border-champagne/30 focus:border-champagne rounded-lg transition-colors"
                  required
                />
              </div>

              {/* Meal Type Tabs */}
              <div className="space-y-2">
                <Label className="text-ink font-medium">选择用餐类型</Label>
                <Tabs value={activeTab} onValueChange={(value) => {
                  setActiveTab(value);
                  // 切换用餐类型时清空已选配置
                  setFormData({ ...formData, selectedConfig: null });
                }}>
                  <TabsList className="grid w-full grid-cols-2 bg-champagne/5 rounded-lg p-1">
                    <TabsTrigger 
                      value="BREAKFAST"
                      className="rounded-md data-[state=active]:bg-champagne data-[state=active]:text-white transition-all"
                    >
                      早餐
                    </TabsTrigger>
                    <TabsTrigger 
                      value="DINNER"
                      className="rounded-md data-[state=active]:bg-champagne data-[state=active]:text-white transition-all"
                    >
                      晚餐
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Meal Config Selection */}
              <div className="space-y-2">
                <Label className="text-ink font-medium">
                  选择套餐 <span className="text-red-500">*</span>
                  {formData.selectedConfig && (
                    <span className="ml-2 text-sm font-normal text-champagne">
                      ✓ 已选择: {formData.selectedConfig.name}
                    </span>
                  )}
                </Label>
                {filteredConfigs.length === 0 ? (
                  <p className="text-warm-gray text-sm">暂无{activeTab === 'BREAKFAST' ? '早餐' : '晚餐'}套餐</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredConfigs.map((config) => (
                      <div
                        key={config.id}
                        onClick={() => setFormData({ ...formData, selectedConfig: config })}
                        className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden relative group ${
                          formData.selectedConfig?.id === config.id
                            ? 'border-champagne ring-2 ring-champagne/20 bg-champagne/5'
                            : 'border-champagne/20 hover:border-champagne/50 hover:shadow-md'
                        }`}
                      >
                        {formData.selectedConfig?.id === config.id && (
                          <div className="absolute top-3 left-3 bg-champagne text-white text-xs px-2.5 py-1 rounded-full z-10 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            已选中
                          </div>
                        )}
                        <div className="aspect-video bg-cream">
                          {config.image ? (
                            <img src={config.image} alt={config.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-champagne/40">
                              <Utensils size={32} />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-serif font-medium text-ink">{config.name}</h4>
                            <Badge className="bg-champagne/10 text-champagne border-none font-medium">฿{config.price}/人</Badge>
                          </div>
                          <p className="text-sm text-warm-gray whitespace-pre-wrap line-clamp-2">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {!formData.selectedConfig && (
                  <p className="text-sm text-champagne mt-2">请点击上方卡片选择一个套餐</p>
                )}
              </div>

              {/* People Count */}
              <div className="space-y-2">
                <Label htmlFor="peopleCount" className="text-ink font-medium">用餐人数 <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="peopleCount"
                    type="number"
                    min={1}
                    max={20}
                    value={formData.peopleCount}
                    onChange={(e) => setFormData({ ...formData, peopleCount: parseInt(e.target.value) || 1 })}
                    className="border-champagne/30 focus:border-champagne w-32 rounded-lg transition-colors"
                    required
                  />
                  <Users className="text-champagne/60" size={20} />
                </div>
              </div>

              {/* Remark */}
              <div className="space-y-2">
                <Label htmlFor="remark" className="text-ink font-medium">备注说明</Label>
                <Textarea
                  id="remark"
                  placeholder="如有特殊需求请在此说明（如素食、儿童座椅等）"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="border-champagne/30 focus:border-champagne min-h-[100px] rounded-lg transition-colors resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-warm-gray text-right">{formData.remark.length}/200</p>
              </div>

              {/* Price Summary */}
              {formData.selectedConfig && (
                <div className="bg-gradient-to-r from-champagne/10 to-champagne/5 rounded-xl p-5 border border-champagne/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-warm-gray">{formData.selectedConfig.name}</span>
                    <span className="text-ink">฿{formData.selectedConfig.price} × {formData.peopleCount}人</span>
                  </div>
                  <div className="border-t border-champagne/20 pt-3 flex items-center justify-between">
                    <span className="font-serif font-medium text-lg text-ink">总计</span>
                    <span className="font-serif text-2xl font-medium text-champagne">฿{totalPrice}</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.selectedConfig}
                className="w-full bg-champagne hover:bg-champagne-dark text-white h-12 rounded-lg text-base font-medium transition-all duration-200 hover:shadow-lg hover:shadow-champagne/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  '提交订餐登记'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
