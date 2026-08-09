'use client';

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  HelpCircle,
  Loader2,
  PartyPopper,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type PIQFormConfig,
  type PIQQuestion,
  requiredQuestionIds,
} from '@/lib/supplier/piq-config';
import { PIQGuidancePanel } from '@/components/supplier/piq/PIQGuidancePanel';
import { DEFAULT_REGION_TERM, regionsFor } from '@/lib/supplier/regions';
import { uploadSupplierDocument } from '@/lib/api/supplier';

type AnswerValue = string | number | boolean | string[] | undefined;
type Answers = Record<string, AnswerValue>;

interface Props {
  config: PIQFormConfig;
  initialAnswers?: Answers;
  readOnly?: boolean;
  /** Submit button label — varies by stage (e.g. "Submit Expression of Interest"). */
  submitLabel?: string;
  /** Confirmation shown after a valid submit. */
  submittedMessage?: string;
  /**
   * Reviewer feedback for a PIQ that needs changes — keyed by question id.
   * When present the form enters "revision" mode: an action banner, per-field
   * callouts, flagged steps, and a "Resubmit" button.
   */
  feedback?: Record<string, string>;
  /** Overall reviewer note shown in the revision banner. */
  reviewSummary?: string;
  /** Persist answers (debounced). When provided, replaces the simulated save. */
  onAutosave?: (answers: Answers, completionPct: number) => Promise<void> | void;
  /** Submit handler. When provided, runs on a valid submit (after a final save). */
  onSubmit?: (answers: Answers, completionPct: number) => Promise<void>;
}

/**
 * Schema-driven PIQ form. Renders whatever `config` describes (Principle 4)
 * and shows each question's guidance inline:
 *   - lg+  : guidance sits side-by-side, to the right of the field.
 *   - <lg  : guidance collapses behind a "How to answer" toggle under the
 *            field (tap to reveal) — works on touch and for screen readers,
 *            unlike hover-only tooltips.
 *
 * Build 1: auto-save is simulated locally (debounced "Saving…/Saved ✓").
 * Wire the debounce to `PUT /api/suppliers/me/piqs/:id` when the API lands.
 */
