import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { MiloAuthService } from './milo-auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(MiloAuthService);
  const router = inject(Router);
  const config = inject(AppConfigService);
  const token = auth.getAccessToken();
  const miloApiBaseUrl = config.miloApiBaseUrl.replace(/\/+$/, '');
  const isMiloApiRequest = req.url.startsWith(miloApiBaseUrl);
  const isAppApiRequest = req.url.includes('/api/') && !isMiloApiRequest;

  const authReq =
    token && isAppApiRequest
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        })
      : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.logout();
        void router.navigateByUrl('/auth/login');
      }

      return throwError(() => error);
    })
  );
};
