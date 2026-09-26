type MapleMarkProps = {
  className?: string;
};

/** Original geometric maple leaf, drawn as a single outline plus stem. */
export function MapleMark({ className }: MapleMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2.5 13.6 6.4 16 5.4 15.2 9.8 19.4 8.2 18.5 11.1 21 12 16.7 15.3 17.3 17 12 16.2 6.7 17 7.3 15.3 3 12 5.5 11.1 4.6 8.2 8.8 9.8 8 5.4 10.4 6.4Z" />
      <path d="M12 16.2V21.5" />
    </svg>
  );
}