export function PIQFormEngine({
  config,
  initialAnswers = {},
  readOnly = false,
  submitLabel = 'Submit for review',
  submittedMessage = 'All set! In the live portal this would submit your PIQ for review.',
  feedback,
  reviewSummary,
  onAutosave,
  onSubmit,
}: Props) {
  const feedbackMap = feedback ?? {};
  const inRevision = Object.keys(feedbackMap).length > 0;
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [openGuidance, setOpenGuidance] = useState<Record<string, boolean>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  const isVisible = useCallback(
    (q: PIQQuestion) => {
      if (!q.conditional) return true;
      const dep = answers[q.conditional.dependsOn];
      return q.conditional.showWhen.includes(dep as string | boolean);
    },
    [answers],
  );

  /**
   * Resolve a `subdivision` question into a concrete field: a dropdown of
   * the selected country's subdivisions (labelled with local terminology —
   * State / Region / Province …), or free text if we have no list. Other
   * question types pass through untouched.
   */
  const resolveQuestion = useCallback(
    (q: PIQQuestion): { q: PIQQuestion; disabled: boolean } => {
      if (q.type !== 'subdivision') return { q, disabled: false };
      const country = answers[q.countryField ?? ''] as string | undefined;
      const region = regionsFor(country);
      const term = region?.term ?? DEFAULT_REGION_TERM;

      if (!country) {
        return {
          q: { ...q, type: 'text', label: term, placeholder: 'Select a Country of Origin first' },
          disabled: true,
        };
      }
      if (region?.options?.length) {
        return {
          q: { ...q, type: 'select', label: term, options: region.options, placeholder: undefined },
          disabled: false,
        };
      }
      return {
        q: { ...q, type: 'text', label: term, placeholder: `Enter the ${term.toLowerCase()}` },
        disabled: false,
      };
    },
    [answers],
  );

  const setValue = (id: string, value: AnswerValue) => {
    if (readOnly) return;
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      // Changing a country clears its dependent subdivision(s) — a region
      // from the old country must not linger under the new one.
      for (const section of config.sections) {
        for (const q of section.questions) {
          if (q.type === 'subdivision' && q.countryField === id) next[q.id] = undefined;
        }
      }
      return next;
    });
    setSubmitMsg(null);
    // Debounced auto-save — real PUT when wired, simulated otherwise.
    setSaveState('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (onAutosave) {
        try {
          await onAutosave(latestAnswers.current, completionRef.current);
          setSaveState('saved');
        } catch {
          setSaveState('idle');
        }
      } else {
        setSaveState('saved');
      }
    }, 800);
  };

  const requiredIds = useMemo(() => requiredQuestionIds(config), [config]);

  // Fields we pre-filled from data the supplier already gave elsewhere —
  // flagged with an "Autofilled" chip so they know why, and can edit.
  const prefilledIds = useMemo(
    () => new Set(Object.keys(initialAnswers)),
    [initialAnswers],
  );

  // Revision mode: a flagged field counts as "addressed" once its value
  // changes from what was originally submitted.
  const isAddressed = useCallback(
    (id: string) => isAnswered(answers[id]) && answers[id] !== initialAnswers[id],
    [answers, initialAnswers],
  );
  const flaggedIds = Object.keys(feedbackMap);
  const addressedCount = flaggedIds.filter(isAddressed).length;

  // Chunk the form into steps — one section at a time. Sections whose
  // questions are all hidden by conditionals drop out. A long PIQ becomes
  // a short walk; tiny forms (1 section) stay single-page.
  const steps = useMemo(
    () =>
      config.sections
        .map((s) => ({ section: s, questions: s.questions.filter(isVisible) }))
        .filter((x) => x.questions.length > 0),
    [config, isVisible],
  );
  const useWizard = steps.length > 1;
  const safeStep = Math.min(stepIndex, Math.max(0, steps.length - 1));
  const isLastStep = safeStep === steps.length - 1;

  /** A section counts as done when all its (visible) required fields are in. */
  const sectionComplete = useCallback(
    (questions: PIQQuestion[]) =>
      questions.filter((q) => q.required).every((q) => isAnswered(answers[q.id])),
    [answers],
  );

  // Move to the top of the form when the step changes (not on first paint).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [safeStep]);

  const completion = useMemo(() => {
    // Only count required questions that are currently visible.
    const allQuestions = config.sections.flatMap((s) => s.questions);
    const visibleRequired = requiredIds.filter((id) => {
      const q = allQuestions.find((x) => x.id === id);
      return q ? isVisible(q) : false;
    });
    const answered = visibleRequired.filter((id) => isAnswered(answers[id]));
    const total = visibleRequired.length || 1;
    return { pct: Math.round((answered.length / total) * 100), answered: answered.length, total: visibleRequired.length };
  }, [answers, config, requiredIds, isVisible]);

  // Latest answers/completion for the debounced autosave (which fires after
  // these effects have flushed, so the refs are current).
  const latestAnswers = useRef(answers);
  const completionRef = useRef(completion.pct);
  useEffect(() => { latestAnswers.current = answers; }, [answers]);
  useEffect(() => { completionRef.current = completion.pct; }, [completion.pct]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const allQuestions = config.sections.flatMap((s) => s.questions);
    const missing = requiredIds.filter((id) => {
      const q = allQuestions.find((x) => x.id === id);
      return q && isVisible(q) && !isAnswered(answers[id]);
    });
    if (missing.length > 0) {
      setSubmitMsg(`Please complete all required fields — ${missing.length} still needs an answer.`);
      // Jump to the first section that still has a gap.
      if (useWizard) {
        const idx = steps.findIndex((st) => st.questions.some((q) => missing.includes(q.id)));
        if (idx >= 0) setStepIndex(idx);
      }
      return;
    }

    const message = inRevision
      ? 'Thanks — your updated PIQ has been resubmitted for review.'
      : submittedMessage;

    if (onSubmit) {
      setSubmitting(true);
      setSaveState('saving');
      try {
        await onSubmit(answers, completion.pct);
        setSubmitMsg(message);
        setSaveState('saved');
      } catch {
        setSubmitMsg('Something went wrong submitting. Please try again.');
        setSaveState('idle');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitMsg(message);
  };

  const sectionsToRender = useWizard ? [steps[safeStep]] : steps;

  return (
    <div ref={topRef} className="flex flex-col gap-7 scroll-mt-4">
      {/* Sticky progress + autosave header. Offset below the mobile top-bar
          (which is sticky at top-0, z-20) so it isn't hidden behind it. */}
      <div className="sticky top-[57px] z-10 -mx-4 border-b border-border bg-page/95 px-4 py-3 backdrop-blur md:top-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-raleway text-xs font-bold uppercase tracking-btn text-navy">
                {useWizard ? `Step ${safeStep + 1} of ${steps.length} · ` : ''}
                {completion.pct}% complete
              </span>
              <span className="font-sans text-xs text-muted">
                {completion.answered}/{completion.total} required
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-border">
              <div
                className="h-full rounded-full bg-amber transition-all duration-500"
                style={{ width: `${completion.pct}%` }}
              />
            </div>
          </div>
          {!readOnly && (
            <span className="flex w-20 items-center justify-end gap-1.5 font-sans text-xs text-muted">
              {saveState === 'saving' && (
                <>
                  <Loader2 size={13} aria-hidden className="animate-spin" /> Saving…
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <Check size={13} aria-hidden className="text-success" /> Saved
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Revision banner — what the reviewer asked for, and progress on it. */}
      {inRevision && (
        <div className="rounded-card border border-danger/30 bg-[#FDEDEC] p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
              <AlertCircle size={18} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-raleway text-sm font-bold text-danger">
                  Changes requested
                </p>
                <span className="font-raleway text-xs font-bold text-charcoal">
                  {addressedCount}/{flaggedIds.length} addressed
                </span>
              </div>
              {reviewSummary && (
                <p className="mt-1 font-sans text-sm leading-relaxed text-charcoal">
                  {reviewSummary}
                </p>
              )}
              <p className="mt-1.5 font-sans text-xs text-muted">
                The flagged questions below show the reviewer’s note — update each,
                then resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step rail — chunks the long form so it never feels endless. */}
      {useWizard && (
        <nav aria-label="Form sections" className="-mx-1 overflow-x-auto px-1 py-1.5">
          <ol className="flex min-w-max items-center gap-2">
            {steps.map((st, i) => {
              const done = sectionComplete(st.questions);
              const active = i === safeStep;
              const flagged = st.questions.some(
                (q) => feedbackMap[q.id] && !isAddressed(q.id),
              );
              return (
                <li key={st.section.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStepIndex(i)}
                    aria-current={active ? 'step' : undefined}
                    className={`relative flex items-center gap-2 rounded-full px-3 py-1.5 font-raleway text-xs font-bold transition-colors ${
                      active
                        ? 'bg-navy text-white shadow-card'
                        : done
                          ? 'bg-success/10 text-success hover:bg-success/20'
                          : 'bg-white text-muted ring-1 ring-border hover:text-navy hover:ring-navy'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                        active
                          ? 'bg-white/20 text-white'
                          : done
                            ? 'bg-success text-white'
                            : 'bg-page text-muted'
                      }`}
                    >
                      {done && !active ? <Check size={11} strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap">{st.section.title}</span>
                    {flagged && (
                      <span
                        aria-label="has changes requested"
                        className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-page"
                      />
                    )}
                  </button>
                  {i < steps.length - 1 && (
                    <span aria-hidden className="h-px w-4 shrink-0 bg-border" />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {sectionsToRender.map(({ section, questions }) => (
        <section key={section.id} className="flex flex-col gap-5">
          <div>
            <h2 className="font-raleway text-lg font-bold text-navy">{section.title}</h2>
            {section.description && (
              <p className="mt-1 font-sans text-sm leading-relaxed text-muted">
                {section.description}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {questions.map((rawQ) => {
              const { q, disabled } = resolveQuestion(rawQ);
              return (
                <QuestionRow
                  key={q.id}
                  q={q}
                  value={answers[q.id]}
                  onChange={(v) => setValue(q.id, v)}
                  readOnly={readOnly || disabled}
                  prefilled={prefilledIds.has(rawQ.id)}
                  feedback={feedbackMap[rawQ.id]}
                  feedbackAddressed={!!feedbackMap[rawQ.id] && isAddressed(rawQ.id)}
                  guidanceOpen={!!openGuidance[q.id]}
                  onToggleGuidance={() =>
                    setOpenGuidance((p) => ({ ...p, [q.id]: !p[q.id] }))
                  }
                />
              );
            })}
          </div>
        </section>
      ))}

      {!readOnly && (
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          {submitMsg && (
            <p
              role="status"
              className="rounded-input border border-amber/40 bg-amber-light px-4 py-2.5 font-sans text-sm text-charcoal"
            >
              {submitMsg}
            </p>
          )}

          {useWizard && !isLastStep ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                  disabled={safeStep === 0}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-white px-4 py-2.5 font-raleway text-sm font-bold tracking-btn text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={16} aria-hidden /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 rounded-btn bg-navy px-6 py-2.5 font-raleway text-sm font-bold tracking-btn text-white transition-colors hover:bg-navy-dark"
                >
                  Continue <ArrowRight size={16} aria-hidden />
                </button>
              </div>
              <p className="text-center font-sans text-xs text-muted">
                Autosaves as you go — you can leave and pick up where you left off.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {useWizard ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
                    disabled={safeStep === 0}
                    className="inline-flex items-center gap-1.5 rounded-btn border border-border bg-white px-4 py-2.5 font-raleway text-sm font-bold tracking-btn text-navy transition-colors hover:border-navy disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft size={16} aria-hidden /> Back
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-btn bg-navy px-6 py-3 font-raleway text-sm font-bold tracking-btn text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : inRevision ? 'Resubmit for review' : submitLabel}
                </button>
              </div>
              <p className="inline-flex items-center justify-center gap-1.5 text-center font-sans text-xs font-semibold text-success">
                {useWizard && (
                  <>
                    <PartyPopper size={14} aria-hidden /> Last step — you’re almost done!
                  </>
                )}
                {!useWizard && (
                  <span className="font-normal text-muted">
                    Your answers save automatically as you type.
                  </span>
                )}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One question. The field stays clean and prominent; its guidance is
 * tucked behind a quiet "How to answer" toggle beside the question
 * (collapsed by default) — progressive disclosure, so the page stays calm
 * and help is one tap away. Same control on every breakpoint.
 */
function QuestionRow({
  q,
  value,
  onChange,
  readOnly,
  prefilled,
  feedback,
  feedbackAddressed,
  guidanceOpen,
  onToggleGuidance,
}: {
  q: PIQQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  readOnly: boolean;
  prefilled?: boolean;
  feedback?: string;
  feedbackAddressed?: boolean;
  guidanceOpen: boolean;
  onToggleGuidance: () => void;
}) {
  const hasGuidance =
    !!q.guidance && (!!q.guidance.example || !!q.guidance.why || (q.guidance.howTo?.length ?? 0) > 0);

  return (
    <div
      className={`grid grid-cols-1 gap-x-6 gap-y-2 lg:grid-cols-5 ${
        feedback && !feedbackAddressed ? '-mx-3 rounded-card bg-[#FDEDEC]/50 px-3 py-3' : ''
      }`}
    >
      <div className="lg:col-span-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={q.id} className="font-raleway text-sm font-bold text-navy">
            {q.label}
            {q.required && <span className="text-danger"> *</span>}
          </label>
          {prefilled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn text-success">
              <Check size={10} strokeWidth={3} aria-hidden /> Autofilled
            </span>
          )}
          {feedback && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-raleway text-[10px] font-bold uppercase tracking-btn ${
                feedbackAddressed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}
            >
              {feedbackAddressed ? (
                <>
                  <Check size={10} strokeWidth={3} aria-hidden /> Resolved
                </>
              ) : (
                <>
                  <AlertCircle size={10} aria-hidden /> Changes requested
                </>
              )}
            </span>
          )}
        </div>

        {/* Reviewer note for this field. */}
        {feedback && (
          <div
            className={`mt-2 rounded-input border-l-4 px-3 py-2 ${
              feedbackAddressed
                ? 'border-success bg-[#EAFAF1]'
                : 'border-danger bg-[#FDEDEC]'
            }`}
          >
            <p className="font-raleway text-[10px] font-bold uppercase tracking-btn text-muted">
              Reviewer note
            </p>
            <p className="mt-0.5 font-sans text-xs leading-relaxed text-charcoal">
              {feedback}
            </p>
          </div>
        )}

        <div className="mt-2">
          <Field q={q} value={value} onChange={onChange} readOnly={readOnly} />
        </div>
      </div>

      {hasGuidance && (
        <div className="lg:col-span-2">
          <button
            type="button"
            onClick={onToggleGuidance}
            aria-expanded={guidanceOpen}
            aria-controls={`${q.id}-guidance`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 font-raleway text-xs font-semibold text-muted transition-colors hover:border-amber hover:text-navy lg:mt-[30px]"
          >
            <HelpCircle size={14} aria-hidden className="text-amber-dark" />
            {guidanceOpen ? 'Hide tips' : 'How to answer'}
            <ChevronDown
              size={14}
              aria-hidden
              className={`transition-transform duration-200 ${guidanceOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {guidanceOpen && (
            <div id={`${q.id}-guidance`} className="mt-3">
              <PIQGuidancePanel guidance={q.guidance!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
  q,
  value,
  onChange,
  readOnly,
}: {
  q: PIQQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  readOnly: boolean;
}) {
  const base =
    'w-full rounded-input border border-border bg-white px-3 py-2.5 font-sans text-sm text-charcoal focus:border-amber focus:outline-none disabled:bg-page disabled:text-muted';

  switch (q.type) {
    case 'textarea':
      return (
        <textarea
          id={q.id}
          rows={4}
          disabled={readOnly}
          maxLength={q.maxLength}
          placeholder={q.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
    case 'number':
      return (
        <input
          id={q.id}
          type="number"
          disabled={readOnly}
          placeholder={q.placeholder}
          value={(value as number | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          className={base}
        />
      );
    case 'date':
      return (
        <input
          id={q.id}
          type="date"
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
    case 'select':
      return (
        <select
          id={q.id}
          disabled={readOnly}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={base}
        >
          <option value="">Select…</option>
          {q.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'multiselect': {
      const arr = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {q.options?.map((o) => {
            const checked = arr.includes(o);
            return (
              <button
                key={o}
                type="button"
                disabled={readOnly}
                onClick={() =>
                  onChange(checked ? arr.filter((x) => x !== o) : [...arr, o])
                }
                className={`rounded-full px-3 py-1.5 font-raleway text-xs font-semibold ring-1 transition-colors ${
                  checked
                    ? 'bg-navy text-white ring-navy'
                    : 'bg-white text-muted ring-border hover:ring-navy'
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }
    case 'boolean':
      return (
        <div className="flex gap-2">
          {[
            { label: 'Yes', val: true },
            { label: 'No', val: false },
          ].map((opt) => {
            const active = value === opt.val;
            return (
              <button
                key={opt.label}
                type="button"
                disabled={readOnly}
                onClick={() => onChange(opt.val)}
                className={`rounded-btn px-5 py-2 font-raleway text-sm font-semibold ring-1 transition-colors ${
                  active
                    ? 'bg-navy text-white ring-navy'
                    : 'bg-white text-muted ring-border hover:ring-navy'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      );
    case 'file':
      return <FileField q={q} value={value} onChange={onChange} readOnly={readOnly} />;
    case 'text':
    default:
      return (
        <input
          id={q.id}
          type="text"
          disabled={readOnly}
          maxLength={q.maxLength}
          placeholder={q.placeholder}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      );
  }
}

/**
 * A file question — uploads for real.
 *
 * This previously stored only `file.name`, so a supplier could attach their
 * business licence, see a green "Selected: licence.pdf", submit, and we'd
 * have kept nothing but the string. The answer value is now the stored URL
 * (comma-joined when a question takes several files), which is what the
 * imported PIQ answers already hold.
 */
function FileField({
  q,
  value,
  onChange,
  readOnly,
}: {
  q: PIQQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  readOnly: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const urls = typeof value === 'string' && value.trim() ? value.split(',').map((u) => u.trim()).filter(Boolean) : [];

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (q.maxSizeMB && file.size > q.maxSizeMB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(1)}MB — the limit is ${q.maxSizeMB}MB.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const { url } = await uploadSupplierDocument(file);
      onChange([...urls, url].join(', '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (i: number) => onChange(urls.filter((_, n) => n !== i).join(', '));

  return (
    <div className="flex flex-col gap-2">
      <input
        id={q.id}
        ref={inputRef}
        type="file"
        disabled={readOnly || busy}
        accept={q.acceptedTypes?.join(',')}
        onChange={(e) => void handleFiles(e.target.files)}
        className="block w-full font-sans text-sm text-muted file:mr-3 file:rounded-btn file:border-0 file:bg-navy file:px-4 file:py-2 file:font-raleway file:text-xs file:font-bold file:text-white hover:file:bg-navy-dark disabled:opacity-60"
      />

      {busy && (
        <span className="inline-flex items-center gap-1.5 font-sans text-xs text-muted">
          <Loader2 size={13} aria-hidden className="animate-spin" /> Uploading…
        </span>
      )}
      {error && <span role="alert" className="font-sans text-xs text-danger">{error}</span>}

      {urls.length > 0 && (
        <ul className="flex flex-col gap-1">
          {urls.map((url, i) => (
            <li key={url} className="flex items-center gap-2">
              <Check size={13} strokeWidth={3} aria-hidden className="shrink-0 text-success" />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="truncate font-sans text-xs text-navy underline hover:text-amber-dark"
              >
                {url.split('/').pop()}
              </a>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="Remove this file"
                  className="ml-auto shrink-0 text-muted hover:text-danger"
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {q.maxSizeMB && (
        <span className="font-sans text-[11px] text-muted">
          Max {q.maxSizeMB}MB{q.acceptedTypes ? ` · ${q.acceptedTypes.join(', ')}` : ''}
        </span>
      )}
    </div>
  );
}

function isAnswered(v: AnswerValue): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true; // numbers, booleans
}
