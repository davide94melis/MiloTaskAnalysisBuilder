import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MiloAuthService } from '../../core/auth/milo-auth.service';

@Component({
  selector: 'mtab-login-bridge',
  standalone: true,
  template: `
    <section class="auth-bridge">
      <div class="auth-card">
        <h1>Accedi con Milo</h1>
        <p>
          Questa app usa solo l'identita Milo. Nessuna registrazione locale, nessuna seconda password.
        </p>
        <button type="button" (click)="continueWithMilo()">Continua su Milo</button>
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

      button {
        border: 0;
        border-radius: 999px;
        padding: 0.9rem 1.25rem;
        font: inherit;
        color: #ffffff;
        background: linear-gradient(90deg, #4f46e5, #ec4899);
        cursor: pointer;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginBridgeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(MiloAuthService);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.auth.acceptTokenHandoff(token);
      void this.auth.restoreSession();
    }
  }

  continueWithMilo(): void {
    this.auth.beginMiloLogin();
  }
}
