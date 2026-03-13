import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MiloAuthService } from './milo-auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(MiloAuthService);
  const router = inject(Router);

  if (!auth.isHydrated()) {
    await auth.restoreSession();
  }

  return auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']);
};
