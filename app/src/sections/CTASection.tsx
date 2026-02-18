import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function CTASection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="contact" className="py-20 lg:py-28 bg-gradient-to-r from-champagne to-champagne-dark">
      <div className="container-luxury">
        <div ref={ref} className={`text-center max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-serif text-3xl lg:text-4xl text-white mb-4">{t.cta.title}</h2>
          <p className="text-white/90 text-lg mb-10">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-champagne font-medium text-sm rounded-lg transition-all duration-200 hover:bg-off-white hover:-translate-y-0.5 min-w-[160px]">
              {t.cta.primary}
            </button>
            <button className="inline-flex items-center justify-center px-8 py-3.5 bg-transparent border border-white text-white font-medium text-sm rounded-lg transition-all duration-200 hover:bg-white/10 min-w-[160px]">
              {t.cta.secondary}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
