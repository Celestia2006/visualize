import { useUserStore } from "../store/userStore";
import { themes } from "../styles/themes";

/**
 * Returns the current theme token object so components can read
 * typed values (e.g. for canvas drawing, which can't use CSS vars).
 *
 * For regular JSX, prefer CSS variables directly:
 *   style={{ color: "var(--accent)" }}
 *
 * For canvas / imperative drawing, use:
 *   const T = useTheme();
 *   ctx.fillStyle = T.accent;
 */
export function useTheme() {
  const user = useUserStore((s) => s.user);
  return themes[user?.theme ?? "light"];
}
