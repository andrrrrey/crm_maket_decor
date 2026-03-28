import { cn } from "@/lib/utils";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  MOCKUP_STATUS_LABELS,
  MOCKUP_STATUS_COLORS,
} from "@/lib/constants";
import type { ClientStatus, ContractMockupStatus } from "@/types";

interface ClientStatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

export function ClientStatusBadge({ status, className }: ClientStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        CLIENT_STATUS_COLORS[status],
        className
      )}
    >
      {CLIENT_STATUS_LABELS[status]}
    </span>
  );
}

interface MockupStatusBadgeProps {
  status: ContractMockupStatus;
  className?: string;
}

export function MockupStatusBadge({ status, className }: MockupStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        MOCKUP_STATUS_COLORS[status],
        className
      )}
    >
      {MOCKUP_STATUS_LABELS[status]}
    </span>
  );
}
