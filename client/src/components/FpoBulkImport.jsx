import { useState } from 'react';
import Papa from 'papaparse';
import api from '../lib/api';

const TEMPLATE_CSV = `name,phone,village,crop,quantityKg,askPrice,sizeScore,colorScore,defectScore
Sunita Devi,9876500001,Sinnar,Tomato,180,26,85,88,8
Ravi Kumar,9876500002,Niphad,Onion,600,17,75,72,15
Ganesh Jadhav,9876500003,Yeola,Wheat,1200,23,70,70,18`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bhoomi-fpo-import-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function FpoBulkImport({ onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState('');

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setParseError('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length) {
          setParseError(res.errors[0].message);
          return;
        }
        setRows(res.data);
      }
    });
  };

  const submit = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.post('/fpo/bulk-import', { rows });
      setResult(res.data);
      setRows([]);
      setFileName('');
      if (onImported) onImported();
    } catch (err) {
      setResult({ error: err.response?.data?.error || 'Import failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card border border-line rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-forest">FPO bulk onboarding</div>
        <button onClick={downloadTemplate} className="text-xs font-semibold text-indigo-2 underline">
          Download CSV template
        </button>
      </div>
      <p className="text-xs text-ink-soft mb-4">
        Onboard many farmers and their listings in one upload — for FPO coordinators bringing on
        farmers who don't use the app directly themselves.
      </p>

      <input type="file" accept=".csv" onChange={onFile} className="text-xs" />
      {parseError && <p className="text-xs text-[#993C1D] mt-2">{parseError}</p>}

      {rows.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-ink mb-2">
            {fileName} — {rows.length} row{rows.length === 1 ? '' : 's'} parsed
          </div>
          <div className="max-h-40 overflow-y-auto scrollbar-thin border border-line rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-sage-2 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1.5">Farmer</th>
                  <th className="text-left px-2 py-1.5">Crop</th>
                  <th className="text-left px-2 py-1.5">Qty (kg)</th>
                  <th className="text-left px-2 py-1.5">Ask ₹/kg</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1.5">{r.name}</td>
                    <td className="px-2 py-1.5">{r.crop}</td>
                    <td className="px-2 py-1.5">{r.quantityKg}</td>
                    <td className="px-2 py-1.5">{r.askPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 8 && <p className="text-[11px] text-ink-soft mt-1">+ {rows.length - 8} more rows</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-3 w-full bg-forest text-sage font-semibold text-sm py-2 rounded-lg disabled:opacity-60"
          >
            {busy ? 'Importing…' : `Import ${rows.length} listing${rows.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {result && !result.error && (
        <div className="mt-3 bg-[#E1F5EE] text-[#0F6E56] rounded-lg p-3 text-xs">
          Created {result.created} listing{result.created === 1 ? '' : 's'} across{' '}
          {result.farmersCreated + result.farmersReused} farmer{result.farmersCreated + result.farmersReused === 1 ? '' : 's'}
          {' '}({result.farmersCreated} new, {result.farmersReused} reused).
          {result.errors.length > 0 && <div className="mt-1 text-[#854F0B]">{result.errors.length} row(s) skipped — check crop names and numeric fields.</div>}
        </div>
      )}
      {result?.error && <p className="mt-3 text-xs text-[#993C1D]">{result.error}</p>}
    </div>
  );
}
