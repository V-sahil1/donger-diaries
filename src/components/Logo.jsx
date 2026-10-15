export default function Logo({ className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <img src="/images/logo.png" alt="Dongar Diaries" />
    </span>
  );
}
