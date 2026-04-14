import { AppSidebar } from "@/components/app-sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto bg-bg pt-14 md:pt-0">
          <div className="mx-auto max-w-6xl px-4 md:px-6 py-6 md:py-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
