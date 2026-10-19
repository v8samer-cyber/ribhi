export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };
  return (
    <h1 className={`font-display font-bold tracking-tight ${sizes[size]}`}>
      <span className="text-white">Earn</span>
      <span className="text-loot-orange">Fast</span>
    </h1>
  );
}
