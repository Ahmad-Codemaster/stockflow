import { ArrowLeft, Lock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Badge } from '../components/ui';
import { useApp } from '../context';

export default function TransactionDetail() {
  const { transactions, products, suppliers, selectedId, navigate } = useApp();
  const { id: paramId } = useParams<{ id: string }>();

  const txn = transactions.find((t) => t.id === (paramId || selectedId));
  if (!txn) {
    return (
      <div className="max-w-2xl">
        <div className="glass-card rounded-2xl text-center py-16">
          <p className="text-slate-500 text-sm font-medium">Transaction record not found.</p>
          <button
            type="button"
            onClick={() => navigate('transactions')}
            className="mt-3 text-xs font-bold text-blue-600 hover:underline"
          >
            Back to Ledger
          </button>
        </div>
      </div>
    );
  }

  const product = products.find((p) => p.id === txn.productId);
  const supplier = suppliers.find((s) => s.id === txn.supplierId);

  const rows = [
    { label: 'Transaction Audit ID', value: <span className="font-mono text-xs font-bold text-slate-700">{txn.id}</span> },
    {
      label: 'Target Product',
      value: (
        <button
          type="button"
          onClick={() => navigate('product-detail', txn.productId)}
          className="text-blue-600 hover:underline font-bold text-left"
        >
          {product?.name ?? 'Unknown'}
        </button>
      ),
    },
    { label: 'Product SKU', value: <span className="font-mono text-xs text-slate-500">{product?.sku ?? '—'}</span> },
    { label: 'Movement Classification', value: <Badge variant={txn.type} /> },
    {
      label: 'Quantity Delta',
      value: <span className="font-extrabold text-slate-900 text-base">{txn.quantity} units</span>,
    },
    { label: 'Stock Before Execution', value: <span className="font-mono text-slate-600">{txn.previousStock}</span> },
    { label: 'New Stock Balance', value: <span className="font-bold text-blue-700">{txn.newStock}</span> },
    { label: 'Authenticated Operator', value: <span className="font-semibold text-slate-900">{txn.performedBy}</span> },
    { label: 'Execution Timestamp', value: <span className="font-mono text-slate-500 text-xs">{txn.createdAt}</span> },
    { label: 'PO / SO Reference', value: <span className="font-mono text-slate-700">{txn.reference || '—'}</span> },
    { label: 'Supplier Source', value: supplier?.name ?? '—' },
    { label: 'Audit Notes', value: <span className="text-slate-600 italic">{txn.notes || 'No notes provided'}</span> },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('transactions')}
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Transaction Audit Log</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 flex items-center gap-1">
              <Lock size={10} /> Immutable
            </span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Read-only cryptographic audit record.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-slate-100">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-start px-6 py-3.5 hover:bg-slate-50/50 transition-colors text-xs">
            <dt className="w-48 shrink-0 font-bold text-slate-500">{label}</dt>
            <dd className="text-slate-800 font-medium">{value}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
