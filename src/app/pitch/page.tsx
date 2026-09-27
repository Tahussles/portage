import type { Metadata } from "next";
import { PitchDeck } from "@/components/pitch/PitchDeck";

export const metadata: Metadata = { title: "Portage · Pitch" };

export default function PitchPage() {
  return <PitchDeck />;
}
