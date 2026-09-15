import type { ColorAssignment } from "./settings/model";

/** True if `path` is `parent` itself or lies inside the folder `parent`. */
export function isSameOrInside(path: string, parent: string): boolean {
  return path === parent || path.startsWith(parent + "/");
}

/** Updates assignments after a file or folder was renamed or moved. Returns true if anything changed. */
export function renamePaths(assignments: ColorAssignment[], oldPath: string, newPath: string): boolean {
  let changed = false;
  for (const assignment of assignments) {
    if (isSameOrInside(assignment.path, oldPath)) {
      assignment.path = newPath + assignment.path.slice(oldPath.length);
      changed = true;
    }
  }
  return changed;
}

/** Removes assignments of a deleted file or folder and its contents. */
export function removePaths(assignments: ColorAssignment[], deletedPath: string): ColorAssignment[] {
  return assignments.filter((assignment) => !isSameOrInside(assignment.path, deletedPath));
}
