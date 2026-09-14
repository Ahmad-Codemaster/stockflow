/**
 * ============================================================================
 * CSV BULK IMPORT MODAL (`src/components/CsvImportModal.tsx`)
 * ============================================================================
 * What this component does:
 * - Provides an Apple Glass styled modal for uploading bulk CSV files.
 * - Supports three operational modes: 'products' | 'stock-in' | 'stock-out'.
 * - Generates and downloads pre-formatted CSV template files on the fly.
 * - Parses uploaded CSV in browser RAM with instant client-side validation preview.
 * - Discards file memory immediately on close (100% ephemeral in-memory processing).
 * - Enforces Option A (Strict All-or-Nothing): only permits submission when all rows are valid.
 */

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { api } from '../api/client';
import { CSV_TEMPLATES, downloadCsv, parseCsv, type ParsedCsvRow } from '../utils/csv';
import Modal from './Modal';

export type CsvImportMode = 'products' | 'stock-in' | 'stock-out';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: CsvImportMode;
  onSuccess: (count: number) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

interface RowValidation {
  rowIndex: number;
  row: ParsedCsvRow;
  isValid: boolean;
  errors: string[];
}

export default function CsvImportModal({
  isOpen,
  onClose,
  mode,
  onSuccess,
  showToast,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validations, setValidations] = useState<RowValidation[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Configuration per mode
  const modeConfig = {
    products: {
      title: 'Bulk Import Products Catalog',
      subtitle: 'Upload a CSV to batch create product SKUs, prices, categories, and initial stock.',
      expectedColumns: 'Name, SKU, Category, Price, InitialStock, ReorderLevel, Supplier, Description',
      submitText: 'Import Products',
    },
    'stock-in': {
      title: 'Bulk Stock-In Replenishment',
      subtitle: 'Upload a supplier manifest or delivery sheet to restock multiple SKUs atomically.',
      expectedColumns: 'SKU, Quantity, Supplier, Reference, Notes',
      submitText: 'Process Stock-In Batch',
    },
    'stock-out': {
      title: 'Bulk Stock-Out Fulfillment',
      subtitle: 'Upload an order dispatch manifest to fulfill and deduct multiple SKUs atomically.',
      expectedColumns: 'SKU, Quantity, Reference, Notes',
      submitText: 'Process Stock-Out Batch',
    },
  }[mode];

  function resetState() {
    setFileName(null);
    setValidations([]);
    setParseErrors([]);
    setServerError(null);
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClose() {
    resetState();
    onClose();
  }

  function handleDownloadTemplate() {
    const template = CSV_TEMPLATES[mode];
    downloadCsv(template.filename, template.content);
    showToast('info', `Downloaded ${template.filename}`);
  }

  /**
   * Validates parsed CSV rows according to mode rules
   */
  function validateParsedRows(rows: ParsedCsvRow[]): RowValidation[] {
    return rows.map((row, index) => {
      const errs: string[] = [];

      // Helper to find value case-insensitively across headers
      const getVal = (possibleKeys: string[]) => {
        for (const key of possibleKeys) {
          const foundKey = Object.keys(row).find(
            (k) => k.toLowerCase().replace(/[\s_-]/g, '') === key.toLowerCase().replace(/[\s_-]/g, '')
          );
          if (foundKey && row[foundKey] !== undefined) {
            return row[foundKey].trim();
          }
        }
        return '';
      };

      if (mode === 'products') {
        const name = getVal(['name', 'productname', 'title']);
        const sku = getVal(['sku', 'productsku', 'itemcode']);
        const category = getVal(['category', 'categoryname']);
        const price = getVal(['price', 'unitprice', 'cost']);
        const initialStock = getVal(['initialstock', 'stock', 'quantity', 'qty']);
        const reorderLevel = getVal(['reorderlevel', 'reorder', 'minstock']);

        if (!name) errs.push('Product name is required');
        if (!sku) errs.push('SKU is required');
        if (!category) errs.push('Category is required');

        const priceNum = parseFloat(price);
        if (!price || isNaN(priceNum) || priceNum < 0) {
          errs.push('Price must be a non-negative number');
        }

        if (initialStock) {
          const stockNum = parseInt(initialStock, 10);
          if (isNaN(stockNum) || stockNum < 0) {
            errs.push('Initial stock must be a non-negative integer');
          }
        }

        if (reorderLevel) {
          const reorderNum = parseInt(reorderLevel, 10);
          if (isNaN(reorderNum) || reorderNum < 0) {
            errs.push('Reorder level must be a non-negative integer');
          }
        }
      } else if (mode === 'stock-in' || mode === 'stock-out') {
        const sku = getVal(['sku', 'productsku', 'itemcode', 'productid']);
        const qty = getVal(['quantity', 'qty', 'count', 'amount']);

        if (!sku) errs.push('SKU is required');
        const qtyNum = parseInt(qty, 10);
        if (!qty || isNaN(qtyNum) || qtyNum <= 0) {
          errs.push('Quantity must be a positive integer greater than 0');
        }
      }

      return {
        rowIndex: index + 1,
        row,
        isValid: errs.length === 0,
        errors: errs,
      };
    });
  }

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('error', 'Only CSV (.csv) files are supported.');
      return;
    }

    setServerError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);

      if (result.errors.length > 0) {
        setParseErrors(result.errors);
        setValidations([]);
        return;
      }

      setParseErrors([]);
      const validated = validateParsedRows(result.rows);
      setValidations(validated);
    };

    reader.onerror = () => {
      setParseErrors(['Failed to read file. Please verify it is a valid CSV.']);
    };

    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  async function handleSubmit() {
    if (validations.length === 0) return;

    // Strict Option A check: Do not submit if any row has validation errors
    const hasInvalid = validations.some((v) => !v.isValid);
    if (hasInvalid) {
      showToast('error', 'Please resolve all invalid rows before submitting (Strict All-or-Nothing batch).');
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      if (mode === 'products') {
        const items = validations.map((v) => {
          const r = v.row;
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(r).find(
                (item) => item.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
              );
              if (foundKey && r[foundKey] !== undefined) return r[foundKey].trim();
            }
            return '';
          };

          return {
            name: getVal(['name', 'productname', 'title']),
            sku: getVal(['sku', 'productsku', 'itemcode']).toUpperCase(),
            categoryName: getVal(['category', 'categoryname']),
            supplierName: getVal(['supplier', 'suppliername']) || undefined,
            price: parseFloat(getVal(['price', 'unitprice', 'cost'])) || 0,
            initialStock: parseInt(getVal(['initialstock', 'stock', 'quantity', 'qty']), 10) || 0,
            reorderLevel: parseInt(getVal(['reorderlevel', 'reorder', 'minstock']), 10) || 10,
            description: getVal(['description', 'desc', 'notes']) || undefined,
          };
        });

        const res = await api.products.bulkCreate(items);
        showToast('success', `Successfully imported ${res.createdCount} products.`);
        onSuccess(res.createdCount);
        handleClose();
      } else if (mode === 'stock-in') {
        const items = validations.map((v) => {
          const r = v.row;
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(r).find(
                (item) => item.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
              );
              if (foundKey && r[foundKey] !== undefined) return r[foundKey].trim();
            }
            return '';
          };

          return {
            sku: getVal(['sku', 'productsku', 'itemcode', 'productid']).toUpperCase(),
            quantity: parseInt(getVal(['quantity', 'qty', 'count', 'amount']), 10),
            supplierName: getVal(['supplier', 'suppliername']) || undefined,
            reference: getVal(['reference', 'ref', 'ponumber']) || undefined,
            notes: getVal(['notes', 'note', 'reason']) || undefined,
          };
        });

        const res = await api.inventory.bulkStockIn(items);
        showToast('success', `Successfully processed ${res.processedCount} Stock-In transactions.`);
        onSuccess(res.processedCount);
        handleClose();
      } else if (mode === 'stock-out') {
        const items = validations.map((v) => {
          const r = v.row;
          const getVal = (keys: string[]) => {
            for (const k of keys) {
              const foundKey = Object.keys(r).find(
                (item) => item.toLowerCase().replace(/[\s_-]/g, '') === k.toLowerCase().replace(/[\s_-]/g, '')
              );
              if (foundKey && r[foundKey] !== undefined) return r[foundKey].trim();
            }
            return '';
          };

          return {
            sku: getVal(['sku', 'productsku', 'itemcode', 'productid']).toUpperCase(),
            quantity: parseInt(getVal(['quantity', 'qty', 'count', 'amount']), 10),
            reference: getVal(['reference', 'ref', 'sonumber']) || undefined,
            notes: getVal(['notes', 'note', 'reason']) || undefined,
          };
        });

        const res = await api.inventory.bulkStockOut(items);
        showToast('success', `Successfully processed ${res.processedCount} Stock-Out transactions.`);
        onSuccess(res.processedCount);
        handleClose();
      }
    } catch (err: any) {
      setServerError(err?.message || 'Bulk operation failed. All changes have been rolled back.');
      showToast('error', err?.message || 'Bulk operation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  const validCount = validations.filter((v) => v.isValid).length;
  const invalidCount = validations.filter((v) => !v.isValid).length;
  const canSubmit = validations.length > 0 && invalidCount === 0 && !submitting;

  if (!isOpen) return null;

  return (
    <Modal onClose={handleClose} title={modeConfig.title} size="lg">
      <div className="space-y-4">
        {/* Header & Template Download Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-purple-50 border border-purple-200">
          <div>
            <p className="text-xs font-bold text-purple-950 uppercase tracking-wide">
              Expected CSV Column Headers:
            </p>
            <p className="text-xs text-purple-900 font-mono font-bold mt-1 leading-relaxed">
              {modeConfig.expectedColumns}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Execution Error (Batch Aborted & Rolled Back):</p>
              <p className="mt-0.5 font-medium">{serverError}</p>
            </div>
          </div>
        )}

        {/* File Dropzone Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-7 text-center transition-all ${
            dragActive
              ? 'border-purple-600 bg-purple-100/60 scale-[0.99]'
              : 'border-slate-300 hover:border-purple-500 bg-slate-50/80 hover:bg-purple-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-purple-100 text-purple-700 shadow-2xs">
              {fileName ? <FileSpreadsheet className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
            </div>
            <div>
              {fileName ? (
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-sm font-bold text-slate-900">
                    {fileName}
                  </span>
                  <button
                    type="button"
                    onClick={resetState}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop your CSV file here, or{' '}
                    <label
                      htmlFor="csv-file-input"
                      className="text-purple-600 hover:text-purple-700 underline underline-offset-2 cursor-pointer font-bold"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-xs text-slate-600 font-medium mt-1">
                    Strict in-memory processing. File will be parsed and discarded immediately after processing.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            {parseErrors.map((err, i) => (
              <p key={i} className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                {err}
              </p>
            ))}
          </div>
        )}

        {/* Validations & Preview Table */}
        {validations.length > 0 && (
          <div className="space-y-3">
            {/* Status Summary Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <span className="text-slate-700 font-medium">
                Total rows detected: <strong className="text-slate-900 font-bold">{validations.length}</strong>
              </span>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {validCount} Valid
                </span>
                {invalidCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    {invalidCount} Invalid
                  </span>
                )}
              </div>
            </div>

            {/* Preview Table (Scrollable) */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 w-14">Row</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Key Details</th>
                    <th className="py-2.5 px-3">Validation Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {validations.slice(0, 15).map((v) => {
                    const keys = Object.keys(v.row);
                    const summary = keys.slice(0, 3).map((k) => `${k}: ${v.row[k]}`).join(' | ');
                    return (
                      <tr
                        key={v.rowIndex}
                        className={v.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/80 hover:bg-rose-50'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-500 font-semibold">#{v.rowIndex}</td>
                        <td className="py-2 px-3">
                          {v.isValid ? (
                            <span className="text-emerald-700 font-bold">Valid</span>
                          ) : (
                            <span className="text-rose-700 font-bold">Error</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-medium truncate max-w-xs" title={summary}>
                          {summary}
                        </td>
                        <td className="py-2 px-3">
                          {v.isValid ? (
                            <span className="text-slate-500 font-medium">Ready to import</span>
                          ) : (
                            <span className="text-rose-700 font-bold">{v.errors.join('; ')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {validations.length > 15 && (
                <div className="p-2 text-center text-xs text-slate-500 font-medium border-t border-slate-100 bg-slate-50">
                  ...and {validations.length - 15} more rows
                </div>
              )}
            </div>

            {invalidCount > 0 && (
              <p className="text-xs text-rose-700 font-semibold">
                ⚠️ All rows must be valid before executing the import. Please correct the invalid rows in your CSV and re-upload.
              </p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {modeConfig.submitText} ({validCount})
          </button>
        </div>
      </div>
    </Modal>
  );
}
