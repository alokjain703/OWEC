import {
  Component,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'omni-upload-document',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div
      class="drop-zone"
      [class.has-file]="selectedFile()"
      [class.dragging]="dragging()"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)">

      <mat-icon class="upload-icon">{{ selectedFile() ? fileIcon(selectedFile()!.name) : 'upload_file' }}</mat-icon>

      @if (selectedFile()) {
        <p class="file-name">{{ selectedFile()!.name }}</p>
        <p class="file-size">{{ formatSize(selectedFile()!.size) }}</p>
        <button mat-stroked-button color="warn" (click)="clear()">
          <mat-icon>clear</mat-icon> Remove
        </button>
      } @else {
        <p class="hint">Drag & drop a document here, or</p>
        <button mat-raised-button color="primary" (click)="input.click()">
          <mat-icon>folder_open</mat-icon> Browse File
        </button>
        <p class="hint small">PDF, DOCX, or DOC · max 50 MB</p>
      }

      <input #input type="file" accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword" hidden (change)="onFileInput($event)" />
    </div>
  `,
  styles: [`
    .drop-zone {
      border: 2px dashed #ccc;
      border-radius: 12px;
      padding: 32px 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: #fafafa;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .drop-zone.dragging,
    .drop-zone:hover {
      border-color: #3f51b5;
      background: #f0f4ff;
    }
    .drop-zone.has-file {
      border-color: #4caf50;
      background: #f1faf2;
    }
    .upload-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #3f51b5;
      opacity: 0.7;
    }
    .file-name {
      font-weight: 600;
      font-size: 14px;
      margin: 0;
      word-break: break-all;
    }
    .file-size {
      font-size: 12px;
      color: rgba(0,0,0,0.54);
      margin: 0;
    }
    .hint {
      margin: 0;
      color: rgba(0,0,0,0.54);
      font-size: 13px;
    }
    .hint.small {
      font-size: 11px;
    }
  `],
})
export class UploadDocumentComponent {
  fileSelected = output<File | null>();

  selectedFile = signal<File | null>(null);
  dragging = signal(false);

  onFileInput(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.setFile(files?.[0] ?? null);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  clear(): void {
    this.setFile(null);
  }

  private static readonly _ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc']);

  private setFile(file: File | null): void {
    if (file) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!UploadDocumentComponent._ALLOWED_EXTENSIONS.has(ext)) {
        alert(`Unsupported file type "${ext}". Please upload a .pdf, .docx, or .doc file.`);
        return;
      }
    }
    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  fileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')  return 'picture_as_pdf';
    if (ext === 'docx' || ext === 'doc') return 'description';
    return 'insert_drive_file';
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
