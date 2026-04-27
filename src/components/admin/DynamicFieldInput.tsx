'use client';

import type { CustomFieldDef } from '@/lib/api/admin';

/**
 * Renders the right input control for a CustomFieldDef.type. Used in the
 * admin product edit page (and later: order/user pages). Each branch is
 * boring on purpose — kept simple so non-devs reading the rendered HTML
 * see exactly what they typed.
 */
export interface DynamicFieldInputProps {
  def: CustomFieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}

export function DynamicFieldInput({ def, value, onChange }: DynamicFieldInputProps) {
  const id = `cf-${def.key}`;
  const labelEl = (
    <label
      htmlFor={id}
      className="flex flex-col gap-1"
    >
      <span className="font-raleway text-[10px] font-bold uppercase tracking-btn text-navy">
        {def.label}
        {def.required && <span className="ml-1 text-amber">*</span>}
      </span>
      {renderInput()}
      {def.description && (
        <span className="font-sans text-[11px] text-muted">{def.description}</span>
      )}
    </label>
  );

  return labelEl;

  function renderInput() {
    const common =
      'rounded-input border border-border bg-white px-3 py-2 font-sans text-sm focus:border-navy focus:outline-none';

    switch (def.type) {
      case 'TEXT':
      case 'URL':
      case 'VIDEO':
      case 'IMAGE':
        return (
          <input
            id={id}
            type={def.type === 'TEXT' ? 'text' : 'url'}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            placeholder={
              def.type === 'VIDEO'
                ? 'https://www.youtube.com/watch?v=...'
                : def.type === 'IMAGE'
                  ? 'https://...'
                  : undefined
            }
            className={common}
          />
        );
      case 'LONGTEXT':
      case 'RICHTEXT':
        return (
          <textarea
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            rows={def.type === 'RICHTEXT' ? 6 : 3}
            className={common}
          />
        );
      case 'NUMBER': {
        const opts = def.options as { min?: number; max?: number; step?: number };
        return (
          <input
            id={id}
            type="number"
            value={(value as number | string) ?? ''}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            required={def.required}
            min={opts.min}
            max={opts.max}
            step={opts.step ?? 1}
            className={common}
          />
        );
      }
      case 'BOOLEAN':
        return (
          <label className="flex items-center gap-2">
            <input
              id={id}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="font-sans text-sm text-charcoal">Yes</span>
          </label>
        );
      case 'SELECT': {
        const choices = ((def.options as { choices?: string[] }).choices ?? []) as string[];
        return (
          <select
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            required={def.required}
            className={common}
          >
            <option value="">Choose…</option>
            {choices.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        );
      }
      case 'JSON':
        return (
          <textarea
            id={id}
            value={
              typeof value === 'string'
                ? value
                : value
                  ? JSON.stringify(value, null, 2)
                  : ''
            }
            onChange={(e) => onChange(e.target.value)}
            rows={6}
            required={def.required}
            className={`${common} font-mono`}
            placeholder="{}"
          />
        );
    }
  }
}
