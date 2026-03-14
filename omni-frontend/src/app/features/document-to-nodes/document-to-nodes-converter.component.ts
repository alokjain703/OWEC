import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { UploadDocumentComponent } from './components/upload-document.component';
import { ContentFormatSelectorComponent } from './components/content-format-selector.component';
import { TreePreviewComponent } from './components/tree-preview.component';
import { DocumentToNodesService } from './services/document-to-nodes.service';
import { ContentFormat, ImportTreeNode } from './models/import-tree.model';
import { cloneTree } from './utils/tree-utils';

export interface DocumentToNodesDialogData {
  targetNodeId: string;
  projectId: string;
  /** Pass the active schema definition for role validation (optional). */
  schemaDefinition?: object;
}

/** Result emitted on dialog close when import succeeds. */
export interface DocumentToNodesDialogResult {
  created: number;
  rootNodeIds: string[];
}

type Step = 'upload' | 'preview' | 'done';

@Component({
  selector: 'omni-document-to-nodes-converter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    UploadDocumentComponent,
    ContentFormatSelectorComponent,
    TreePreviewComponent,
  ],
  template: `
    <div class="converter">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-title">
          <mat-icon>upload_file</mat-icon>
          <h2>Add Nodes From Document</h2>
        </div>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <!-- Step indicators -->
      <div class="steps-row">
        <div class="step-pill" [class.active]="step() === 'upload'" [class.done]="step() !== 'upload'">
          <mat-icon>{{ step() === 'upload' ? 'looks_one' : 'check_circle' }}</mat-icon>
          Upload
        </div>
        <div class="step-connector"></div>
        <div class="step-pill" [class.active]="step() === 'preview'" [class.done]="step() === 'done'">
          <mat-icon>{{ step() === 'done' ? 'check_circle' : 'looks_two' }}</mat-icon>
          Preview & Edit
        </div>
        <div class="step-connector"></div>
        <div class="step-pill" [class.active]="step() === 'done'">
          <mat-icon>looks_3</mat-icon>
          Import
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Body -->
      <div class="dialog-body">

        <!-- ── Step 1: Upload ── -->
        @if (step() === 'upload') {
          <div class="upload-step">
            <omni-upload-document (fileSelected)="onFileSelected($event)"></omni-upload-document>

            <omni-content-format-selector
              [format]="contentFormat()"
              (formatSelected)="contentFormat.set($event)">
            </omni-content-format-selector>
          </div>
        }

        <!-- ── Step 2: Preview ── -->
        @if (step() === 'preview') {
          <div class="preview-step">
            @if (parsing()) {
              <div class="parsing-indicator">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Parsing document…</p>
              </div>
            } @else if (importTree().length > 0) {
              <omni-tree-preview
                #treePreview
                [tree]="importTree()"
                [warnings]="parseWarnings()"
                (treeChanged)="onTreeChanged()"
                (selectionChanged)="previewSelectionCount.set($event)">
              </omni-tree-preview>
            } @else {
              <div class="empty-tree">
                <mat-icon>sentiment_dissatisfied</mat-icon>
                <p>No structure could be detected in the document.</p>
                <button mat-stroked-button (click)="goBack()">
                  <mat-icon>arrow_back</mat-icon> Try another file
                </button>
              </div>
            }
          </div>
        }

        <!-- ── Step 3: Done ── -->
        @if (step() === 'done') {
          <div class="done-step">
            <mat-icon class="done-icon">check_circle</mat-icon>
            <h3>Import complete</h3>
            <p>{{ commitResult() }} node(s) were added to the tree.</p>
          </div>
        }
      </div>

      <!-- Footer -->
      <mat-divider></mat-divider>

      <div class="dialog-footer">
        @if (step() === 'upload') {
          <button mat-button (click)="close()">Cancel</button>
          <button
            mat-raised-button color="primary"
            [disabled]="!file() || parsing()"
            (click)="generateTree()">
            <mat-icon>auto_awesome</mat-icon>
            Generate Tree
          </button>
        }

        @if (step() === 'preview') {
          <button mat-button [disabled]="committing()" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon> Back
          </button>
          @if (previewSelectionCount() > 0) {
            <button mat-raised-button color="warn"
                    style="margin-right: auto; order: -1"
                    (click)="treePreview?.deleteSelected()">
              <mat-icon>delete_sweep</mat-icon>
              Delete {{ previewSelectionCount() }} selected
            </button>
          }
          <button
            mat-raised-button color="primary"
            [disabled]="importTree().length === 0 || committing()"
            (click)="commitImport()">
            @if (committing()) {
              <mat-spinner diameter="18" style="display:inline-block"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Import Nodes
          </button>
        }

        @if (step() === 'done') {
          <button mat-raised-button color="primary" (click)="closeWithResult()">
            <mat-icon>done</mat-icon> Done
          </button>
        }
      </div>

      <!-- Progress bar overlay during parsing -->
      @if (parsing() || committing()) {
        <mat-progress-bar mode="indeterminate" class="progress-overlay"></mat-progress-bar>
      }
    </div>
  `,
  styles: [`
    .converter {
      display: flex;
      flex-direction: column;
      width: 700px;
      max-width: 95vw;
      max-height: 85vh;
      position: relative;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-title mat-icon {
      color: #3f51b5;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .header-title h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    /* Steps */
    .steps-row {
      display: flex;
      align-items: center;
      padding: 10px 24px;
      gap: 0;
    }
    .step-pill {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0,0,0,0.38);
      white-space: nowrap;
    }
    .step-pill mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .step-pill.active { color: #3f51b5; }
    .step-pill.done   { color: #4caf50; }
    .step-connector {
      flex: 1;
      height: 1px;
      background: #e0e0e0;
      margin: 0 8px;
    }

    /* Body */
    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      min-height: 300px;
    }

    .upload-step {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .preview-step {
      height: 420px;
      display: flex;
      flex-direction: column;
    }

    .parsing-indicator,
    .empty-tree {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      height: 100%;
      color: rgba(0,0,0,0.54);
    }
    .empty-tree mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .done-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;
      text-align: center;
    }
    .done-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }
    .done-step h3 { margin: 0; font-size: 20px; }
    .done-step p  { margin: 0; color: rgba(0,0,0,0.54); }

    /* Footer */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      flex-wrap: wrap;
    }

    /* Progress bar */
    .progress-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
    }
  `],
})
export class DocumentToNodesConverterComponent {
  private svc     = inject(DocumentToNodesService);
  private snack   = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DocumentToNodesConverterComponent>);
  private data: DocumentToNodesDialogData = inject(MAT_DIALOG_DATA);

  // ── State ──────────────────────────────────────────────────────────────────
  step          = signal<Step>('upload');
  file          = signal<File | null>(null);
  contentFormat = signal<ContentFormat>('html');
  parsing       = signal(false);
  committing    = signal(false);
  importTree    = signal<ImportTreeNode[]>([]);
  parseWarnings = signal<string[]>([]);
  commitResult  = signal<number>(0);
  /** Tracks the number of selected nodes in the preview tree — updated via (selectionChanged). */
  previewSelectionCount = signal<number>(0);

  @ViewChild('treePreview') treePreview?: TreePreviewComponent;

  // ── Handlers ───────────────────────────────────────────────────────────────

  onFileSelected(file: File | null): void {
    this.file.set(file);
  }

  async generateTree(): Promise<void> {
    const f = this.file();
    if (!f) return;
    this.parsing.set(true);
    this.step.set('preview');

    this.svc.parseDocument(f, this.contentFormat(), this.data.schemaDefinition).subscribe({
      next: (res) => {
        this.importTree.set(res.tree);
        this.parseWarnings.set(res.warnings);
        this.parsing.set(false);
      },
      error: (err) => {
        this.parsing.set(false);
        const msg = err?.error?.detail ?? 'Failed to parse document';
        this.snack.open(msg, 'Close', { duration: 5000 });
        this.importTree.set([]);
      },
    });
  }

  onTreeChanged(): void {
    // Force signal update so bindings re-run
    this.importTree.set([...this.importTree()]);
  }

  async commitImport(): Promise<void> {
    this.committing.set(true);
    this.svc.commitTree({
      target_node_id: this.data.targetNodeId,
      project_id:     this.data.projectId,
      tree:           this.importTree(),
    }).subscribe({
      next: (res) => {
        this.committing.set(false);
        this.commitResult.set(res.created);
        this.step.set('done');
      },
      error: (err) => {
        this.committing.set(false);
        const msg = err?.error?.detail ?? 'Failed to import nodes';
        this.snack.open(msg, 'Close', { duration: 5000 });
      },
    });
  }

  goBack(): void {
    this.step.set('upload');
    this.importTree.set([]);
    this.parseWarnings.set([]);
    this.previewSelectionCount.set(0);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  closeWithResult(): void {
    const result: DocumentToNodesDialogResult = {
      created: this.commitResult(),
      rootNodeIds: [],
    };
    this.dialogRef.close(result);
  }
}
