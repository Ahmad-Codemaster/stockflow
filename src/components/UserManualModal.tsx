import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  HelpCircle,
  Layers,
  Package,
  Shield,
  Tag,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Tab = 'setup' | 'operations' | 'rbac';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManualModal({ isOpen, onClose }: UserManualModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('setup');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-fade-slide">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Warehouse size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">StockFlow User Manual & Operational Guide</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Standard Operating Procedures
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Step-by-step instructions for managing catalog, inventory movements, and team operations.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close manual"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200/80 bg-white shrink-0 overflow-x-auto">
          {[
            { id: 'setup', label: 'Step-by-Step Setup Guide', icon: Layers },
            { id: 'operations', label: 'Daily Stock Movements', icon: Package },
            { id: 'rbac', label: 'Roles & Permissions', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={15} className={active ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-700 text-xs leading-relaxed">
          {/* TAB 1: STEP-BY-STEP SETUP GUIDE */}
          {activeTab === 'setup' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <h3 className="font-bold text-sm text-slate-900 mb-1">Getting Started: Logical Order of Operations</h3>
                <p className="text-slate-600">
                  Follow this sequential sequence to set up your inventory accurately from scratch. Setting up foundation data first ensures products link smoothly to categories and suppliers.
                </p>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    step: '1',
                    icon: Tag,
                    color: 'text-amber-600 bg-amber-50 border-amber-200',
                    title: 'Step 1: Create Categories',
                    nav: 'Categories',
                    desc: 'Group your inventory into logical departments (e.g., "Electronics", "Peripherals", "Accessories"). Products require a valid category before they can be saved.',
                    action: 'Go to Categories -> Click "Add Category" -> Enter category name & save.',
                  },
                  {
                    step: '2',
                    icon: Truck,
                    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
                    title: 'Step 2: Add Verified Suppliers',
                    nav: 'Suppliers',
                    desc: 'Register vendors and distributors you purchase stock from, including contact name, corporate email, phone number, and physical address.',
                    action: 'Go to Suppliers -> Click "Add Supplier" -> Enter vendor details & save.',
                  },
                  {
                    step: '3',
                    icon: Boxes,
                    color: 'text-blue-600 bg-blue-50 border-blue-200',
                    title: 'Step 3: Register Products & SKUs',
                    nav: 'Products -> Add Product',
                    desc: 'Create master SKU records. Specify product name, unique SKU (e.g., "SKU-PRO-001"), unit price, category, preferred supplier, reorder threshold alert level, and optional opening initial stock.',
                    action: 'Go to Products -> Click "Add Product" -> Fill form fields & submit.',
                  },
                  {
                    step: '4',
                    icon: ArrowUpRight,
                    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
                    title: 'Step 4: Receive Stock In Replenishments',
                    nav: 'Stock In',
                    desc: 'When new shipments arrive at the facility, record the inbound receipt. Link the supplier, enter incoming quantity, and record the invoice or PO reference number.',
                    action: 'Go to Stock In -> Select SKU -> Enter quantity & supplier -> Record Inbound.',
                  },
                  {
                    step: '5',
                    icon: ArrowDownRight,
                    color: 'text-rose-600 bg-rose-50 border-rose-200',
                    title: 'Step 5: Dispatch Stock Out Orders',
                    nav: 'Stock Out',
                    desc: 'Fulfill customer orders or dispatch outbound stock. The system checks available quantity and automatically prevents negative inventory if stock is insufficient.',
                    action: 'Go to Stock Out -> Select SKU -> Enter dispatch quantity & reference -> Confirm.',
                  },
                  {
                    step: '6',
                    icon: Warehouse,
                    color: 'text-purple-600 bg-purple-50 border-purple-200',
                    title: 'Step 6: Monitor Real-Time Health & Reports',
                    nav: 'Dashboard & Reports',
                    desc: 'Track live asset valuation, inventory distribution, items hitting low-stock thresholds, and tamper-proof ledger transaction logs.',
                    action: 'Review Dashboard KPIs, Low-Stock warning badges, and movement charts.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.color}`}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                            <span className="ml-2 text-[10px] font-mono text-slate-400">Navigation: {item.nav}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed pl-11">
                        {item.desc}
                      </p>
                      <div className="pl-11 pt-1 text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                        <span>Action:</span>
                        <span className="text-slate-700 font-normal">{item.action}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DAILY STOCK MOVEMENTS */}
          {activeTab === 'operations' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Inventory Movement Procedures</h3>
                <p className="text-slate-500 text-[11px] mt-1">
                  How inbound receiving and outbound dispatch transactions operate.
                </p>
              </div>

              <div className="grid gap-4">
                {/* Stock In Card */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <ArrowUpRight size={16} className="text-emerald-600" />
                    <span>Stock-In Replenishment Protocol</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    1. Navigate to <strong>Stock In</strong> from the sidebar or dashboard.<br />
                    2. Select the destination product from the catalog dropdown.<br />
                    3. Enter the incoming unit quantity (must be a positive integer $\ge 1$).<br />
                    4. Select the sourcing supplier and specify a reference ID (e.g., Purchase Order # or Vendor Bill #).<br />
                    5. Click <strong>"Record Stock In"</strong>. The current inventory count is incremented immediately and a permanent entry is added to the ledger.
                  </p>
                </div>

                {/* Stock Out Card */}
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <ArrowDownRight size={16} className="text-rose-600" />
                    <span>Stock-Out Fulfillment & Negative Stock Guard</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    1. Navigate to <strong>Stock Out</strong> from the sidebar or dashboard.<br />
                    2. Select the product to be dispatched. The form displays real-time available stock.<br />
                    3. Enter the dispatch quantity. <em>Important: If you enter more units than available, the system immediately prevents submission.</em><br />
                    4. Enter a customer invoice or sales order reference.<br />
                    5. Click <strong>"Confirm Stock Out"</strong>. Available stock is deducted atomically and recorded in the audit trail.
                  </p>
                </div>

                {/* Stock Status Rules */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <span className="font-bold text-slate-900 text-xs">Dynamic Stock Status Indicators</span>
                  <div className="grid sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        In Stock
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Current stock is strictly above the product's reorder threshold.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Low Stock
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Current stock has dropped at or below the reorder threshold.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Out of Stock
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Current quantity equals zero. Outbound dispatch is blocked.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ROLES & PERMISSIONS */}
          {activeTab === 'rbac' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Roles & Access Permissions</h3>
                <p className="text-slate-500 text-[11px] mt-1">
                  StockFlow enforces role-based access control to maintain security and operational accountability.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
                  <span className="font-bold text-blue-900 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Administrator Role (Full Authority)
                  </span>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li>• Create, edit, and delete products & pricing</li>
                    <li>• Create and manage categories & suppliers</li>
                    <li>• Perform Stock In and Stock Out operations</li>
                    <li>• Access the User Management console</li>
                    <li>• Provision new user accounts and assign roles</li>
                    <li>• Deactivate / reactivate staff accounts</li>
                    <li>• Perform system maintenance and store reset</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
                  <span className="font-bold text-emerald-900 text-xs flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    Staff Member Role (Operational Terminal)
                  </span>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li>• View Operations Dashboard and metrics</li>
                    <li>• Browse products catalog and search SKUs</li>
                    <li>• Perform Stock In receiving workflows</li>
                    <li>• Perform Stock Out fulfillment workflows</li>
                    <li>• View full transaction movement history</li>
                    <li>• View inventory reports and low-stock alerts</li>
                    <li>• Change own password in System Settings</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
                <span className="font-bold text-slate-800">Security Note:</span> User provisioning and catalog modifications are strictly restricted to administrators. Staff members attempting to access restricted URLs are rejected with security guards.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono shadow-2xs">ESC</kbd> to close
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Manual
          </button>
        </div>
      </div>
    </div>
  );
}
