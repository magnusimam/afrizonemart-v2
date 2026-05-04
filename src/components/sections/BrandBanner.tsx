import Image from 'next/image';

const DEFAULT_SRC = '/images/banner-made-in-africa.png';
const DEFAULT_ALT =
  'AfriZoneMart.com — Remember, if it is made in Africa, It is made for you!';

interface Props {
  /// Optional image override fed by the page builder. Defaults to the
  /// "Made in Africa" banner. Layout / sizing stays the same.
  src?: string;
  alt?: string;
}

export function BrandBanner({ src = DEFAULT_SRC, alt = DEFAULT_ALT }: Props = {}) {
  return (
    <section className="w-full bg-white pb-6 md:pb-10">
      <Image
        src={src}
        alt={alt}
        width={1920}
        height={300}
        className="h-auto w-full"
        priority={false}
      />
    </section>
  );
}
