import { Directive, ElementRef, inject, input, afterNextRender, DestroyRef } from '@angular/core';

/**
 * Animates a number from 0 to the target value when the element enters the viewport.
 * Usage: <span [appCountUp]="48" countUpSuffix="%"></span>
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true,
})
export class CountUpDirective {
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly target = input.required<number>({ alias: 'appCountUp' });
  readonly suffix = input<string>('', { alias: 'countUpSuffix' });
  readonly prefix = input<string>('', { alias: 'countUpPrefix' });
  readonly duration = input<number>(2000, { alias: 'countUpDuration' });
  readonly decimals = input<number>(0, { alias: 'countUpDecimals' });

  constructor() {
    afterNextRender(() => {
      const el = this.el.nativeElement as HTMLElement;
      el.textContent = `${this.prefix()}0${this.suffix()}`;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.animate(el);
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.5 }
      );

      observer.observe(el);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  private animate(el: HTMLElement): void {
    const target = this.target();
    const duration = this.duration();
    const decimals = this.decimals();
    const prefix = this.prefix();
    const suffix = this.suffix();
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      const formatted = decimals > 0
        ? current.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(current).toLocaleString('de-DE');

      el.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}

