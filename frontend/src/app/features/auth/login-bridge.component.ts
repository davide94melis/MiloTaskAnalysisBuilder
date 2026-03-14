import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MiloAuthService } from '../../core/auth/milo-auth.service';
import { TaskLibraryService } from '../../core/tasks/task-library.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'mtab-login-bridge',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="auth-shell">
      <div class="auth-card">
        <p class="auth-eyebrow">Milo access</p>
        <h1>{{ mode() === 'login' ? 'Accedi con Milo' : 'Crea il tuo account Milo' }}</h1>
        <p class="auth-copy">
          {{ mode() === 'login'
            ? 'Usa le credenziali Milo direttamente da questa app. Il token viene poi validato dal backend locale con /auth/me.'
            : 'La registrazione viene inviata al backend Milo, poi la sessione viene riutilizzata dentro Task Analysis Builder.' }}
        </p>
        <p *ngIf="intentLabel()" class="auth-copy auth-copy--intent">{{ intentLabel() }}</p>
        <p *ngIf="infoMessage()" class="auth-status">{{ infoMessage() }}</p>
        <p *ngIf="statusMessage()" class="auth-status">{{ statusMessage() }}</p>
        <p *ngIf="errorMessage()" class="auth-error">{{ errorMessage() }}</p>

        <form class="auth-form" *ngIf="!processingTokenHandoff()" (ngSubmit)="submit()">
          <label class="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autocomplete="email"
              [(ngModel)]="email"
              [disabled]="loading()"
              placeholder="nome@dominio.it"
            />
          </label>

          <label class="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
              [(ngModel)]="password"
              [disabled]="loading()"
              placeholder="Inserisci la password"
            />
          </label>

          <label class="auth-field" *ngIf="mode() === 'register'">
            <span>Conferma password</span>
            <input
              type="password"
              name="confirmPassword"
              autocomplete="new-password"
              [(ngModel)]="confirmPassword"
              [disabled]="loading()"
              placeholder="Ripeti la password"
            />
          </label>

          <button type="submit" [disabled]="loading()">
            {{ loading()
              ? 'Attendi...'
              : mode() === 'login'
                ? 'Accedi'
                : 'Registrati' }}
          </button>
        </form>

        <nav class="auth-links" *ngIf="!processingTokenHandoff()">
          <a *ngIf="mode() === 'login'" [routerLink]="registerUrl()">Non hai un account? Registrati</a>
          <a *ngIf="mode() === 'register'" [routerLink]="loginUrl()">Hai gia un account? Accedi</a>
          <a *ngIf="returnTarget()" [routerLink]="returnTarget()">Torna al link condiviso</a>
        </nav>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
        background:
          radial-gradient(circle at top left, rgba(254, 215, 170, 0.65), transparent 28%),
          linear-gradient(180deg, #fbf7ef 0%, #eef6f8 100%);
      }

      .auth-shell {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 2rem 1rem;
      }

      .auth-card {
        width: min(32rem, 100%);
        display: grid;
        gap: 1rem;
        padding: 2rem;
        border-radius: 1.75rem;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(18, 52, 70, 0.14);
        box-shadow: 0 20px 45px rgba(18, 52, 70, 0.1);
      }

      .auth-eyebrow {
        margin: 0;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #8e6236;
      }

      h1,
      p {
        margin: 0;
      }

      h1 {
        color: #123446;
      }

      .auth-copy {
        color: #49606c;
        line-height: 1.55;
      }

      .auth-copy--intent {
        color: #123446;
      }

      .auth-status {
        color: #0f766e;
      }

      .auth-error {
        color: #b42318;
      }

      .auth-form,
      .auth-links {
        display: grid;
        gap: 0.9rem;
      }

      .auth-field {
        display: grid;
        gap: 0.35rem;
      }

      .auth-field span {
        color: #123446;
        font-size: 0.92rem;
      }

      .auth-field input {
        min-height: 3rem;
        border-radius: 1rem;
        border: 1px solid rgba(18, 52, 70, 0.16);
        padding: 0 0.95rem;
        font: inherit;
        color: #123446;
        background: #f8fbfc;
      }

      button {
        min-height: 3.1rem;
        border: 0;
        border-radius: 999px;
        font: inherit;
        color: #ffffff;
        background: linear-gradient(180deg, #123446, #235772);
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.7;
        cursor: wait;
      }

      .auth-links a {
        color: #235772;
        text-decoration: none;
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
  protected readonly processingTokenHandoff = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly infoMessage = signal('');
  protected readonly intentLabel = signal('');
  protected readonly returnTarget = signal<string | null>(null);
  protected readonly mode = signal<AuthMode>('login');

  protected email = '';
  protected password = '';
  protected confirmPassword = '';

  constructor() {
    void this.handleInitialState();
  }

  protected async submit(): Promise<void> {
    this.errorMessage.set('');
    this.infoMessage.set('');

    const email = this.email.trim();
    if (!email || !this.password) {
      this.errorMessage.set('Inserisci email e password.');
      return;
    }

    if (this.mode() === 'register') {
      if (this.password.length < 8) {
        this.errorMessage.set('La password deve contenere almeno 8 caratteri.');
        return;
      }

      if (this.password !== this.confirmPassword) {
        this.errorMessage.set('Le password non coincidono.');
        return;
      }
    }

    this.loading.set(true);
    this.statusMessage.set(this.mode() === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...');

    try {
      if (this.mode() === 'login') {
        await firstValueFrom(this.auth.login({ email, password: this.password }));
      } else {
        await firstValueFrom(this.auth.register({ email, password: this.password }));
      }

      const restoredUser = await this.auth.restoreSession();
      if (!restoredUser) {
        this.statusMessage.set('');
        this.errorMessage.set('La sessione Milo e stata accettata, ma il backend locale non l ha confermata.');
        return;
      }

      await this.completeAuthenticatedFlow();
    } catch (error: unknown) {
      this.statusMessage.set('');
      this.errorMessage.set(this.resolveAuthError(error, this.mode()));
    } finally {
      this.loading.set(false);
    }
  }

  protected loginUrl(): string {
    return this.auth.buildLoginBridgeUrl(this.buildAuthOptions());
  }

  protected registerUrl(): string {
    return this.auth.buildRegisterUrl(this.buildAuthOptions());
  }

  private async handleInitialState(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const token = query.get('token');
    const shareToken = query.get('shareToken');
    const intent = query.get('intent');
    const redirectTo = this.resolveReturnTarget(query.get('redirectTo'), shareToken);
    const routePath = this.route.snapshot.routeConfig?.path ?? 'auth/login';

    this.mode.set(routePath === 'auth/register' ? 'register' : 'login');
    this.returnTarget.set(redirectTo);
    this.intentLabel.set(this.resolveIntentLabel(intent, shareToken));

    if (query.get('registered') === '1') {
      this.infoMessage.set('Account creato. Ora puoi accedere.');
    }

    if (!token) {
      return;
    }

    this.processingTokenHandoff.set(true);
    this.loading.set(true);
    this.statusMessage.set('Sto verificando la sessione Milo.');
    this.errorMessage.set('');
    this.auth.acceptTokenHandoff(token);

    const user = await this.auth.restoreSession();
    if (!user) {
      this.loading.set(false);
      this.processingTokenHandoff.set(false);
      this.statusMessage.set('');
      this.errorMessage.set('Sessione Milo non valida. Accedi di nuovo con email e password.');
      return;
    }

    await this.completeAuthenticatedFlow();
    this.loading.set(false);
    this.processingTokenHandoff.set(false);
  }

  private async completeAuthenticatedFlow(): Promise<void> {
    const query = this.route.snapshot.queryParamMap;
    const shareToken = query.get('shareToken');
    const intent = query.get('intent');
    const redirectTo = this.resolveReturnTarget(query.get('redirectTo'), shareToken);

    if (intent === 'duplicate-share' && shareToken) {
      this.statusMessage.set('Importazione della task condivisa nel tuo spazio in corso.');

      try {
        const duplicated = await firstValueFrom(this.taskLibrary.duplicateTaskFromShare(shareToken));
        await this.router.navigate(['/tasks', duplicated.id], { replaceUrl: true });
        return;
      } catch {
        this.statusMessage.set('');
        this.errorMessage.set('Non sono riuscito a duplicare la task condivisa dopo l accesso.');
        return;
      }
    }

    this.statusMessage.set('Accesso completato. Apertura della libreria in corso.');
    await this.router.navigateByUrl(redirectTo ?? '/library');
  }

  private buildAuthOptions(): { intent?: string; shareToken?: string; redirectTo?: string } {
    const query = this.route.snapshot.queryParamMap;
    const intent = query.get('intent');
    const shareToken = query.get('shareToken');
    const redirectTo = this.resolveReturnTarget(query.get('redirectTo'), shareToken);

    return {
      intent: intent ?? undefined,
      shareToken: shareToken ?? undefined,
      redirectTo: redirectTo ?? undefined
    };
  }

  private resolveAuthError(error: unknown, mode: AuthMode): string {
    const message =
      typeof error === 'object' && error !== null
        ? ((error as { error?: { error?: string; message?: string } }).error?.error ??
            (error as { error?: { error?: string; message?: string } }).error?.message ??
            '')
        : '';

    if (message === 'EMAIL_ALREADY_REGISTERED') {
      return 'Questa email e gia registrata. Prova ad accedere.';
    }

    if (message === 'PASSWORD_TOO_WEAK') {
      return 'La password non rispetta i requisiti richiesti da Milo.';
    }

    if (message === 'INVALID_CREDENTIALS' || message.includes('Invalid')) {
      return 'Credenziali non valide.';
    }

    if (message === 'EMAIL_NOT_VERIFIED') {
      return 'Email non verificata. Controlla la posta prima di accedere.';
    }

    return mode === 'login'
      ? 'Accesso non riuscito. Verifica le credenziali Milo e riprova.'
      : 'Registrazione non riuscita. Controlla i dati e riprova.';
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
