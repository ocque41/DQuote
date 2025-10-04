import { Skeleton } from "@/components/ui/skeleton";

export default function QuotesLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-12 rounded-xl" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
