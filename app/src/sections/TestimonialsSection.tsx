import { useLanguage } from '@/hooks/useLanguage';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Quote } from 'lucide-react';

const testimonialKeys = ['zhang', 'sarah', 'li'] as const;

export default function TestimonialsSection() {
  const { t } = useLanguage();
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section className="section-padding bg-cream">
      <div className="container-luxury">
        <div ref={titleRef} className={`text-center mb-16 transition-all duration-600 ${titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-serif text-3xl lg:text-4xl text-ink mb-4">{t.testimonials.title}</h2>
          <p className="text-warm-gray text-lg">{t.testimonials.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonialKeys.map((key, index) => {
            const testimonial = (t.testimonials.users as any)[key];
            return <TestimonialCard key={key} name={testimonial.name} role={testimonial.role} content={testimonial.content} delay={index * 100} />;
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ name, role, content, delay }: { name: string; role: string; content: string; delay: number }) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  return (
    <div ref={ref} className={`card-luxury relative transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <Quote className="w-8 h-8 text-champagne/30 mb-4" />
      <p className="text-charcoal text-sm leading-relaxed mb-6">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-champagne/20 flex items-center justify-center">
          <span className="text-champagne font-medium text-sm">{name.charAt(0)}</span>
        </div>
        <div>
          <div className="font-medium text-ink text-sm">{name}</div>
          <div className="text-warm-gray text-xs">{role}</div>
        </div>
      </div>
    </div>
  );
}
