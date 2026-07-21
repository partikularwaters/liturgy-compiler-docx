// Small shared icon set -- stroke-width 2 throughout (bumped up from 1.5,
// per Madrid's "increase the weight of icons" request) so they read clearly
// at the small sizes they're used at (16-18px).
interface IconProps {
  size?: number;
  className?: string;
}

export function PencilIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2.5a1.5 1.5 0 0 1 2 2L6 15l-3.5 1L3.5 12.5z" />
    </svg>
  );
}

// v2 (BSB): solid glyph, not stroke-based like the rest of this set -- the
// source artwork (docs/Translate.svg, supplied by Madrid) is a filled icon,
// so this one uses fill="currentColor" instead of stroke, keeping the
// source's own viewBox rather than forcing it into the 0-20 grid the
// stroke icons share.
export function TranslateIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 888.65365 888.66667" fill="currentColor" className={className}>
      <path d="M429.20606,300.42442h-3.36858L367.55637,474.16225H487.57822Zm0,0h-3.36858L367.55637,474.16225H487.57822Zm451.07057,19.99064H824.6098V655.53467c0,93.229-75.8526,169.08156-169.08156,169.08156H320.42165v55.66691A104.04649,104.04649,0,0,0,424.47184,984.33333H880.27663A104.05478,104.05478,0,0,0,984.32682,880.28314V424.46525A104.04644,104.04644,0,0,0,880.27663,320.41506ZM655.52824,95.66667H199.72337A104.05483,104.05483,0,0,0,95.67318,199.71686V655.53467A104.05478,104.05478,0,0,0,199.72337,759.58486H655.52824A104.05478,104.05478,0,0,0,759.57843,655.53467V199.71686A104.05483,104.05483,0,0,0,655.52824,95.66667ZM544.41566,643.2958l-35.7282-106.35232H346.49921L310.836,643.2958h-83.3963L379.275,211.95572h96.48053L627.81188,643.2958ZM425.83748,300.42442,367.55637,474.16225H487.57822L429.20606,300.42442Z" transform="translate(-95.67318 -95.66667)" />
    </svg>
  );
}

export function TrashIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 5.5h12M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5.5 5.5V16a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.5" />
      <path d="M8.5 9v5M11.5 9v5" />
    </svg>
  );
}

export function ClearIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="10" cy="10" r="7" />
      <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" />
    </svg>
  );
}

export function NoteIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 2.5h7l3 3V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17z" />
      <path d="M12 2.5V6h3M7.5 10h5M7.5 13h5" />
    </svg>
  );
}

export function DownloadIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 3v10M6 9l4 4 4-4" />
      <path d="M4 16.5h12" />
    </svg>
  );
}

export function CopyLinkIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8.5 11.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-1 1" />
      <path d="M11.5 8.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l1-1" />
    </svg>
  );
}

export function CheckIcon({ size = 16, className }: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 10.5l4 4 8-8" />
    </svg>
  );
}
