import { SessionForm } from "./SessionForm";

export const metadata = {
  title: "New Session — INFITRA",
};

export default function NewSessionPage() {
  return (
    <div className="py-10 max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight mb-2">
        Create a Session
      </h1>
      <p className="text-sm text-[#9CF0FF]/40 mb-10">
        Set up the basics. You can edit everything before publishing.
      </p>
      <SessionForm />
    </div>
  );
}
