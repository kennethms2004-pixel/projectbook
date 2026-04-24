import Image from "next/image";

type LoadingOverlayProps = {
  message?: string;
};

export function LoadingOverlay({
  message = "Preparing your interactive reading experience...",
}: LoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-[#fdfcfb]/88 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Image
        src="/assets/loader.png"
        alt=""
        aria-hidden
        width={72}
        height={72}
        className="animate-spin"
      />
      <p className="text-base font-medium text-[#47372d]">{message}</p>
    </div>
  );
}
