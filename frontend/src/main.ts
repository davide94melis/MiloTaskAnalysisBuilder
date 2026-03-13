import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { AppConfigService } from './app/core/config/app-config.service';
import { authInterceptor } from './app/core/auth/auth.interceptor';

function initializeApp(config: AppConfigService): () => Promise<unknown> {
  return () => config.load();
}

void bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeApp,
      deps: [AppConfigService]
    }
  ]
}).catch((error) => {
  console.error('Failed to bootstrap Milo Task Analysis Builder frontend', error);
});
