'use client';

import { Mail, MessageCircle, Phone } from 'lucide-react';
import type { NotifyPrefs } from '@/stores/checkoutStore';

const items: { key: keyof NotifyPrefs; label: string; Icon: typeof Mail }[] = [
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'sms', label: 'SMS', Icon: Phone },
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle },
];

interface Props {
  value: NotifyPrefs;
  onChange: (next: NotifyPrefs) => void;
}

export function NotificationPrefs({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-raleway text-sm text-charcoal">
        How should we keep you posted on your order?
      </p>
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ key, label, Icon }) => {
          const selected = value[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...value, [key]: !selected })}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-2 rounded-card border-2 p-3 transition-all ${
                selected
                  ? 'border-navy bg-navy/5'
                  : 'border-border bg-white hover:border-navy/40'
              }`}
            >
              <Icon
                size={20}
                className={selected ? 'text-amber' : 'text-navy'}
                aria-hidden
              />
              <span className="font-raleway text-xs font-bold text-navy">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
