import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | AgentSiam",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">Get in touch</h1>
      <p className="mt-4 text-muted">
        Tell us about your property or business and we&rsquo;ll get back to
        you.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
