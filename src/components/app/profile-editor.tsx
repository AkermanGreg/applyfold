"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Experience, Profile } from "@/lib/profile/schema";

type SaveResult = { ok: true } | { ok: false; message: string };

const nullIfEmpty = (value: string) => (value.trim() === "" ? null : value);
const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

const emptyJob = (): Experience => ({
  title: "",
  employer: "",
  location: null,
  start: null,
  end: null,
  current: false,
  highlights: [],
});

/** Review and correct what we parsed. Everything drafts cite comes from here. */
export function ProfileEditor({
  initial,
  onSave,
  readOnly = false,
}: {
  initial: Profile;
  onSave: (profile: Profile) => Promise<SaveResult>;
  readOnly?: boolean;
}) {
  const [profile, setProfile] = useState(initial);
  const [pending, startTransition] = useTransition();
  const setContact = (key: keyof Profile["contact"], value: string) =>
    setProfile((p) => ({ ...p, contact: { ...p.contact, [key]: nullIfEmpty(value) } }));
  const setJob = (index: number, patch: Partial<Experience>) =>
    setProfile((p) => ({ ...p, experience: p.experience.map((job, i) => (i === index ? { ...job, ...patch } : job)) }));

  const save = () =>
    startTransition(async () => {
      const cleaned: Profile = {
        ...profile,
        experience: profile.experience
          .filter((job) => job.title.trim() || job.employer.trim())
          .map((job) => ({ ...job, highlights: job.highlights.map((line) => line.trim()).filter(Boolean) })),
      };
      const result = await onSave(cleaned);
      if (result.ok) toast.success("Profile saved");
      else toast.error(result.message);
    });

  return (
    <fieldset disabled={readOnly} className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="fullName" label="Full name" value={profile.contact.fullName} onChange={(v) => setContact("fullName", v)} />
          <Field id="email" label="Email" value={profile.contact.email} onChange={(v) => setContact("email", v)} />
          <Field id="phone" label="Phone" value={profile.contact.phone} onChange={(v) => setContact("phone", v)} />
          <Field
            id="location"
            label="Location"
            value={profile.contact.location}
            placeholder="City, State"
            onChange={(v) => setContact("location", v)}
          />
          <Field id="postalCode" label="ZIP / postal code" value={profile.contact.postalCode} onChange={(v) => setContact("postalCode", v)} />
          <Field id="linkedin" label="LinkedIn" value={profile.contact.linkedin} onChange={(v) => setContact("linkedin", v)} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Summary</h2>
        <Field
          id="headline"
          label="Headline"
          value={profile.headline}
          placeholder="e.g. ICU Registered Nurse"
          onChange={(v) => setProfile((p) => ({ ...p, headline: nullIfEmpty(v) }))}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">About you</Label>
          <Textarea
            id="summary"
            rows={4}
            value={profile.summary ?? ""}
            onChange={(event) => setProfile((p) => ({ ...p, summary: nullIfEmpty(event.target.value) }))}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Experience</h2>
          {!readOnly ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setProfile((p) => ({ ...p, experience: [emptyJob(), ...p.experience] }))}
            >
              <Plus aria-hidden="true" /> Add role
            </Button>
          ) : null}
        </div>
        {profile.experience.length === 0 ? (
          <p className="text-sm text-muted-foreground">No roles yet. Upload a resume or add one.</p>
        ) : null}
        {profile.experience.map((job, index) => (
          <div key={index} className="flex flex-col gap-4 rounded-xl border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`job-${index}-title`} label="Title" value={job.title} onChange={(v) => setJob(index, { title: v })} />
              <Field id={`job-${index}-employer`} label="Employer" value={job.employer} onChange={(v) => setJob(index, { employer: v })} />
              <Field id={`job-${index}-start`} label="Start" value={job.start} placeholder="2021-06" onChange={(v) => setJob(index, { start: nullIfEmpty(v) })} />
              <div className="flex flex-col gap-1.5">
                <Field
                  id={`job-${index}-end`}
                  label="End"
                  value={job.current ? "" : job.end}
                  placeholder={job.current ? "Present" : "2023-08"}
                  onChange={(v) => setJob(index, { end: nullIfEmpty(v) })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={job.current}
                    onChange={(event) => setJob(index, { current: event.target.checked, end: event.target.checked ? null : job.end })}
                  />
                  I work here now
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`job-${index}-highlights`}>Highlights (one per line)</Label>
              <Textarea
                id={`job-${index}-highlights`}
                rows={4}
                value={job.highlights.join("\n")}
                onChange={(event) =>
                  setJob(index, { highlights: event.target.value.split("\n").map((line) => line.replace(/^\s*[•\-*]\s*/, "")) })
                }
              />
            </div>
            {!readOnly ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-end text-destructive"
                onClick={() => setProfile((p) => ({ ...p, experience: p.experience.filter((_, i) => i !== index) }))}
              >
                <Trash2 aria-hidden="true" /> Remove role
              </Button>
            ) : null}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Skills, licenses & languages</h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="skills">Skills (comma-separated)</Label>
          <Textarea
            id="skills"
            rows={2}
            defaultValue={profile.skills.join(", ")}
            onBlur={(event) => setProfile((p) => ({ ...p, skills: splitList(event.target.value) }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="credentials">Licenses & certifications (comma-separated)</Label>
          <Textarea
            id="credentials"
            rows={2}
            defaultValue={profile.credentials.map((credential) => credential.name).join(", ")}
            onBlur={(event) =>
              setProfile((p) => ({
                ...p,
                credentials: splitList(event.target.value).map(
                  (name) => p.credentials.find((existing) => existing.name === name) ?? { name, issuer: null, expires: null },
                ),
              }))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="languages">Languages (comma-separated)</Label>
          <Input
            id="languages"
            defaultValue={profile.languages.join(", ")}
            onBlur={(event) => setProfile((p) => ({ ...p, languages: splitList(event.target.value) }))}
          />
        </div>
      </section>

      {!readOnly ? (
        <div className="sticky bottom-4 flex justify-end">
          <Button type="button" onClick={save} disabled={pending} className="shadow-sm">
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
