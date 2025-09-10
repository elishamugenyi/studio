import { cn } from "@/lib/utils";
import Icon from "@/app/icon.svg?url";
import Image from "next/image";

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-lg font-bold font-headline", className)}>
      <Image src={Icon} alt="TekView logo" width={24} height={24} className="h-6 w-6 text-primary" />
      <span>TekView</span>
    </div>
  );
}
