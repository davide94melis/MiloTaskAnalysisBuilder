import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { DashboardPageComponent } from './features/dashboard/dashboard-page.component';
import { LoginBridgeComponent } from './features/auth/login-bridge.component';
import { LibraryPageComponent } from './features/library/library-page.component';
import { TaskShellEditorEntryComponent } from './features/library/task-shell-editor-entry.component';
import { TaskGuidedPresentPageComponent } from './features/present/task-guided-present-page.component';
import { TaskPlaybackPreviewPageComponent } from './features/present/task-playback-preview-page.component';
import { TaskPrintExportPageComponent } from './features/present/task-print-export-page.component';
import { TaskSharedViewPageComponent } from './features/present/task-shared-view-page.component';
import { MainLayoutComponent } from './layout/main-layout.component';

export const appRoutes: Routes = [
  {
    path: 'auth/login',
    component: LoginBridgeComponent
  },
  {
    path: 'auth/register',
    component: LoginBridgeComponent
  },
  {
    path: 'shared/:token',
    component: TaskSharedViewPageComponent
  },
  {
    path: 'shared/:token/present',
    component: TaskGuidedPresentPageComponent
  },
  {
    path: '',
    canActivate: [authGuard],
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        component: DashboardPageComponent
      },
      {
        path: 'library',
        component: LibraryPageComponent
      },
      {
        path: 'tasks/new',
        component: TaskShellEditorEntryComponent
      },
      {
        path: 'tasks/:taskId/preview',
        component: TaskPlaybackPreviewPageComponent
      },
      {
        path: 'tasks/:taskId/present',
        component: TaskGuidedPresentPageComponent
      },
      {
        path: 'tasks/:taskId/export',
        component: TaskPrintExportPageComponent
      },
      {
        path: 'tasks/:taskId',
        component: TaskShellEditorEntryComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
