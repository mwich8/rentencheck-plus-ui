import { Directive, ElementRef, inject, input, afterNextRender, DestroyRef } from '@angular/core';

/**
 * Adds a CSS class when the host element enters the viewport.
 * Usage: <div appScrollAnimate> or <div appScrollAnimate="slideInLeft">
 */
@Directive({
  selector: '[appScrollAnimate]',
  standalone: true,
})
export class ScrollAnimateDirective {
  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Animation class to add. Defaults to 'animate-visible'. */
  readonly animation = input<string>('animate-visible', { alias: 'appScrollAnimate' });

  /** Delay class (e.g., 'delay-1', 'delay-2') */
  readonly animateDelay = input<string>('', { alias: 'appScrollAnimateDelay' });

  constructor() {
    afterNextRender(() => {
      const el = this.el.nativeElement as HTMLElement;
      el.classList.add('animate-on-scroll');

      if (this.animateDelay()) {
        el.classList.add(this.animateDelay());
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              el.classList.add(this.animation() || 'animate-visible');
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
      );

      observer.observe(el);

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}

