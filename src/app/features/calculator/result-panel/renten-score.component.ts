import { Component, input, computed, inject } from '@angular/core';
import { PensionResult } from '../../../core/models/pension-result.model';
import { RentenScoreService, RentenScore } from '../../../core/services/renten-score.service';

/**
 * Visual gauge showing a 0–100 "Renten-Score" with letter grade,
 * circular progress ring, and benchmark comparison.
 */
@Component({
  selector: 'app-renten-score',
  standalone: true,
  template: `
    <div class="score-container">
      <div class="score-gauge">
        <!-- SVG circular gauge -->
        <svg viewBox="0 0 120 120" class="gauge-svg">
          <!-- Background circle -->
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke="#f1f5f9"
            stroke-width="10"
          />
          <!-- Progress arc -->
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            [attr.stroke]="scoreData().color"
            stroke-width="10"
            stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="dashOffset()"
            class="gauge-progress"
            transform="rotate(-90 60 60)"
          />
        </svg>

        <div class="gauge-content">
          <span class="gauge-score">{{ scoreData().score }}</span>
          <span class="gauge-label">von 100</span>
        </div>
      </div>

      <div class="score-info">
        <div class="grade-badge" [style.background]="scoreData().bgColor" [style.color]="scoreData().color">
          <span class="grade-letter">{{ scoreData().grade }}</span>
          <span class="grade-label">{{ scoreData().label }}</span>
        </div>

        <div class="benchmark">
          <div class="benchmark-bar">
            <div class="benchmark-fill" [style.width.%]="scoreData().percentile"></div>
            <div class="benchmark-marker" [style.left.%]="scoreData().percentile">
              <span class="marker-dot"></span>
            </div>
          </div>
          <p class="benchmark-text">
            Besser als <strong>{{ scoreData().percentile }}%</strong> der Deutschen*
          </p>
          <p class="benchmark-disclaimer">* Schätzung basierend auf Durchschnittswerten</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .score-container {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: var(--radius-md);
      margin: 1rem 0;
    }

    .score-gauge {
      position: relative;
      width: 110px;
      height: 110px;
      flex-shrink: 0;
    }

    .gauge-svg {
      width: 100%;
      height: 100%;
    }

    .gauge-progress {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                  stroke 0.3s ease;
    }

    .gauge-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .gauge-score {
      font-size: 2rem;
      font-weight: 900;
      line-height: 1;
      color: var(--color-primary);
      font-variant-numeric: tabular-nums;
    }

    .gauge-label {
      font-size: 0.65rem;
      color: var(--color-text-light);
      font-weight: 500;
      margin-top: 2px;
    }

    .score-info {
      flex: 1;
      min-width: 0;
    }

    .grade-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.75rem;
    }

    .grade-letter {
      font-size: 1.35rem;
      font-weight: 900;
      line-height: 1;
    }

    .grade-label {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .benchmark {
      width: 100%;
    }

    .benchmark-bar {
      width: 100%;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      position: relative;
      overflow: visible;
      margin-bottom: 0.5rem;
    }

    .benchmark-fill {
      height: 100%;
      border-radius: 4px;
      background: linear-gradient(90deg, #e94560, #f39c12, #27ae60);
      transition: width 0.8s ease;
    }

    .benchmark-marker {
      position: absolute;
      top: -3px;
      transform: translateX(-50%);
      transition: left 0.8s ease;
    }

    .marker-dot {
      display: block;
      width: 14px;
      height: 14px;
      background: white;
      border: 3px solid var(--color-primary);
      border-radius: 50%;
      box-shadow: var(--shadow-sm);
    }

    .benchmark-text {
      font-size: 0.88rem;
      color: var(--color-text);
      margin-bottom: 0.15rem;
    }

    .benchmark-text strong {
      color: var(--color-primary);
      font-weight: 800;
    }

    .benchmark-disclaimer {
      font-size: 0.68rem;
      color: var(--color-text-light);
      font-style: italic;
    }

    @media (max-width: 640px) {
      .score-container {
        flex-direction: column;
        text-align: center;
      }

      .score-gauge {
        width: 90px;
        height: 90px;
      }

      .gauge-score {
        font-size: 1.6rem;
      }
    }
  `],
})
export class RentenScoreComponent {
  private readonly scoreService = inject(RentenScoreService);

  readonly result = input.required<PensionResult>();
  readonly gewuenschteRente = input.required<number>();

  readonly circumference = 2 * Math.PI * 50; // r=50

  readonly scoreData = computed<RentenScore>(() => {
    return this.scoreService.computeScore(this.result(), this.gewuenschteRente());
  });

  readonly dashOffset = computed(() => {
    const score = this.scoreData().score;
    return this.circumference - (score / 100) * this.circumference;
  });
}

