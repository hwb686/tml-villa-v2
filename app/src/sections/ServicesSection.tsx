import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Home, Car, Ticket, UtensilsCrossed, Bot, Languages } from 'lucide-react';

const serviceIcons = { homestay: Home, car: Car, ticket: Ticket, dining: UtensilsCrossed, ai: Bot, language: Languages };
const serviceKeys = ['homestay', 'car', 'ticket', 'dining', 'ai', 'language'] as const;

export default function ServicesSection() {
  const { t } = useLanguage();
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="services" className="section-padding bg-cream">
      <div className="container-luxury">
        <div ref={titleRef} className={`text-center mb-16 transition-all duration-600 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-serif text-3xl lg:text-4xl text-ink mb-4">{t.services.title}</h2>
          <p className="text-warm-gray text-lg max-w-2xl mx-auto">{t.services.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {serviceKeys.map((key, index) => {
            const Icon = serviceIcons[key];
            const service = (t.services.items as any)[key];
            return <ServiceCard key={key} icon={Icon} title={service.title} description={service.desc} delay={index * 100} />;
          })}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  return (
    <div ref={ref} className={`card-luxury group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex flex-col items-start">
        <div className="w-14 h-14 rounded-xl bg-champagne/10 flex items-center justify-center mb-5 group-hover:bg-champagne/20 transition-colors">
          <Icon className="w-7 h-7 text-champagne" />
        </div>
        <h3 className="font-serif text-xl text-ink mb-3">{title}</h3>
        <p className="text-warm-gray text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
