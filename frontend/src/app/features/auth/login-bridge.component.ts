import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MiloAuthService } from '../../core/auth/milo-auth.service';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

@Component({
  selector: 'mtab-login-bridge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="auth-bridge">
      <div class="auth-card">
        <h1>Accedi con Milo</h1>
        <p>
          Questa app usa solo l'identita Milo. Nessuna registrazione locale, nessuna seconda password.
        </p>
        <p *ngIf="intentLabel() as label" class="auth-copy">
          {{ label }}
        </p>
        <p *ngIf="statusMessage()" class="auth-status">{{ statusMessage() }}</p>
        <p *ngIf="errorMessage()" class="auth-error">{{ errorMessage() }}</p>
        <div class="auth-actions">
          <button type="button" [disabled]="loading()" (click)="continueWithMilo()">Continua su Milo</button>
          <a *ngIf="returnTarget()" [routerLink]="returnTarget()">Torna al link condiviso</a>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background: radial-gradient(circle at top, #eff6ff 0, #f9fafb 45%, #f3f4f6 100%);
      }

      .auth-bridge {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 2rem;
      }

      .auth-card {
        width: min(30rem, 100%);
        padding: 2rem;
        border-radius: 1.5rem;
        background: #ffffff;
        border: 1px solid rgba(148, 163, 184, 0.3);
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
      }

      h1 {
        margin: 0 0 1rem;
        color: #0f172a;
      }

      p {
        margin: 0 0 1.5rem;
        color: #475569;
        line-height: 1.5;
      }

      .auth-copy,
      .auth-status,
      .auth-error {
        margin-bottom: 1rem;
      }

      .auth-status {
        color: #0f766e;
      }

      .auth-error {
        color: #b42318;
      }

      .auth-actions {
        display: grid;
        gap: 0.75rem;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 0.9rem 1.25rem;
        font: inherit;
        color: #ffffff;
        background: linear-gradient(90deg, #4f46e5, #ec4899);
        cursor: pointer;
      }

      a {
        color: #475569;
        text-decoration: none;
        text-align: center;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginBridgeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(MiloAuthService);
  private readonly taskLibrary = inject(TaskLibraryService);

  protected readonly loading = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly intentLabel = signal('');
  protected readonly returnTarget = signal<string | null>(null);

  constructor() {
    void this.handleInitialState();
  }

  continueWithMilo(): void {
    const query = this.route.snapshot.queryParamMap;
    const shareToken = query.get('shareToken');
    const intent = query.get('intent');
    const redirectTo = this.resolveReturnTarget(query.get('redirectTo'), shareToken);

    this.returnTarget.set(redirectTo);
    this.intentLabel.set(this.resolveIntentLabel(intent, shareToken));

    if (intent === 'duplicate-share' && shareToken) {
      this.auth.beginMiloLogin(
        this.auth.buildLoginBridgeUrl({
          intent,
          shareToken,
          redirectTo: redirectTo ?? undefined
        })
      );
      return;
    }

    this.auth.beginMiloLogin();
  }

  private async handleInitialState(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const token = query.get('token');
    const shareToken = query.get('shareToken');
    const intent = query.get('intent');
    const redirectTo = this.resolveReturnTarget(query.get('redirectTo'), shareToken);

    this.returnTarget.set(redirectTo);
    this.intentLabel.set(this.resolveIntentLabel(intent, shareToken));

    if (!token) {
      return;
    }

    this.loading.set(true);
    this.statusMessage.set('Sto verificando la sessione Milo.');
    this.errorMessage.set('');
    this.auth.acceptTokenHandoff(token);

    const user = await this.auth.restoreSession();
    if (!user) {
      this.loading.set(false);
      this.statusMessage.set('');
      this.errorMessage.set('Sessione Milo non valida. Riavvia l accesso.');
      return;
    }

    if (intent === 'duplicate-share' && shareToken) {
      this.statusMessage.set('Importazione della task condivisa nel tuo spazio in corso.');

      try {
        const duplicated = await firstValueFrom(this.taskLibrary.duplicateTaskFromShare(shareToken));
        await this.router.navigate(['/tasks', duplicated.id], { replaceUrl: true });
        return;
      } catch {
        this.statusMessage.set('');
        this.errorMessage.set('Non sono riuscito a duplicare la task condivisa dopo l accesso.');
      }
    } else {
      this.statusMessage.set('Accesso completato. Apertura della libreria in corso.');
      await this.router.navigateByUrl('/library', { replaceUrl: true });
      return;
    }

    this.loading.set(false);
  }

  private resolveIntentLabel(intent: string | null, shareToken: string | null): string {
    if (intent === 'duplicate-share' && shareToken) {
      return 'Dopo l accesso importeremo la task condivisa come bozza privata nel tuo spazio.';
    }

    return '';
  }

  private resolveReturnTarget(redirectTo: string | null, shareToken: string | null): string | null {
    if (redirectTo) {
      return redirectTo;
    }

    if (shareToken) {
      return `/shared/${shareToken}`;
    }

    return null;
  }
}
