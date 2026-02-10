# Photo viewer delete confirmation (skills‑aligned)

## Overview

Replace the browser `confirm()` in the Enterprise Photo Viewer with a centered in-app **AlertDialog** so users must explicitly confirm delete. Apply UI/UX Pro Max, component-reuse, accessibility, and shadcn stack guidance.

---

## Skills and guidelines applied

### UI/UX Pro Max
- **Confirmation dialogs** (ux-guidelines, web-interface): Destructive actions require confirmation; use an in-app “Are you sure?” modal, not direct delete or `confirm()`.
- **shadcn stack**: Use **AlertDialog** for destructive confirmation; use **AlertDialogAction** and **AlertDialogCancel** (standard confirm/cancel pattern).
- **Pre-delivery**: Visible focus states on dialog buttons, smooth transitions (150–300ms), no layout shift; destructive action uses clear visual treatment (e.g. red/destructive variant).

### Component reuse (component-reuse-workflow)
- Use **AlertDialog** from `@/components/ui/alert-dialog.tsx` for this confirmation; do not introduce a new confirmation component.
- Follow existing usage in [components/photo-manager.tsx](components/photo-manager.tsx) and [components/entity-feed-card.tsx](components/entity-feed-card.tsx).

### Accessibility (accessibility-expert)
- **Focus**: AlertDialog (Radix) provides focus trap and return focus; no custom focus code needed.
- **Labels**: Ensure the Trash2 button has an accessible name (e.g. `aria-label="Delete photo"` or wrapped in a label); ensure dialog has **AlertDialogTitle** and **AlertDialogDescription** for screen readers.
- **Keyboard**: Cancel and Confirm must be keyboard-accessible (AlertDialog primitives handle this).

### Project docs
- [docs/UI_UX_IMPROVEMENT_SUGGESTIONS.md](docs/UI_UX_IMPROVEMENT_SUGGESTIONS.md): Use `variant="destructive"` for delete and AlertDialog for irreversible actions.

---

## Current behavior

- **File:** [components/photo-gallery/enterprise-photo-viewer.tsx](components/photo-gallery/enterprise-photo-viewer.tsx)
- Trash2 button (toolbar, ~line 1076) calls `handleDeletePhoto`; that function uses `confirm()` then deletes from `album_images` and shows a toast.

## Target behavior

- Click Trash2 → **centered in-app AlertDialog** opens (no browser `confirm()`).
- User can **Cancel** (close dialog, no delete) or **Confirm** (perform delete, close dialog, toast).
- Dialog and buttons meet a11y and UI/UX Pro checklist (focus, labels, destructive styling).

---

## Implementation steps

1. **Imports**  
   In `enterprise-photo-viewer.tsx`, add from `@/components/ui/alert-dialog`:  
   `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle`.

2. **State**  
   Add `showDeleteConfirmDialog: boolean` (e.g. `useState(false)`) to control the confirmation dialog.

3. **Delete button (toolbar)**  
   - Change Trash2 button from `onClick={handleDeletePhoto}` to `onClick={() => setShowDeleteConfirmDialog(true)}`.
   - Add **accessible name**: `aria-label="Delete photo"` (or use Tooltip with “Delete photo” if the project wraps icon buttons). Ensures a11y and UI/UX Pro “labels for interactive elements”.

4. **Delete logic**  
   - Remove the `confirm()` call from `handleDeletePhoto` (or rename to `performDeletePhoto` and call it only on confirm).
   - Keep existing logic: delete from `album_images` when `albumId`, toast success/error, navigate to next photo or close viewer.

5. **AlertDialog (centered)**  
   - Render **AlertDialog** with `open={showDeleteConfirmDialog}`, `onOpenChange={setShowDeleteConfirmDialog}`.
   - **AlertDialogContent**: Use default (already centered via `left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]` in [components/ui/alert-dialog.tsx](components/ui/alert-dialog.tsx)). If it appears behind the photo viewer, add a higher `z-index` (e.g. `className="... z-[100]"`) so it stacks above the viewer.
   - **AlertDialogHeader**: **AlertDialogTitle** e.g. “Delete photo?”; **AlertDialogDescription** e.g. “Are you sure you want to delete this photo? This action cannot be undone.”
   - **AlertDialogFooter**:  
     - **AlertDialogCancel**: “Cancel” (closes dialog).  
     - **AlertDialogAction**: “Delete”, with **destructive** styling (`className="bg-destructive text-destructive-foreground hover:bg-destructive/90"` or Button `variant="destructive"` if composed that way), per project and UI/UX Pro.
   - On Confirm: call the delete logic, then `setShowDeleteConfirmDialog(false)` and show toast.

6. **Loading and UX**  
   - Optional but recommended: while delete is in progress, set `isDeleting` (or similar), disable **AlertDialogCancel** and **AlertDialogAction**, and show loading state on the Confirm button (e.g. spinner) to avoid double submit and give feedback.

7. **Pre-delivery checks (UI/UX Pro)**  
   - Focus: Dialog receives focus when opened; focus visible on Cancel/Delete (rely on Radix/shadcn defaults; ensure no `outline-none` without replacement).  
   - Transitions: AlertDialog content uses existing `data-[state=open]:animate-in`; no change needed unless adding custom animation.  
   - No layout shift when opening/closing dialog.  
   - Trash2 button has clear hover (existing `hover:bg-[#40A3D8]` or similar is fine); Delete action is clearly destructive.

---

## Files to change

- **Single file:** [components/photo-gallery/enterprise-photo-viewer.tsx](components/photo-gallery/enterprise-photo-viewer.tsx)  
  (imports, state, button handler, AlertDialog markup, optional loading state and z-index.)

---

## Verification

- Open a photo in the viewer → click Trash2 → **centered** confirmation dialog appears.
- Cancel → dialog closes, photo unchanged.
- Confirm Delete → photo removed, dialog closes, toast and navigation as today.
- Keyboard: Tab to Cancel and Delete, Enter/Space activates; Escape closes dialog.
- Run `npm run build` and `npm run lint`; fix any issues. Optionally run E2E that covers the photo viewer.
