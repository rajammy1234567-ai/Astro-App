const VARIANTS = {
  success: { bg: '#dcfce7', color: '#166534' },
  warning: { bg: '#fef9c3', color: '#854d0e' },
  error: { bg: '#fee2e2', color: '#991b1b' },
  info: { bg: '#dbeafe', color: '#1e40af' },
  default: { bg: '#f1f5f9', color: '#475569' },
};

export default function Badge({ children, variant = 'default' }) {
  const v = VARIANTS[variant] || VARIANTS.default;
  return (
    <span className="badge" style={{ background: v.bg, color: v.color }}>
      {children}
    </span>
  );
}