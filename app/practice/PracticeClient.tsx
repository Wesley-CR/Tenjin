"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DrillView } from "@/components/drill/DrillView";
import { KANA_GROUPS, buildKanaCards, type groupId } from "@/data/kana";
import { shuffle } from "@/lib/util";
import type { Card, DrillConfig, InputKind, Script } from "@/lib/types";

function buildConfig(sp: URLSearchParams): DrillConfig {
  const dir = sp.get("dir") === "toKana" ? "toKana" : "toRomaji";
  let input = (sp.get("input") ?? "type") as InputKind;
  if (input !== "picker" && input !== "draw") input = "type";
  if (dir === "toRomaji" && input !== "type") input = "type";
  const count = Math.max(0, Number(sp.get("count")) || 0);
  return { deck: "hiragana", label: "Kana", input, direction: dir, count };
}

function buildSelection(sp: URLSearchParams) {
  const scripts = new Set<Script>();
  for (const v of (sp.get("scripts") ?? "hiragana").split(",")) {
    if (v === "hiragana" || v === "katakana") scripts.add(v);
  }
  const groups = new Set<groupId>();
  const valid = new Set<string>(KANA_GROUPS.map((g) => g.id));
  for (const v of (sp.get("groups") ?? "").split(",")) {
    if (valid.has(v)) groups.add(v as groupId);
  }
  return { scripts, groups };
}

export default function PracticeClient() {
  const paramObj = useSearchParams();
  const router = useRouter();
  const config = useMemo(() => buildConfig(paramObj), [paramObj]);
  const selection = useMemo(() => buildSelection(paramObj), [paramObj]);

  const initialCards = useMemo(
    () => buildKanaCards({ ...selection, direction: config.direction }),
    [selection, config.direction]
  );

  const [round, setRound] = useState<{ cards: Card[]; id: number }>(() => ({
    cards: initialCards,
    id: 0,
  }));

  if (initialCards.length === 0) {
    return (
      <section className="empty-state">
        <p>That selection has no characters. Pick at least one script and one group.</p>
        <Link className="btn-primary" href="/">Back to setup</Link>
      </section>
    );
  }

  return (
    <DrillView
      key={`${config.deck}-${round.id}`}
      config={config}
      cards={round.cards}
      onReplay={() => setRound((r) => ({ id: r.id + 1, cards: shuffle(r.cards) }))}
      onReview={(missed) => setRound((r) => ({ id: r.id + 1, cards: shuffle(missed) }))}
      onExit={() => router.push("/")}
    />
  );
}
