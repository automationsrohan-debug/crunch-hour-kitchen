import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Staff Portal — KRUNCH HOUR" }, { name: "robots", content: "noindex" }, { name: "description", content: "KRUNCH HOUR staff portal." }, { property: "og:title", content: "KRUNCH HOUR Staff" }, { property: "og:description", content: "Staff portal." }] }),
  component: Admin,
});

function Admin() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-3xl text-primary">Staff portal</h1>
        <p className="mt-2 text-muted-foreground">The admin dashboard is not built yet.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to site</Link>
      </div>
    </div>
  );
}
