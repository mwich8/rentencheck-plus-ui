import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling, withViewTransitions, withPreloading, PreloadAllModules } from '@angular/router';
import { provideEchartsCore } from 'ngx-echarts';
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkPointComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import * as echarts from 'echarts/core';
import { routes } from './app.routes';

echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, MarkPointComponent, CanvasRenderer]);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes, withPreloading(PreloadAllModules), withViewTransitions(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideEchartsCore({ echarts }),
  ],
};

