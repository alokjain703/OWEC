import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Admin panel — Trait Options (placeholder)
 * Select-type trait options are stored as part of the trait definition's options array.
 * This panel is reserved for a future dedicated options manager UI.
 * Roles: sc_acct_mgr
 */
@Component({
  selector: 'ce-admin-trait-options',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="placeholder-panel">
      <mat-icon class="ph-icon">checklist</mat-icon>
      <h3>Trait Options</h3>
      <p>
        Options for <strong>select</strong>-type traits are managed inline within
        the Trait Definition editor. A standalone options manager will be available
        in a future release.
      </p>
    </div>
  `,
  styles: [`
    :host { display: flex; flex: 1; }
    .placeholder-panel {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 12px; padding: 32px;
      color: var(--mat-secondary-text, #888);
      text-align: center;
    }
    .ph-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.4; }
    h3 { margin: 0; font-size: 18px; }
    p  { max-width: 380px; line-height: 1.6; }
  `],
})
export class CeAdminTraitOptionsComponent {}
