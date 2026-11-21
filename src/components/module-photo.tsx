import Image from "next/image";

import type { ListingType } from "@/lib/status";

const photos: Record<ListingType, string> = {
  job: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=240&q=80",
  material: "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=240&q=80",
  rental: "https://images.unsplash.com/photo-1517089152318-42ec560349c0?auto=format&fit=crop&w=240&q=80",
  professional: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=240&q=80",
};

export function ModulePhoto({ type, className = "h-12 w-12" }: { type: ListingType; className?: string }) {
  return (
    <Image
      src={photos[type]}
      alt=""
      width={96}
      height={96}
      className={`${className} rounded-xl object-cover`}
    />
  );
}
