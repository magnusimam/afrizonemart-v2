import Image from 'next/image';

export function BrandBanner() {
  return (
    <section className="w-full bg-white pb-6 md:pb-10">
      <Image
        src="/images/banner-made-in-africa.png"
        alt="AfriZoneMart.com — Remember, if it is made in Africa, It is made for you!"
        width={1920}
        height={300}
        className="h-auto w-full"
        priority={false}
      />
    </section>
  );
}
