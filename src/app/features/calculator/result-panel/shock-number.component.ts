import { Component, input, computed, signal, effect, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { EuroPipe } from '../../../shared/pipes/euro.pipe';
import { PensionResult } from '../../../core/models/pension-result.model';

/**
 * The "Shock Number" — displays the real purchasing power with dramatic emphasis.
 * Animates when the value changes for maximum emotional impact.
 */
@Component({
  selector: 'app-shock-number',
  standalone: true,
  imports: [EuroPipe, DecimalPipe],
  templateUrl: './shock-number.component.html',
  styleUrls: ['./shock-number.component.scss'],
})
export class ShockNumberComponent implements OnDestroy {
  readonly result = input.required<PensionResult>();

  readonly isCritical = computed(() => this.result().deckungsquote < 50);

  /** Animated display value for the count-up effect */
  readonly displayValue = signal(0);

  private animationFrameId: number | null = null;
  private previousTarget = 0;

  constructor() {
    effect(() => {
      const target = this.result().realeKaufkraftMonatlich;
      this.animateCountUp(this.previousTarget, target);
      this.previousTarget = target;
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private animateCountUp(from: number, to: number): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const duration = 600; // ms
    const start = performance.now();

    const step = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      this.displayValue.set(Math.round(current * 100) / 100);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.displayValue.set(to);
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(step);
  }
}

