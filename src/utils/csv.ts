/**
 * ============================================================================
 * CSV PARSER & TEMPLATE UTILITY (`src/utils/csv.ts`)
 * ============================================================================
 * What this module does:
 * - Parses raw CSV strings into typed JavaScript objects (RFC 4180 compliant).
 * - Handles quotes, escaped quotes, newlines, commas inside fields, and BOM.
 * - Generates and triggers instant browser downloads for sample CSV templates.
 * - Operates 100% in browser RAM with zero disk persistence.
 */

export interface ParsedCsvRow {
  [key: string]: string;
}

export interface CsvParseResult {
  headers: string[];
  rows: ParsedCsvRow[];
  errors: string[];
}

/**
 * Parses raw CSV string into an array of key-value row objects.
 * Handles quotes, embedded commas, multiline values, and CRLF line breaks.
 */
export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  if (!text || !text.trim()) {
    return { headers: [], rows: [], errors: ['CSV file is empty.'] };
  }

  // Remove Byte Order Mark (BOM) if present from Excel exports
  const cleanText = text.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // Skip LF in CRLF
        }
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last trailing field and row if any
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  // Filter out empty rows (e.g. blank trailing lines)
  const nonEmptyRows = rows.filter((r) => r.some((field) => field.trim().length > 0));

  if (nonEmptyRows.length === 0) {
    return { headers: [], rows: [], errors: ['CSV contains no valid data rows.'] };
  }

  const rawHeaders = nonEmptyRows[0];
  const headers = rawHeaders.map((h) => h.trim());

  if (headers.length === 0 || headers.every((h) => !h)) {
    return { headers: [], rows: [], errors: ['CSV header row is missing or empty.'] };
  }

  const dataRows = nonEmptyRows.slice(1);
  const parsedRows: ParsedCsvRow[] = [];

  dataRows.forEach((rowVals, rowIndex) => {
    const rowObj: ParsedCsvRow = {};
    headers.forEach((header, colIndex) => {
      rowObj[header] = rowVals[colIndex] ?? '';
    });
    parsedRows.push(rowObj);
  });

  return { headers, rows: parsedRows, errors };
}

/**
 * Downloads a generated CSV string as a downloadable file in the browser.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * CSV Templates for Bulk Operations
 */
export const CSV_TEMPLATES = {
  products: {
    filename: 'stockflow_products_template.csv',
    content: `Name,SKU,Category,Price,InitialStock,ReorderLevel,Supplier,Description
"Wireless Ergonomic Mouse",WM-101,"Computer Accessories",29.99,25,10,"TechSource Ltd","2.4GHz rechargeable wireless mouse"
"Braided HDMI 2.1 Cable",HC-202,"Cables",18.50,50,15,"Global Electronics","High speed 48Gbps 8K cable 2m"
"USB-C Multiport Hub",UH-303,"Computer Accessories",49.00,12,5,"TechSource Ltd","7-in-1 4K HDMI 100W PD"
"Noise Cancelling Headset",NH-404,"Audio",89.99,10,4,"OfficePro Supplies","Over-ear headset with boom mic"`,
  },
  'stock-in': {
    filename: 'stockflow_stock_in_template.csv',
    content: `SKU,Quantity,Supplier,Reference,Notes
WM-001,20,"TechSource Ltd",PO-2026-CSV1,"Quarterly restock replenishment"
MK-002,15,"TechSource Ltd",PO-2026-CSV2,"Warehouse intake batch"
UC-003,50,"Global Electronics",PO-2026-CSV3,"Bulk cable delivery"`,
  },
  'stock-out': {
    filename: 'stockflow_stock_out_template.csv',
    content: `SKU,Quantity,Reference,Notes
WM-001,2,SO-2026-CSV1,"Customer order dispatch #4821"
MK-002,4,SO-2026-CSV2,"Internal IT department workstation setup"`,
  },
};
