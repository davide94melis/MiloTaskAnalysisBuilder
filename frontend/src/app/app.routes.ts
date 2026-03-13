import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { LoginBridgeComponent } from './features/auth/login-bridge.component';
import { MainLayoutComponent } from './layout/main-layout.component';

export const appRoutes: Routes = [
  {
    path: 'auth/login',
    component: LoginBridgeComponent
  },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
