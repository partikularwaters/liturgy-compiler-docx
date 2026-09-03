export interface DiffToken {
  type: "same" | "removed" | "added";
  value: string;
}

// Word-level diff for the Curator Inbox's Library Submission review screen
// (Requested: highlight like a code diff / Google Docs suggested
// edits, word-level so a one-word change doesn't highlight a whole
// paragraph). Small custom LCS-based diff rather than a dependency -- the
// inputs are always two short Library entries, never large documents.
export function wordDiff(oldText: string, newText: string): DiffToken[] {
  // Splitting on /(\s+)/ keeps whitespace as its own tokens so the
  // reconstructed text still reads naturally with original spacing.
  const oldTokens = oldText.split(/(\s+)/).filter((t) => t.length > 0);
  const newTokens = newText.split(/(\s+)/).filter((t) => t.length > 0);

  const m = oldTokens.length;
  const n = newTokens.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] =
        oldTokens[i] === newTokens[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (oldTokens[i] === newTokens[j]) {
      result.push({ type: "same", value: oldTokens[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      result.push({ type: "removed", value: oldTokens[i] });
      i++;
    } else {
      result.push({ type: "added", value: newTokens[j] });
      j++;
    }
  }
  while (i < m) {
    result.push({ type: "removed", value: oldTokens[i] });
    i++;
  }
  while (j < n) {
    result.push({ type: "added", value: newTokens[j] });
    j++;
  }

  return result;
}
