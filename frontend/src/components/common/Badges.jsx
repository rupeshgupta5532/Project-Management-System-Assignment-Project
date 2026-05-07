export function StatusBadge({ status }) {
  const styles = {
    'Todo': 'bg-gray-100 text-gray-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
  };
  return <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

export function PriorityBadge({ priority }) {
  const styles = {
    'Low': 'bg-gray-100 text-gray-600',
    'Medium': 'bg-amber-100 text-amber-700',
    'High': 'bg-red-100 text-red-700',
  };
  const dots = { 'Low': '●', 'Medium': '●●', 'High': '●●●' };
  return (
    <span className={`badge gap-1 ${styles[priority] || 'bg-gray-100 text-gray-600'}`}>
      <span className="text-xs">{dots[priority]}</span>
      {priority}
    </span>
  );
}
