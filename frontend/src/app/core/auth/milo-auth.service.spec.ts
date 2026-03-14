import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  it('logs in against the Milo auth API and stores the returned token', async () => {
    const loginPromise = firstValueFrom(
      service.login({
        email: 'teacher@example.com',
        password: 'Secret123!'
      })
    );

    const request = httpMock.expectOne('http://localhost:8081/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'teacher@example.com',
      password: 'Secret123!'
    });

    request.flush({
      token: 'milo-token-1',
      user: {
        id: 'milo-user-1',
        email: 'teacher@example.com'
      }
    });

    await expectAsync(loginPromise).toBeResolved();
    expect(service.getAccessToken()).toBe('milo-token-1');
  });

  it('registers against the Milo auth API and stores the returned token', async () => {
    const registerPromise = firstValueFrom(
      service.register({
        email: 'new@example.com',
        password: 'Secret123!'
      })
    );

    const request = httpMock.expectOne('http://localhost:8081/api/auth/register');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'new@example.com',
      password: 'Secret123!'
    });

    request.flush({
      token: 'milo-token-2',
      user: {
        id: 'milo-user-2',
        email: 'new@example.com'
      }
    });

    await expectAsync(registerPromise).toBeResolved();
    expect(service.getAccessToken()).toBe('milo-token-2');
  });

  it('builds local login and register urls that preserve intent context', () => {
    expect(
      service.buildLoginBridgeUrl({
        intent: 'duplicate-share',
        shareToken: 'share-view-1',
        redirectTo: '/shared/share-view-1'
      })
    ).toBe('/auth/login?intent=duplicate-share&shareToken=share-view-1&redirectTo=%2Fshared%2Fshare-view-1');

    expect(
      service.buildRegisterUrl({
        intent: 'duplicate-share',
        shareToken: 'share-view-1',
        redirectTo: '/shared/share-view-1'
      })
    ).toBe('/auth/register?intent=duplicate-share&shareToken=share-view-1&redirectTo=%2Fshared%2Fshare-view-1');
  });
});
