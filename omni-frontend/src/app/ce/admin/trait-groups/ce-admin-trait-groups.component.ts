import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Admin panel — Trait Groups (placeholder)
 * Trait grouping is currently managed via the `group` field on CeTraitDef.
 * This panel is reserved for future explicit group management.
 * Roles: sc_acct_mgr
 */
@Component({
  selector: 'ce-admin-trait-groups',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="placeholder-panel">
      <mat-icon class="ph-icon">folder</mat-icon>
      <h3>Trait Groups</h3>
      <p>
        Trait groups are defined implicitly via the <strong>group</strong> field
        on each Trait Definition. Explicit group management will be available in
        a future release.
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
export class CeAdminTraitGroupsComponent {}
