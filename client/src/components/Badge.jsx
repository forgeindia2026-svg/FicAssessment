import React from 'react';

const Badge = ({ status }) => {
  const normStatus = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (normStatus) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'OPERATIONAL':
    case 'PASSED':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      break;
    case 'REGISTERED':
      colorClasses = 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';
      break;
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      break;
    case 'LINK_GENERATED':
    case 'NOT_STARTED':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
      break;
    case 'CREATED':
      colorClasses = 'bg-rose-50 text-maroon-800 border-rose-200 font-semibold';
      break;
    case 'INACTIVE':
    case 'EXPIRED':
    case 'FAILED':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${colorClasses}`}>
      {status}
    </span>
  );
};

export default Badge;
