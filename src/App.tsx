import { useEffect, useMemo } from "react";
import { createCombatLabSaveRepository, type CombatLabSave, type SaveRepository } from "./save";
import { BattleScreen } from "./ui/BattleScreen";
import { PrepareScreen } from "./ui/PrepareScreen";
import { ResultScreen } from "./ui/ResultScreen";
import { useStudioStore } from "./state/studioStore";
import { SaveRepositoryProvider } from "./state/repositoryContext";
import { SaveNotice } from "./ui/SaveNotice";
import { CandidateLabScreen } from "./ui/CandidateLabScreen";

export function App({ repository }: { readonly repository?: SaveRepository<CombatLabSave> }) {
  const screen = useStudioStore((state) => state.screen);
  const applySaveRead = useStudioStore((state) => state.applySaveRead);
  const openCandidateLab = useStudioStore((state) => state.openCandidateLab);
  const returnToPreparation = useStudioStore((state) => state.returnToPreparation);
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
        {screen === "prepare" || screen === "candidates" ? (
          <nav className="lab-navigation" aria-label="Lab sections">
            <button
              className={`button button-control${screen === "prepare" ? " is-active" : ""}`}
              type="button"
              aria-current={screen === "prepare" ? "page" : undefined}
              onClick={returnToPreparation}
            >
              Battle preparation
            </button>
            <button
              className={`button button-control${screen === "candidates" ? " is-active" : ""}`}
              type="button"
              aria-current={screen === "candidates" ? "page" : undefined}
              onClick={openCandidateLab}
            >
              Candidate trial
            </button>
          </nav>
        ) : null}
        {screen === "prepare" ? <PrepareScreen /> : null}
        {screen === "battle" ? <BattleScreen /> : null}
        {screen === "result" ? <ResultScreen /> : null}
        {screen === "candidates" ? <CandidateLabScreen /> : null}
      </main>
    </SaveRepositoryProvider>
  );
}
