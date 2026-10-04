type IconProps = {
  name: string;
  size?: number;
  /** Flip horizontally in right-to-left layouts (arrows only). */
  flipRtl?: boolean;
  className?: string;
};

/**
 * Line icon from /public/icons, drawn in the current text colour via a CSS
 * mask, so the same file works white on the dark site and ink on light cards.
 * Always decorative: put the meaning in a visible text label next to it.
 */
export function Icon({ name, size = 24, flipRtl = false, className = "" }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`tfs-icon${flipRtl ? " tfs-icon--flip" : ""} ${className}`.trim()}
      style={{
        inlineSize: size,
        blockSize: size,
        maskImage: `url(/icons/${name}.svg)`,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
      }}
    />
  );
}

/** 48px mist tile holding an ink icon, used on dark cards. */
export function IconTile({ name }: { name: string }) {
  return (
    <span className="tfs-icon-tile">
      <Icon name={name} className="tfs-icon--ink" />
    </span>
  );
}
