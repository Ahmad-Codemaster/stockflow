import { useState } from 'react';
import { Badge, KPICard, PageHeader } from '../components/ui';
import { useApp } from '../context';

type ReportTab = 'summary' | 'movement' | 'lowstock' | 'value';

function SimpleBarChart({ data }: { data: { label: string; inQty: number; outQty: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        No catalog products or movement activity to chart.
      </div>
    );
  }
  const maxVal = Math.max(...data.flatMap((d) => [d.inQty, d.outQty]), 1);
  return (
    <div className="space-y-3.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>{d.label}</span>
            <span className="font-mono text-slate-400 text-[11px]">
              In: <span className="text-emerald-600 font-bold">{d.inQty}</span> / Out:{' '}
              <span className="text-rose-600 font-bold">{d.outQty}</span>
            </span>
          </div>
          <div className="flex gap-1.5 h-3.5 p-0.5 bg-slate-100/90 rounded-full border border-slate-200/80">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(d.inQty / maxVal) * 100}%`, minWidth: d.inQty > 0 ? '6px' : '0' }}
            />
            <div
              className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${(d.outQty / maxVal) * 100}%`, minWidth: d.outQty > 0 ? '6px' : '0' }}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-5 mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
          Stock-In Replenishment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs" />
          Stock-Out Dispatch
        </span>
      </div>
    </div>
  );
}

