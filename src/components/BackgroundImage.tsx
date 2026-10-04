import Image from "next/image";

type Props = {
  src: string;
  /** Empty string for decorative illustrations. */
  alt: string;
  priority?: boolean;
  /** Mirror in RTL so the empty half of the image stays under the text. */
  mirrorRtl?: boolean;
  sizes?: string;
};

/** Image layer that fills its positioned parent, under the parent's overlay. */
export function BackgroundImage({ src, alt, priority, mirrorRtl, sizes = "100vw" }: Props) {
  return (
    <div className={`tfs-bglayer${mirrorRtl ? " tfs-bglayer--mirror" : ""}`}>
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} />
    </div>
  );
}
