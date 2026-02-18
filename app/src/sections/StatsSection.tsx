import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

function StatItem({ value, suffix, label, delay, isVisible }: { value: number; suffix: string; label: string; delay: number; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime - delay;
      if (elapsed < 0) { requestAnimationFrame(animate); return; }
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(value * easeOut));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(value);
    };
    requestAnimationFrame(animate);
  }, [isVisible, value, delay]);

  return (
    <div className="text-center">
      <div className="font-serif text-4xl lg:text-5xl text-champagne mb-2">{count.toLocaleString()}{suffix}</div>
      <div className="text-white/70 text-sm">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  const { t } = useLanguage();
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.3 });

  const stats = [
    { value: 10000, suffix: '+', label: t.stats.properties },
    { value: 50000, suffix: '+', label: t.stats.users },
    { value: 500, suffix: '+', label: t.stats.partners },
    { value: 99, suffix: '%', label: t.stats.rating },
  ];

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-r from-ink to-charcoal">
      <div className="container-luxury">
        <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <StatItem key={index} value={stat.value} suffix={stat.suffix} label={stat.label} delay={index * 150} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  );
}
