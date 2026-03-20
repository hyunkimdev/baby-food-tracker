const s = { width: '1em', height: '1em', fill: 'currentColor', verticalAlign: '-0.125em' } as const;

export function IconSnowflake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M20.79 13.95l-1.5-.87L21 12l-1.71-1.08 1.5-.87-1-1.73-1.5.87V7.5h-2v1.69l-1.5-.87-1 1.73L16.29 11H13V7.71l1.5.87 1-1.73-1.5-.87L15.71 4h-2V2h-2v2H9.71L11 7.71l-1.5.87 1 1.73L12 9.44V11H8.71l1.5-.87-1-1.73-1.5.87V7.5h-2v1.69l-1.5-.87-1 1.73L4.71 11 3 12l1.71 1.08-1.5.87 1 1.73 1.5-.87V16.5h2v-1.69l1.5.87 1-1.73L7.71 13H11v1.56l-1.5-.87-1 1.73 1.5.87L8.29 18h2v2h2v-2h1.71L12.5 16.29l1.5-.87-1-1.73-1.5.87V13h3.29l-1.5.87 1 1.73 1.5-.87V16.5h2v-1.69l1.5.87z"/>
    </svg>
  );
}

export function IconThermometer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-4-8c0-.55.45-1 1-1s1 .45 1 1v3h-2V5z"/>
    </svg>
  );
}

export function IconPlate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
    </svg>
  );
}

export function IconList({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
    </svg>
  );
}

export function IconSunrise({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M3 18h18v2H3v-2zm0-3h2c0-2.76 2.24-5 5-5 .71 0 1.39.15 2 .42.61-.27 1.29-.42 2-.42 2.76 0 5 2.24 5 5h2c0-3.54-2.61-6.47-6-6.93V4h-2v4.07c-3.39.46-6 3.39-6 6.93z"/>
    </svg>
  );
}

export function IconSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
    </svg>
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
    </svg>
  );
}

export function IconWarning({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>
  );
}

export function IconThumbUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
  );
}

export function IconFullscreen({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
    </svg>
  );
}

export function IconFullscreenExit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
    </svg>
  );
}

export function IconSettings({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={s} className={className}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
  );
}
