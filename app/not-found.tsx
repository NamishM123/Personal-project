import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <p className="text-6xl font-semibold tracking-tight">404</p>
        <p className="mt-2 text-sm text-muted">That page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
