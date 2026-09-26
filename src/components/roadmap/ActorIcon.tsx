import { Building2, ClipboardCheck, GraduationCap, Landmark, User } from "lucide-react";
import type { Actor } from "@/lib/engine/types";

const ICONS = {
  you: User,
  cno: Landmark,
  third_party: Building2,
  school: GraduationCap,
  test_provider: ClipboardCheck,
} satisfies Record<Actor, unknown>;

type ActorIconProps = {
  actor: Actor;
  className?: string;
};

export function ActorIcon({ actor, className }: ActorIconProps) {
  const Icon = ICONS[actor];
  return <Icon aria-hidden="true" className={className} />;
}
