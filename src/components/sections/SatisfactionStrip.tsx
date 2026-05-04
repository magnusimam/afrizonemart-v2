interface Props {
  /// Page builder feeds the strip text here. Layout stays untouched.
  text?: string;
}

export function SatisfactionStrip({
  text = 'For Your Ultimate Satisfaction',
}: Props = {}) {
  return (
    <div className="w-full bg-amber py-3 text-center">
      <p className="font-raleway text-base font-bold uppercase tracking-btn text-navy md:text-lg">
        {text}
      </p>
    </div>
  );
}
