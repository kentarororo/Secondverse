import { createContext, type ReactNode, useContext } from "react";
import type { CombatLabSave, SaveRepository } from "../save";

const RepositoryContext = createContext<SaveRepository<CombatLabSave> | null>(null);

export function SaveRepositoryProvider({
  repository,
  children,
}: {
  readonly repository: SaveRepository<CombatLabSave> | null;
  readonly children: ReactNode;
}) {
  return <RepositoryContext.Provider value={repository}>{children}</RepositoryContext.Provider>;
}

export function useCombatLabRepository(): SaveRepository<CombatLabSave> | null {
  return useContext(RepositoryContext);
}
