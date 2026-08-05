import { Suspense } from "react";
import PracticeClient from "./PracticeClient";

export default function PracticePage() {
  return (
    <Suspense fallback={<p className="empty">Loading…</p>}>
      <PracticeClient />
    </Suspense>
  );
}
