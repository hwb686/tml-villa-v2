import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const partners = ['Airbnb', 'Booking.com', 'Agoda', 'Grab', 'Line', 'Klook'];

export default function PartnersSection() {
  const { t } = useLanguage();
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="container-luxury">
        <div ref={titleRef} className={`text-center mb-12 transition-all duration-600 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-serif text-2xl lg:text-3xl text-ink">{t.partners.title}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {partners.map((partner, index) => <PartnerLogo key={partner} name={partner} delay={index * 50} />)}
        </div>
      </div>
    </section>
  );
}

function PartnerLogo({ name, delay }: { name: string; delay: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  return (
    <div ref={ref} className={`group transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="px-6 py-3 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
        <span className="font-serif text-xl text-charcoal group-hover:text-champagne transition-colors">{name}</span>
      </div>
    </div>
  );
}
