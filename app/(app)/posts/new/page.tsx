import { CreatePostForm } from "@/components/posts/create-post-form";

export default function NewPostPage() {
  return (
    <section className="space-y-6" aria-labelledby="new-post-title">
      <div>
        <p className="text-muted mb-2 text-sm font-bold uppercase">New post</p>
        <h1 id="new-post-title" className="text-3xl leading-tight font-bold">
          Create post
        </h1>
      </div>

      <div className="border-border bg-surface rounded-lg border p-6">
        <CreatePostForm />
      </div>
    </section>
  );
}
