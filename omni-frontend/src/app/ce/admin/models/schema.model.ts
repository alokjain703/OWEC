export interface Schema {
  id: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
  icon?: string;
  color?: string;
}
