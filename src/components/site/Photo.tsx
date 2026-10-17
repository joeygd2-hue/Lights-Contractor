import Image from "next/image";
import { photos, type Photo as PhotoData, type PhotoKey } from "@/config/site";

type Props = {
  photo: PhotoKey;
  sizes: string;
  className?: string;
  imgClassName?: string;
  /** Fill the parent (parent must be positioned and sized). */
  fill?: boolean;
  eager?: boolean;
  /** Hide the "Representative photo" note (e.g. purely decorative crops). */
  hideNote?: boolean;
  /** Alt override; pass "" for decorative use. */
  alt?: string;
};

/**
 * Renders a photo from the config. Stock photos carry a small
 * "Representative photo" note so they're never mistaken for our own work.
 */
export function Photo({
  photo,
  sizes,
  className = "",
  imgClassName = "",
  fill,
  eager,
  hideNote,
  alt,
}: Props) {
  const p: PhotoData = photos[photo];
  const isStock = p.source === "stock";
  return (
    <figure
      className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative"} overflow-hidden bg-evergreen-900 ${className}`}
    >
      {fill ? (
        <Image
          src={p.src}
          alt={alt ?? p.alt}
          fill
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className={`object-cover ${imgClassName}`}
        />
      ) : (
        <Image
          src={p.src}
          alt={alt ?? p.alt}
          width={p.width}
          height={p.height}
          sizes={sizes}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : undefined}
          className={`h-auto w-full ${imgClassName}`}
        />
      )}
      {isStock && !hideNote && (
        <figcaption className="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-evergreen-950/70 px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-ivory/85">
          Representative photo
        </figcaption>
      )}
      {!isStock && p.caption && (
        <figcaption className="absolute bottom-2 left-2 rounded-sm bg-evergreen-950/70 px-2 py-0.5 text-xs text-ivory">
          {p.caption}
        </figcaption>
      )}
    </figure>
  );
}
