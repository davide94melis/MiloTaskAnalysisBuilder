import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { MiloAuthService } from './milo-auth.service';
import { authInterceptor } from './auth.interceptor';
import { AppConfigService } from '../config/app-config.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: MiloAuthService;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        AppConfigService,
        MiloAuthService,
        { provide: Router, useValue: router },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(MiloAuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('adds the bearer token to api requests', () => {
    auth.acceptTokenHandoff('milo-token');

    http.get('/api/auth/me').subscribe();

    const request = httpMock.expectOne('/api/auth/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer milo-token');
    request.flush({});
  });

  it('logs out and redirects on 401 responses', () => {
    spyOn(auth, 'logout').and.callThrough();
    auth.acceptTokenHandoff('milo-token');

    http.get('/api/auth/me').subscribe({
      error: () => undefined
    });

    const request = httpMock.expectOne('/api/auth/me');
    request.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
