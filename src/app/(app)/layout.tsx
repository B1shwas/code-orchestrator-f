import { AuthGuard } from "@/components/auth-guard";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";

/** Authenticated workspace shell — guard + sidebar + content column. */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-canvas font-sans text-primary">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav />
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