export default function Reports() {
  const { products, categories, inventory, transactions, navigate, getStockStatus } = useApp();
  const [tab, setTab] = useState<ReportTab>('summary');
  const [movementType, setMovementType] = useState('');
  const [movementProduct, setMovementProduct] = useState('');

  function getStock(pid: string) {
    return inventory.find((i) => i.productId === pid)?.currentStock ?? 0;
  }
  function getCatName(cid: string) {
    return categories.find((c) => c.id === cid)?.name ?? '—';
  }
  function getProductName(pid: string) {
    return products.find((p) => p.id === pid)?.name ?? 'Unknown';
  }

  const totalValue = products.reduce((sum, p) => sum + getStock(p.id) * p.price, 0);
  const totalStock = inventory.reduce((s, i) => s + i.currentStock, 0);
  const lowCount = products.filter((p) => getStockStatus(p.id) === 'Low Stock').length;
  const outCount = products.filter((p) => getStockStatus(p.id) === 'Out of Stock').length;

  const filteredMovement = transactions.filter((t) => {
    const matchType = !movementType || t.type === movementType;
    const matchProduct = !movementProduct || t.productId === movementProduct;
    return matchType && matchProduct;
  });
  const totalIn = filteredMovement.filter((t) => t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0);
  const totalOut = filteredMovement.filter((t) => t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0);
  const netMovement = totalIn - totalOut;

  // Group transactions by product for bar chart
  const chartData = products.slice(0, 6).map((p) => ({
    label: p.name.split(' ').slice(0, 2).join(' '),
    inQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0),
    outQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0),
  }));

  const lowStockProducts = products.filter(
    (p) => getStockStatus(p.id) === 'Low Stock' || getStockStatus(p.id) === 'Out of Stock'
  );

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'summary', label: 'Inventory Summary' },
    { id: 'movement', label: 'Stock Movement Flow' },
    { id: 'lowstock', label: 'Low Stock Risk Report' },
    { id: 'value', label: 'Valuation Breakdown' },
  ];

  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader title="Intelligence & Analytics" subtitle="Comprehensive financial valuation, inventory turn rates, and velocity reports." />

      {/* Glassmorphic Tab Navigator */}
      <div className="flex gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 w-fit backdrop-blur-xs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary View */}
      {tab === 'summary' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <KPICard label="Total Catalog SKUs" value={products.length} />
            <KPICard label="Total Physical Units" value={totalStock.toLocaleString()} />
            <KPICard
              label="Asset Valuation"
              value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <KPICard label="Low Stock Items" value={lowCount} variant={lowCount > 0 ? 'warning' : 'default'} />
            <KPICard label="Depleted Items" value={outCount} variant={outCount > 0 ? 'danger' : 'default'} />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-200/60 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Master Catalog Overview</h2>
              <span className="text-[11px] text-slate-400">{products.length} Products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {['Product Name', 'Category', 'Current Units', 'Unit Price', 'Total Valuation', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Current Units', 'Unit Price', 'Total Valuation'].includes(h) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {products.map((p) => {
                    const stock = getStock(p.id);
                    const val = stock * p.price;
                    return (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => navigate('product-detail', p.id)}
                            className="hover:text-blue-600 transition-colors text-left"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">{stock}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-blue-700">
                          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={getStockStatus(p.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movement Flow View */}
      {tab === 'movement' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="glass-card rounded-2xl p-3 md:p-4 flex gap-3 flex-wrap items-center">
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
            >
              <option value="">All Movement Types</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
              <option value="Adjustment">Adjustment</option>
            </select>
            <select
              value={movementProduct}
              onChange={(e) => setMovementProduct(e.target.value)}
              className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <KPICard label="Total Inbound Stock" value={totalIn} variant="success" />
            <KPICard label="Total Outbound Dispatched" value={totalOut} variant="danger" />
            <KPICard
              label="Net Inventory Delta"
              value={netMovement >= 0 ? `+${netMovement}` : String(netMovement)}
              variant={netMovement >= 0 ? 'success' : 'danger'}
            />
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Velocity Comparison by SKU
              </h3>
              <SimpleBarChart data={chartData} />
            </div>

            <div className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-200/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Movement Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      {['Timestamp', 'Product Name', 'Type', 'Qty', 'Operator'].map((h) => (
                        <th key={h} className={`px-4 py-2.5 ${h === 'Qty' ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredMovement.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{t.createdAt}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{getProductName(t.productId)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.type} />
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">{t.quantity}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{t.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Low Stock View */}
      {tab === 'lowstock' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-2 gap-4">
            <KPICard
              label="Low Stock Risk Count"
              value={lowCount}
              variant={lowCount > 0 ? 'warning' : 'default'}
              sub="Operating at or below reorder buffer"
            />
            <KPICard
              label="Zero Stock Outages"
              value={outCount}
              variant={outCount > 0 ? 'danger' : 'default'}
              sub="Zero units in physical inventory"
            />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-amber-50/60 border-b border-amber-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Products Requiring Restock Orders
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="px-5 py-12 text-center text-xs text-slate-500 font-medium">
                ✨ All products in the catalog are stocked above their reorder thresholds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      {['Product Name', 'SKU', 'Category', 'Current Units', 'Reorder Level', 'Status'].map((h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Current Units', 'Reorder Level'].includes(h) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {lowStockProducts.map((p) => {
                      const stock = getStock(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => navigate('product-detail', p.id)}
                              className="hover:text-blue-600 transition-colors text-left"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-400">{p.sku}</td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">{stock}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-400">{p.reorderLevel}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={getStockStatus(p.id)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valuation Breakdown View */}
      {tab === 'value' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid xl:grid-cols-3 gap-4">
            <KPICard
              label="Total Capital Valuation"
              value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              variant="success"
            />
            <KPICard
              label="Average SKU Valuation"
              value={`$${
                products.length
                  ? (totalValue / products.length).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'
              }`}
            />
            <KPICard
              label="Top Asset Allocation"
              value={(() => {
                if (!products.length) return '—';
                const p = products.reduce((a, b) =>
                  getStock(a.id) * a.price > getStock(b.id) * b.price ? a : b
                );
                return p.name;
              })()}
            />
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-200/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valuation Distribution by SKU</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {['Product Name', 'Category', 'Stock Units', 'Unit Price', 'Total Valuation', 'Portfolio Share'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Stock Units', 'Unit Price', 'Total Valuation', 'Portfolio Share'].includes(h)
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {[...products]
                    .sort((a, b) => getStock(b.id) * b.price - getStock(a.id) * a.price)
                    .map((p) => {
                      const stock = getStock(p.id);
                      const val = stock * p.price;
                      const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => navigate('product-detail', p.id)}
                              className="hover:text-blue-600 transition-colors text-left"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">{stock}</td>
                          <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right font-extrabold text-blue-700">
                            ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-slate-500 font-mono text-[11px] w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
