import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, ChevronLeft, FileSpreadsheet } from 'lucide-react';
import { StageFormLive } from '@/components/supplier/StageFormLive';
import { StageProgressLive } from '@/components/supplier/StageProgressLive';
import { StageAccessGate } from '@/components/supplier/StageAccessGate';
import { Stage5Orientation } from '@/components/supplier/stages/Stage5Orientation';
import { Stage6FacilityVisit } from '@/components/supplier/stages/Stage6FacilityVisit';
import { AuditReportCard } from '@/components/supplier/stages/AuditReportCard';
import { Stage7Partnership } from '@/components/supplier/stages/Stage7Partnership';
import { Stage8Activation } from '@/components/supplier/stages/Stage8Activation';
import { Stage9TradeEngagement } from '@/components/supplier/stages/Stage9TradeEngagement';
import { Stage10Continuous } from '@/components/supplier/stages/Stage10Continuous';
import { getStage, SUPPLIER_MAX_STAGE } from '@/lib/supplier/stages';
import { STAGE_FORMS } from '@/lib/supplier/stage-forms';

interface PageProps {
  params: { stage: string };
}

export default function SupplierStagePage({ params }: PageProps) {
  const stageNum = Number(params.stage);
  if (!Number.isInteger(stageNum) || stageNum < 1 || stageNum > SUPPLIER_MAX_STAGE) {
    notFound();
  }

  const stage = getStage(stageNum);
  const form = STAGE_FORMS[stageNum];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8 md:py-10">
      <Link
        href="/supplier/dashboard"
        className="inline-flex items-center gap-1 font-raleway text-sm font-semibold text-muted hover:text-navy"
      >
        <ChevronLeft size={16} aria-hidden /> Back to dashboard
      </Link>

      {/* Progress tracker — constant across all stage pages, kept at the top */}
      <div className="mt-4 rounded-card border border-border bg-white p-4 shadow-card">
        <StageProgressLive />
      </div>

      <header className="mt-6 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-navy px-3 py-1 font-raleway text-xs font-bold uppercase tracking-btn text-white">
          Stage {stageNum} of {SUPPLIER_MAX_STAGE}
        </span>
        <h1 className="font-raleway text-2xl font-extrabold text-navy md:text-3xl">
          {stage?.name}
        </h1>
      </header>

      {/* Stage body */}
      <div className="mt-8 border-t border-border pt-8">
        <StageAccessGate stage={stageNum}>
          {form ? (
            <StageFormLive
              stage={stageNum}
              config={form.config}
              submitLabel={form.submitLabel}
              submittedMessage={form.submittedMessage}
            />
          ) : (
            <StageBody stageNum={stageNum} />
          )}
        </StageAccessGate>
      </div>
    </div>
  );
}

/** Maps a stage number to its dedicated UI (stages 4–10 are AZM-driven). */
function StageBody({ stageNum }: { stageNum: number }) {
  switch (stageNum) {
    case 4:
      return <PIQStageBody />;
    case 5:
      return <Stage5Orientation />;
    case 6:
      return (
        <>
          <Stage6FacilityVisit />
          <AuditReportCard />
        </>
      );
    case 7:
      return <Stage7Partnership />;
    case 8:
      return <Stage8Activation />;
    case 9:
      return <Stage9TradeEngagement />;
    case 10:
      return <Stage10Continuous />;
    default:
      return null;
  }
}

/** Stage 4 routes into the dedicated PIQ surface (one form per product). */
function PIQStageBody() {
  return (
    <div className="rounded-card border border-amber/40 bg-amber-light p-6">
      <h2 className="font-raleway text-lg font-bold text-navy">
        Complete a questionnaire for each product
      </h2>
      <p className="mt-2 font-sans text-sm leading-relaxed text-charcoal">
        Stage 4 is managed product-by-product. Each product gets its own
        Product Information Questionnaire with step-by-step guidance beside every
        question.
      </p>
      <Link
        href="/supplier/piqs"
        className="mt-5 inline-flex items-center gap-2 rounded-btn bg-navy px-5 py-2.5 font-raleway text-sm font-bold tracking-btn text-white transition-colors hover:bg-navy-dark"
      >
        <FileSpreadsheet size={16} aria-hidden /> Go to My PIQs
        <ArrowRight size={15} aria-hidden />
      </Link>
    </div>
  );
}
