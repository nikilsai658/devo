import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

import { Monitoring } from './monitoring';
import { setApiBase } from '../../../core/api/api-base';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('Monitoring', () => {
  let fixture: ComponentFixture<Monitoring>;
  let backend: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['VIEW_MONITORING']);
    await TestBed.configureTestingModule({ imports: [Monitoring], providers: testProviders() }).compileComponents();
    fixture = TestBed.createComponent(Monitoring);
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    backend.expectOne(`${API}/Monitoring/dashboards`).flush({ data: [] });
  });

  it('embeds an https dashboard link in a sandboxed frame', () => {
    backend.expectOne(r => r.url === `${API}/Monitoring/embed`).flush({ data: { url: 'https://grafana.example.test/d/x' } });
    fixture.detectChanges();
    const frame = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toBe('https://grafana.example.test/d/x');
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts');
  });

  it('never embeds a non-https link (e.g. javascript:)', () => {
    backend.expectOne(r => r.url === `${API}/Monitoring/embed`).flush({ data: { url: 'javascript:alert(1)' } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.componentInstance.frameUrl).toBeNull();
  });
});
