import Image from "next/image";
import Link from "next/link";

export function BrandLogo({
  className = "h-16",
  href = "/",
}: {
  className?: string;
  href?: string | null;
}) {
  const image = (
    <span className={`inline-flex ${className}`}>
      <Image
        src="/logo.jpg"
        alt="BuildLink ET"
        width={552}
        height={457}
        className="h-full w-auto rounded-xl bg-[#f6f1e7] object-contain"
        style={{ width: "auto", height: "100%" }}
      />
    </span>
  );
  if (!href) return image;
  return (
    <Link href={href} className="inline-flex shrink-0" aria-label="BuildLink ET home">
      {image}
    </Link>
  );
}
