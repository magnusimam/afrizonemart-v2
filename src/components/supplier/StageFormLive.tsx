'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PIQFormEngine } from '@/components/supplier/piq/PIQFormEngine';
import type { PIQFormConfig } from '@/lib/supplier/piq-config';
import { completeStage, getStageAnswers, saveStageAnswers } from '@/lib/api/supplier';
import { supplierKeys } from '@/lib/api/supplier-hooks';
import { stageHref } from '@/lib/supplier/stages';

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
        // completeStage advances the journey and returns the updated profile,
        // so the next destination comes from the server rather than being
        // guessed as `stage + 1` (which would overshoot a supplier who is
        // revisiting an earlier form).
        const profile = await completeStage(stage, answers);
        // Seed the new profile rather than only invalidating: the stage we're
        // about to open is gated on currentStage, and a refetch that hasn't
        // landed yet would flash the "locked" panel on a stage they just
        // unlocked.
        queryClient.setQueryData(supplierKeys.me, profile);
        queryClient.invalidateQueries({ queryKey: supplierKeys.me });
        queryClient.invalidateQueries({ queryKey: ['supplier', 'stage', stage] });
        // Carry them straight into the next stage — "save & continue" should
        // continue, not dump them back on the dashboard. The short delay lets
        // the form's own confirmation message register first.
        const next = stageHref(profile.currentStage);
        setTimeout(() => router.push(next), 1200);
      }}
    />
  );
}
