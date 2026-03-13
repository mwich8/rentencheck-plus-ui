import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should render the router outlet', () => {
    const el: HTMLElement = fixture.nativeElement;
    const outlet = el.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('should render the cookie consent component', () => {
    const el: HTMLElement = fixture.nativeElement;
    const consent = el.querySelector('app-cookie-consent');
    expect(consent).toBeTruthy();
  });
});

