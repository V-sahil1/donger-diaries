export default function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined icon ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
