import type { PhotoKey } from "@/config/site";
import { Photo } from "./Photo";

/** Interior page header: headline on ivory with an optional photo panel. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  photo,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: React.ReactNode;
  photo?: PhotoKey;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line">
      <div
        className={`container-site grid gap-10 py-14 md:py-20 ${photo ? "lg:grid-cols-12 lg:items-center lg:gap-16" : ""}`}
      >
        <div className={photo ? "lg:col-span-6" : "max-w-3xl"}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-5 text-[2.6rem] font-medium text-evergreen-900 sm:text-5xl lg:text-[3.6rem]">
            {title}
          </h1>
          {intro && <div className="mt-6 max-w-xl text-lg text-ink-muted">{intro}</div>}
          {children && <div className="mt-8">{children}</div>}
        </div>
        {photo && (
          <div className="lg:col-span-6">
            <Photo
              photo={photo}
              fill
              eager
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="aspect-[4/3] rounded-md"
            />
          </div>
        )}
      </div>
    </section>
  );
}
