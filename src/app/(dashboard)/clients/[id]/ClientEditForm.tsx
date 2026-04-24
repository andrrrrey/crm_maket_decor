"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CLIENT_STATUS_LABELS, CLIENT_STATUS_COLORS, PROJECT_TYPE_LABELS } from "@/lib/constants";
import type { ClientStatus, ProjectType } from "@/types";
import { Pencil, X, Save, ChevronDown } from "lucide-react";

interface ClientData {
  id: string;
  clientName: string;
  status: ClientStatus;
  projectType: ProjectType;
  dateReceived: string;
  meetingDate: string | null;
  projectDate: string | null;
  venue: string | null;
  source: string | null;
  projectIdea: string | null;
  isRejected: boolean;
}

export function ClientStatusSelect({ client }: { client: ClientData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (client.isRejected) return null;

  const statuses: ClientStatus[] = ["MEETING", "DISCUSSION", "ESTIMATE"];

  const handleChange = async (newStatus: string) => {
    if (newStatus === client.status) return;
    setLoading(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="relative inline-flex">
      <select
        value={client.status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-full border cursor-pointer focus:ring-1 focus:ring-ring outline-none disabled:opacity-60 disabled:cursor-not-allowed bg-background transition-colors"
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {CLIENT_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-muted-foreground" />
    </div>
  );
}

export function ClientEditForm({ client }: { client: ClientData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clientName: client.clientName,
    projectType: client.projectType,
    meetingDate: client.meetingDate ?? "",
    projectDate: client.projectDate ? client.projectDate.split("T")[0] : "",
    venue: client.venue ?? "",
    source: client.source ?? "",
    projectIdea: client.projectIdea ?? "",
  });

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: form.clientName,
        projectType: form.projectType,
        meetingDate: form.meetingDate || null,
        projectDate: form.projectDate || null,
        venue: form.venue || undefined,
        source: form.source || undefined,
        projectIdea: form.projectIdea || undefined,
      }),
    });
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="p-2 rounded-md hover:bg-accent transition-colors"
        title="Редактировать"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Редактировать клиента</h3>
          <button onClick={() => setEditing(false)} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Имя клиента</label>
            <input
              value={form.clientName}
              onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Тип проекта</label>
            <select
              value={form.projectType}
              onChange={(e) => setForm({ ...form, projectType: e.target.value as ProjectType })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            >
              {(Object.entries(PROJECT_TYPE_LABELS) as [ProjectType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Дата встречи</label>
              <input
                type="date"
                value={form.meetingDate}
                onChange={(e) => setForm({ ...form, meetingDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Дата мероприятия</label>
              <input
                type="date"
                value={form.projectDate}
                onChange={(e) => setForm({ ...form, projectDate: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Площадка</label>
            <input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Источник</label>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Идея проекта</label>
            <textarea
              value={form.projectIdea}
              onChange={(e) => setForm({ ...form, projectIdea: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background resize-none focus:ring-1 focus:ring-ring outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-sm rounded-md hover:bg-accent transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !form.clientName.trim()}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Save className="h-3.5 w-3.5" />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
