import type { Metadata } from "next";

import { RpgGame } from "@/components/RpgGame";

export const metadata: Metadata = {
  title: "Spectrum RPG (working title) — Spectrum Studio",
};

export default function RpgPage() {
  return <RpgGame />;
}
