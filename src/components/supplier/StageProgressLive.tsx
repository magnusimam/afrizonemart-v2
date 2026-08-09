'use client';

import { SupplierStageProgressBar } from '@/components/supplier/SupplierStageProgressBar';
import { useSupplierMe } from '@/lib/api/supplier-hooks';

/** Live wrapper — feeds the real currentStage into the tracker. */
export function StageProgressLive() {
  const { data } = useSupplierMe();
  return <SupplierStageProgressBar currentStage={data?.currentStage ?? 1} />;
}
