import { Loader2 } from "lucide-react";

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 animate-fade-in">
    <div className="relative">
      <div className="w-10 h-10 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin-slow" />
    </div>
    <p className="text-sm text-muted-foreground animate-pulse-soft">Processing your text…</p>
  </div>
);

export default LoadingSpinner;
