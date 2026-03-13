import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MiloAuthService } from './milo-auth.service';
import { AppConfigService } from '../config/app-config.service';

describe('MiloAuthService', () => {
  let service: MiloAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [AppConfigService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MiloAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('restores an existing token by calling /auth/me and persisting the returned user', async () => {
    service.acceptTokenHandoff('token-123');

    const restorePromise = service.restoreSession();
    const request = httpMock.expectOne('http://localhost:8080/api/auth/me');

    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'user-1',
      miloUserId: 'milo-1',
      email: 'teacher@example.com'
    });

    await expectAsync(restorePromise).toBeResolvedTo({
      id: 'user-1',
      miloUserId: 'milo-1',
      email: 'teacher@example.com'
    });
    expect(service.isHydrated()).toBeTrue();
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.currentUser()).toEqual({
      id: 'user-1',
      miloUserId: 'milo-1',
      email: 'teacher@example.com'
    });
  });

  it('clears auth state when restoreSession receives an error', async () => {
    service.acceptTokenHandoff('token-123');

    const restorePromise = service.restoreSession();
    const request = httpMock.expectOne('http://localhost:8080/api/auth/me');
    request.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(restorePromise).toBeResolvedTo(null);
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('milo_task_builder_token')).toBeNull();
  });
});
