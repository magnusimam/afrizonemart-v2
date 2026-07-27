'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PIQFormEngine } from '@/components/supplier/piq/PIQFormEngine';
import type { PIQFormConfig } from '@/lib/supplier/piq-config';
import { completeStage, getStageAnswers, saveStageAnswers } from '@/lib/api/supplier';
import { supplierKeys } from '@/lib/api/supplier-hooks';

/**
 * Live wrapper for the journey forms (stages 1–3). Loads the supplier's
 * saved answers, autosaves edits, and on submit advances their stage.
 */
export function StageFormLive({
  stage,
  config,
  submitLabel,
  submittedMessage,
}: {
  stage: number;
  config: PIQFormConfig;
  submitLabel: string;
  submittedMessage: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier', 'stage', stage],
    queryFn: () => getStageAnswers(stage),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-card bg-white shadow-card" />
        <div className="h-64 animate-pulse rounded-card bg-white shadow-card" />
      </div>
    );
  }

  return (
    <PIQFormEngine
      key={stage}
      config={config}
      initialAnswers={(data ?? {}) as Record<string, string>}
      submitLabel={submitLabel}
      submittedMessage={submittedMessage}
      onAutosave={async (answers) => {
        await saveStageAnswers(stage, answers);
      }}
      onSubmit={async (answers) => {
        await completeStage(stage, answers);
        queryClient.invalidateQueries({ queryKey: supplierKeys.me });
        queryClient.invalidateQueries({ queryKey: ['supplier', 'stage', stage] });
        setTimeout(() => router.push('/supplier/dashboard'), 1200);
      }}
    />
  );
}
