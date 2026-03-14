import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import JSONEditor from 'jsoneditor';
import type { JSONEditorOptions } from 'jsoneditor';
import Ajv from 'ajv';

@Component({
  selector: 'omni-json-editor',
  standalone: true,
  imports: [],
  templateUrl: './omni-json-editor.component.html',
  styleUrl: './omni-json-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmniJsonEditorComponent implements AfterViewInit, OnDestroy {
  /** Initial JSON object to edit. */
  @Input() data: unknown = {};

  /** Optional JSON Schema for validation. When omitted, the editor works without validation. */
  @Input() schema?: Record<string, unknown>;

  /** Visual display mode. Defaults to tree. */
  @Input() mode: 'tree' | 'form' | 'code' | 'view' = 'tree';

  /** When true, renders the editor in read-only view mode. */
  @Input() readOnly = false;

  /** Emits the updated JSON whenever editor content changes to a valid value. */
  @Output() dataChange = new EventEmitter<unknown>();

  @ViewChild('editor') editorElement!: ElementRef<HTMLDivElement>;

  private editor!: JSONEditor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ajvInstance: any;

  ngAfterViewInit(): void {
    const effectiveMode = this.readOnly ? 'view' : this.mode;

    const options: JSONEditorOptions = {
      mode: effectiveMode,
      modes: this.readOnly ? ['view'] : ['tree', 'form', 'code', 'view'],
      search: true,
      navigationBar: true,
      statusBar: true,
      onChangeJSON: (json: unknown) => {
        if (this.schema) {
          this.validateJson(json);
        }
        this.dataChange.emit(json);
      },
    };

    if (this.schema) {
      options.schema = this.schema;
    }

    this.editor = new JSONEditor(this.editorElement.nativeElement, options);
    this.editor.set(this.data);
  }

  /** Returns the current JSON value from the editor. Returns null if the content is invalid. */
  getValue(): unknown {
    try {
      return this.editor.get();
    } catch {
      return null;
    }
  }

  /** Programmatically updates the editor content. */
  setValue(value: unknown): void {
    this.editor.update(value);
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private validateJson(json: unknown): void {
    if (!this.schema) return;
    try {
      if (!this.ajvInstance) {
        this.ajvInstance = new Ajv({ strict: false, allErrors: true });
      }
      const validate = this.ajvInstance.compile(this.schema);
      const valid = validate(json);
      if (!valid) {
        console.warn('[OmniJsonEditor] Validation errors:', validate.errors);
      }
    } catch (err) {
      console.warn('[OmniJsonEditor] Schema compile error:', err);
    }
  }
}
