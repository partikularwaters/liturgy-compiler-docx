// Shared icon set -- thin wrappers around @tabler/icons-react so every call
// site in the app (list rows, forms, nav, the Reader, SectionCard, etc.)
// keeps importing from here with the same names/props, regardless of which
// icon library backs them. stroke={2} matches this app's icon weight
// convention throughout.
import type { Icon as TablerIcon } from "@tabler/icons-react";
import {
  IconPencil,
  IconLanguage,
  IconHome,
  IconBook2,
  IconTrash,
  IconCircleX,
  IconNotes,
  IconDownload,
  IconLink,
  IconCheck,
  IconPlus,
  IconArrowRight,
  IconArrowLeft,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";

interface IconProps {
  size?: number;
  className?: string;
}

// Default bumped 16 -> 17 (~8% larger, matching every explicit icon size
// across the app) -- HomeIcon is the one exception (always called with its
// own explicit size={20}, never relies on this default) and so is
// unaffected by this change.
function wrap(Tabler: TablerIcon) {
  return function WrappedIcon({ size = 17, className }: IconProps): React.ReactElement {
    return <Tabler size={size} stroke={2} className={className} />;
  };
}

export const PencilIcon = wrap(IconPencil);
// The "alt translation" badge icon (AddExistingSelectionPanel) -- previously
// hand-drawn from Madrid-supplied artwork (docs/Translate.svg); replaced
// with Tabler's own language glyph as part of the full icon-set migration.
export const TranslateIcon = wrap(IconLanguage);
export const HomeIcon = wrap(IconHome);
export const GuideIcon = wrap(IconBook2);
export const TrashIcon = wrap(IconTrash);
export const ClearIcon = wrap(IconCircleX);
export const NoteIcon = wrap(IconNotes);
export const DownloadIcon = wrap(IconDownload);
export const CopyLinkIcon = wrap(IconLink);
export const CheckIcon = wrap(IconCheck);
export const PlusIcon = wrap(IconPlus);
export const ArrowRightIcon = wrap(IconArrowRight);
export const ArrowLeftIcon = wrap(IconArrowLeft);
export const ExternalLinkIcon = wrap(IconExternalLink);
// Plain X, distinct from ClearIcon (circle-x, used for "clear marks" today)
// -- this one's for inline Cancel buttons, which sit right beside a Save/Add
// button and shouldn't be mistaken for a circular dismiss/remove control.
export const XIcon = wrap(IconX);
