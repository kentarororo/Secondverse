import { useEffect, useMemo } from "react";
import { createCombatLabSaveRepository, type CombatLabSave, type SaveRepository } from "./save";
import { BattleScreen } from "./ui/BattleScreen";
import { PrepareScreen } from "./ui/PrepareScreen";
import { ResultScreen } from "./ui/ResultScreen";
import { useStudioStore } from "./state/studioStore";
import { SaveRepositoryProvider } from "./state/repositoryContext";
import { SaveNotice } from "./ui/SaveNotice";

export function App({ repository }: { readonly repository?: SaveRepository<CombatLabSave> }) {
  const screen = useStudioStore((state) => state.screen);
  const applySaveRead = useStudioStore((state) => state.applySaveRead);
  const resolvedRepository = useMemo(
    () =>
      repository ??
      (typeof window !== "undefined"
        ? createCombatLabSaveRepository(window.localStorage)
        : null),
    [repository],
  );

  useEffect(() => {
    applySaveRead(resolvedRepository?.load() ?? { status: "empty" });
  }, [applySaveRead, resolvedRepository]);

  return (
    <SaveRepositoryProvider repository={resolvedRepository}>
      <main className="app-shell">
        <SaveNotice />
        {screen === "prepare" ? <PrepareScreen /> : null}
        {screen === "battle" ? <BattleScreen /> : null}
        {screen === "result" ? <ResultScreen /> : null}
      </main>
    </SaveRepositoryProvider>
  );
}
