"use client";

export function ManagerFilter({
  managers,
  currentManagerId,
}: {
  managers: { id: string; name: string }[];
  currentManagerId?: string;
}) {
  return (
    <div className="ml-4">
      <select
        className="px-3 py-1.5 text-sm border rounded-md bg-background"
        defaultValue={currentManagerId ?? ""}
        onChange={(e) => {
          const url = new URL(window.location.href);
          if (e.target.value) {
            url.searchParams.set("managerId", e.target.value);
          } else {
            url.searchParams.delete("managerId");
          }
          window.location.href = url.toString();
        }}
      >
        <option value="">Все менеджеры</option>
        {managers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
