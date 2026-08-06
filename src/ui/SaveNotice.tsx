import { useCombatLabRepository } from "../state/repositoryContext";
import { useStudioStore } from "../state/studioStore";

export function SaveNotice() {
  const repository = useCombatLabRepository();
  const recoveryMessage = useStudioStore((state) => state.saveRecoveryMessage);
  const saveNotice = useStudioStore((state) => state.saveNotice);
  const clearSavedData = useStudioStore((state) => state.clearSavedData);
  const continueClean = useStudioStore((state) => state.continueClean);
  const dismissSaveNotice = useStudioStore((state) => state.dismissSaveNotice);

  if (recoveryMessage) {
    return (
      <section className="save-notice save-recovery" role="alert" aria-labelledby="save-recovery-heading">
        <div>
          <h2 id="save-recovery-heading">Saved data needs attention</h2>
          <p>{recoveryMessage}</p>
        </div>
        <div className="save-notice-actions">
          <button
            className="button button-secondary"
            type="button"
            disabled={!repository}
            onClick={() => {
              if (repository) clearSavedData(repository);
            }}
          >
            Clear saved data
          </button>
          <button className="button button-primary" type="button" onClick={continueClean}>
            Continue clean
          </button>
        </div>
      </section>
    );
  }

  if (!saveNotice) return null;

  return (
    <section className="save-notice save-warning" role="status" aria-label="Save notice">
      <p>{saveNotice}</p>
      <button className="button button-quiet" type="button" onClick={dismissSaveNotice}>
        Dismiss
      </button>
    </section>
  );
}
