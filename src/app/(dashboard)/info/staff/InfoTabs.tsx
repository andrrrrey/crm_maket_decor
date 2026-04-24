"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Search } from "lucide-react";
import {
  AddStaffButton,
  EditStaffButton,
  DeleteStaffButton,
  AddContractorButton,
  EditContractorButton,
  DeleteContractorButton,
} from "./InfoActions";

interface Staff {
  id: string;
  section: string;
  fullName: string;
  position: string;
  passport: string | null;
  birthDate: Date | null;
  startDate: string | null;
  address: string | null;
  phone: string | null;
  hasVehicle: string | null;
  telegramLink: string | null;
  notes: string | null;
}

interface Contractor {
  id: string;
  name: string | null;
  category: string;
  companyName: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  recordedBy: string | null;
}

const TAB_LABELS: Record<string, string> = {
  CORE_TEAM: "Основная команда",
  FREELANCE_MALE: "Фрилансы парни",
  FREELANCE_FEMALE: "Фрилансы девочки",
  DRIVERS: "Газелисты",
  CONTRACTORS: "Подрядчики",
};

const TABS = ["CORE_TEAM", "FREELANCE_MALE", "FREELANCE_FEMALE", "DRIVERS", "CONTRACTORS"];

function StaffTable({
  staff,
  isDirector,
}: {
  staff: Staff[];
  isDirector: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return staff;
    const q = search.toLowerCase();
    return staff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.position?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q)
    );
  }, [staff, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
      </div>

      {isDirector && <AddStaffButton />}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-2 text-left">ФИО</th>
              <th className="px-3 py-2 text-left">Должность</th>
              <th className="px-3 py-2 text-left">Телефон</th>
              <th className="px-3 py-2 text-left">Дата рождения</th>
              <th className="px-3 py-2 text-left">Начало работы</th>
              <th className="px-3 py-2 text-left">Адрес</th>
              <th className="px-3 py-2 text-left">Паспорт</th>
              <th className="px-3 py-2 text-left">Авто</th>
              <th className="px-3 py-2 text-left">Примечание</th>
              {isDirector && <th className="px-3 py-2 text-right">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isDirector ? 10 : 9} className="px-3 py-6 text-center text-muted-foreground">
                  {search ? "Ничего не найдено" : "Нет сотрудников"}
                </td>
              </tr>
            ) : (
              filtered.map((person) => (
                <tr key={person.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-2 font-medium">{person.fullName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{person.position}</td>
                  <td className="px-3 py-2">{person.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    {person.birthDate
                      ? format(new Date(person.birthDate), "dd.MM.yyyy", { locale: ru })
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{person.startDate ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate" title={person.address ?? ""}>
                    {person.address ?? "—"}
                  </td>
                  <td className="px-3 py-2">{person.passport ?? "—"}</td>
                  <td className="px-3 py-2">{person.hasVehicle ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[160px] truncate" title={person.notes ?? ""}>
                    {person.notes ?? "—"}
                  </td>
                  {isDirector && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <EditStaffButton person={person} />
                        <DeleteStaffButton personId={person.id} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractorsTable({
  contractors,
  isDirector,
}: {
  contractors: Contractor[];
  isDirector: boolean;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return contractors;
    const q = search.toLowerCase();
    return contractors.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [contractors, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:ring-1 focus:ring-ring outline-none"
        />
      </div>

      {isDirector && <AddContractorButton />}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Наименование</th>
              <th className="px-3 py-2 text-left">Название компании</th>
              <th className="px-3 py-2 text-left">Адрес</th>
              <th className="px-3 py-2 text-left">Телефон</th>
              <th className="px-3 py-2 text-left">Примечание</th>
              <th className="px-3 py-2 text-left">Кто записал</th>
              {isDirector && <th className="px-3 py-2 text-right">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isDirector ? 7 : 6} className="px-3 py-6 text-center text-muted-foreground">
                  {search ? "Ничего не найдено" : "Нет подрядчиков"}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-3 py-2 font-medium">{c.name ?? c.category}</td>
                  <td className="px-3 py-2">{c.companyName}</td>
                  <td className="px-3 py-2">{c.address ?? "—"}</td>
                  <td className="px-3 py-2">{c.phone ?? "—"}</td>
                  <td className="px-3 py-2 max-w-[200px] truncate" title={c.notes ?? ""}>
                    {c.notes ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.recordedBy ?? "—"}</td>
                  {isDirector && (
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1 justify-end">
                        <EditContractorButton contractor={c} />
                        <DeleteContractorButton contractorId={c.id} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InfoTabs({
  staffBySection,
  contractors,
  isDirector,
}: {
  staffBySection: Record<string, Staff[]>;
  contractors: Contractor[];
  isDirector: boolean;
}) {
  const [activeTab, setActiveTab] = useState("CORE_TEAM");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b pb-0">
        {TABS.map((tab) => {
          const count =
            tab === "CONTRACTORS"
              ? contractors.length
              : (staffBySection[tab]?.length ?? 0);
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {TAB_LABELS[tab]}
              <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "CONTRACTORS" ? (
        <ContractorsTable contractors={contractors} isDirector={isDirector} />
      ) : (
        <StaffTable
          staff={staffBySection[activeTab] ?? []}
          isDirector={isDirector}
        />
      )}
    </div>
  );
}
