import {
  Component,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TreeNode } from '../models/tree-node.model';

interface BackendNode {
  id: string;
  project_id: string;
  parent_id?: string;
  depth: number;
  order_index: number;
  node_role: string;
  title?: string;
  content?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Node Content Editor Component
 * 
 * Center panel for editing main node content.
 * This is a placeholder component that will be expanded with rich text editing.
 */
@Component({
  selector: 'omni-node-content-editor',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="content-editor">
      @if (!node()) {
        <div class="no-selection">
          <mat-icon class="no-selection-icon">edit_note</mat-icon>
          <h2>No Node Selected</h2>
          <p>Select a node from the tree to view and edit its content.</p>
        </div>
      } @else {
        <mat-card class="content-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit_note</mat-icon>
              {{ node()!.label }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="content-preview">
              @if (getBackendNode()?.content) {
                <p>{{ getBackendNode()?.content }}</p>
              } @else {
                <p class="no-content">No content yet. Use the inspector panel to add content.</p>
              }
            </div>
            
            <div class="content-info">
              <mat-icon>info_outline</mat-icon>
              <p>Rich text editor coming soon. For now, you can edit content using the inspector panel on the right.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .content-editor {
      height: 100%;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }

    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
    }

    .no-selection-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      margin-bottom: 24px;
      opacity: 0.3;
    }

    .no-selection h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 400;
    }

    .no-selection p {
      margin: 0;
      font-size: 14px;
    }

    .content-card {
      flex: 1;
    }

    .content-card mat-card-header {
      padding: 20px 20px 16px 20px;
    }

    .content-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 24px;
      font-weight: 500;
      margin: 0;
    }

    .content-card mat-card-content {
      padding: 20px;
    }

    .content-preview {
      min-height: 200px;
      padding: 16px;
      background: rgba(0, 0, 0, 0.02);
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .content-preview p {
      margin: 0;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .no-content {
      color: rgba(0, 0, 0, 0.54);
      font-style: italic;
    }

    .content-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: rgba(33, 150, 243, 0.1);
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }

    .content-info mat-icon {
      color: #2196f3;
      margin-top: 2px;
    }

    .content-info p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
    }
  `],
})
export class NodeContentEditorComponent {
  node = input<TreeNode | null>(null);

  getBackendNode(): BackendNode | undefined {
    return this.node()?.data as BackendNode | undefined;
  }
}
