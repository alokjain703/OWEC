import { Injectable } from '@angular/core';
import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';

import { CeEditorTrait } from '../models/ce-trait-group.model';

/**
 * Converts a list of CeEditorTrait objects into an Angular FormGroup.
 * Each trait's `name` becomes a FormControl key.
 * `required` traits are wrapped with Validators.required.
 * Additional type-based validators are applied automatically.
 */
@Injectable({ providedIn: 'root' })
export class DynamicFormService {
  /**
   * Build a FormGroup from a flat list of traits (can span multiple groups).
   */
  buildForm(traits: CeEditorTrait[]): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const trait of traits) {
      controls[trait.name] = this.buildControl(trait);
    }
    return new FormGroup(controls);
  }

  private buildControl(trait: CeEditorTrait): FormControl {
    const value = this.coerceValue(trait);
    const validators: ValidatorFn[] = [];

    if (trait.required) {
      validators.push(Validators.required);
    }
    if (trait.type === 'number') {
      validators.push(Validators.pattern(/^-?\d*(\.\d+)?$/));
    }

    return new FormControl(value, validators);
  }

  private coerceValue(trait: CeEditorTrait): unknown {
    if (trait.value !== null && trait.value !== undefined) {
      return trait.value;
    }
    switch (trait.type) {
      case 'boolean': return false;
      case 'number': return null;
      default: return '';
    }
  }

  /**
   * Flatten a FormGroup's values into the save-payload format:
   * [{ trait: 'age', value: 87 }, ...]
   */
  flattenToPayload(form: FormGroup): { trait: string; value: unknown }[] {
    return Object.entries(form.getRawValue()).map(([key, value]) => ({
      trait: key,
      value,
    }));
  }
}
