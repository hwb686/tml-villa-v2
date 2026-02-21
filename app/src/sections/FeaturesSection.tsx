import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { MapPin, Shield, CreditCard, HeadphonesIcon } from 'lucide-react';

const featureIcons = { local: MapPin, quality: Shield, payment: CreditCard, support: HeadphonesIcon };
const featureKeys = ['local', 'quality', 'payment', 'support'] as const;

export default function FeaturesSection() {
  const { t } = useLanguage();
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation<HTMLDivElement>();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="features" className="section-padding bg-white">
      <div className="container-luxury">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref={imageRef} className={`relative transition-all duration-700 ${imageVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/images/feature-img.jpg" alt="Thai Spa Experience" className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-champagne/10 rounded-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-24 h-24 border-2 border-champagne/20 rounded-2xl -z-10" />
          </div>
          <div ref={contentRef} className={`transition-all duration-700 ${contentVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <h2 className="font-serif text-3xl lg:text-4xl text-ink mb-4">{t.features.title}</h2>
            <p className="text-warm-gray text-lg mb-10">{t.features.subtitle}</p>
            <div className="space-y-6">
              {featureKeys.map((key) => {
                const Icon = featureIcons[key];
                const feature = (t.features.list as any)[key];
                return (
                  <div key={key} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-champagne/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-champagne" />
                    </div>
                    <div>
                      <h4 className="font-medium text-ink mb-1">{feature.title}</h4>
                      <p className="text-sm text-warm-gray">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
