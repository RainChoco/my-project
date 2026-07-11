import { useToast } from "@/hooks/use-toast"
import { Toast } from "@/components/ui/toast"

function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4">
      {toasts.map((toastItem) => (
        <Toast key={toastItem.id} {...toastItem} />
      ))}
    </div>
  );
}

export { Toaster };
