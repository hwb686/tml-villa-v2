import { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { ChevronDown } from 'lucide-react';

export default function HeroSection() {
  const { t } = useLanguage();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToServices = () => {
    const element = document.querySelector('#services');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-bg.jpg" alt="Thailand Resort" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>
      <div className="relative z-10 container-luxury text-center pt-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white mb-6 leading-tight"
            style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s' }}>
            {t.hero.title}
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-10 font-light"
            style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.6s ease-out 0.5s, transform 0.6s ease-out 0.5s' }}>
            {t.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4"
            style={{ opacity: isLoaded ? 1 : 0, transform: isLoaded ? 'translateY(0)' : 'translateY(30px)', transition: 'opacity 0.6s ease-out 0.7s, transform 0.6s ease-out 0.7s' }}>
            <button className="btn-primary min-w-[160px]">{t.hero.ctaPrimary}</button>
            <button onClick={scrollToServices} className="btn-outline border-white text-white hover:bg-white hover:text-ink min-w-[160px]">
              {t.hero.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: isLoaded ? 1 : 0, transition: 'opacity 0.6s ease-out 1s' }}>
        <button onClick={scrollToServices} className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="animate-bounce" size={20} />
        </button>
      </div>
    </section>
  );
}
