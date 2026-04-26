import Image from 'next/image';

interface AboutProductSectionProps {
  title: string;
  body: string;
  image: string;
  brand: string;
}

export function AboutProductSection({
  title,
  body,
  image,
  brand,
}: AboutProductSectionProps) {
  return (
    <section className="bg-page py-12 md:py-20">
      <div className="mx-auto grid max-w-site grid-cols-1 items-center gap-8 px-4 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-4">
          <p className="font-raleway text-xs font-semibold uppercase tracking-btn text-amber">
            About {brand}
          </p>
          <h2 className="font-raleway text-3xl font-bold leading-tight text-navy md:text-5xl">
            {title}
          </h2>
          <p className="font-sans text-base leading-relaxed text-charcoal md:text-lg">
            {body}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <span className="rounded-full border border-border bg-white px-4 py-1.5 font-raleway text-xs font-semibold text-navy">
              ✓ Pan-African Sourcing
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-1.5 font-raleway text-xs font-semibold text-navy">
              ✓ Fair Trade Certified
            </span>
            <span className="rounded-full border border-border bg-white px-4 py-1.5 font-raleway text-xs font-semibold text-navy">
              ✓ Cruelty-Free
            </span>
          </div>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-card-hover md:aspect-square">
          <Image
            src={image}
            alt={title}
            width={1200}
            height={1200}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-navy/10 to-transparent" />
        </div>
      </div>
    </section>
  );
}
