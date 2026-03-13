import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  Input,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BookmarksService } from '../services/bookmarks.service';

@Component({
  selector: 'omni-favorite-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button
      mat-icon-button
      [matTooltip]="bookmarked() ? 'Remove from favorites' : 'Add to favorites'"
      (click)="toggle($event)"
      [class.bookmarked]="bookmarked()"
      aria-label="Toggle favorite">
      <mat-icon>{{ bookmarked() ? 'star' : 'star_border' }}</mat-icon>
    </button>
  `,
  styles: [`
    button.bookmarked mat-icon { color: #f5a623; }
    button mat-icon { color: var(--omni-text-muted); transition: color 0.2s; }
    button:hover mat-icon { color: #f5a623; }
  `],
})
export class FavoriteToggleComponent implements OnInit {
  @Input({ required: true }) objectType!: string;
  @Input({ required: true }) objectId!: string;
  @Input() metadata: Record<string, unknown> = {};

  private bookmarksSvc = inject(BookmarksService);
  bookmarked = signal(false);

  ngOnInit(): void {
    this.bookmarked.set(this.bookmarksSvc.isBookmarked(this.objectType, this.objectId));
  }

  toggle(event: Event): void {
    event.stopPropagation();
    const was = this.bookmarked();
    this.bookmarked.set(!was);
    this.bookmarksSvc.toggleBookmark(this.objectType, this.objectId, this.metadata).subscribe({
      error: () => this.bookmarked.set(was), // revert on error
    });
  }
}
