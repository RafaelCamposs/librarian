import {
  cancelLookup,
  closeManualEntry,
  confirmAdd,
  doLookup,
  isbnInput,
  lookupError,
  lookupLoading,
  lookupResult,
  manualAuthors,
  manualEntryOpen,
  manualPublishedYear,
  manualTitle,
  manualTotalPages,
  onIsbnChange,
  openManualEntry,
  submitManualEntry,
} from '../../state/store';
import { CoverImage } from '../CoverImage';

export function AddBook() {
  const loading = lookupLoading.value;
  const error = lookupError.value;
  const result = lookupResult.value;
  const manualOpen = manualEntryOpen.value;
  const showForm = !loading && !result && !manualOpen;

  return (
    <>
      <div class="divider-header">── ADD BOOK ───────────────</div>

      {showForm && (
        <>
          <div class="field-label" style={{ letterSpacing: 1 }}>ISBN</div>
          <input
            class="text-input"
            value={isbnInput.value}
            onInput={(e) => onIsbnChange((e.target as HTMLInputElement).value)}
            placeholder="e.g. 9780593135204"
            style={{ marginBottom: 12 }}
          />
          <div class="btn btn-primary" style={{ width: '100%' }} onClick={() => void doLookup()}>
            LOOKUP
          </div>
        </>
      )}

      {loading && <div class="lookup-loading">querying upstream source...</div>}

      {error && !manualOpen && (
        <>
          <div class="lookup-error">{error}</div>
          <div class="btn btn-dashed-accent" style={{ marginTop: 12 }} onClick={openManualEntry}>
            + ADD MANUALLY
          </div>
        </>
      )}

      {result && (
        <div class="card lookup-result-card">
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <CoverImage coverUrl={result.cover_url} width={56} height={80} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{result.title}</div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>
                {result.authors.join(', ')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                {result.total_pages} pages · {result.published_year}
              </div>
            </div>
          </div>
          <div class="btn-row">
            <div class="btn btn-primary" onClick={() => void confirmAdd()}>
              ADD TO LIST
            </div>
            <div class="btn btn-outline" onClick={cancelLookup}>
              CANCEL
            </div>
          </div>
        </div>
      )}

      {manualOpen && (
        <div class="card lookup-result-card">
          <div class="field-label" style={{ letterSpacing: 1, marginBottom: 10 }}>ADD BOOK MANUALLY</div>

          <div class="field-label">TITLE</div>
          <input
            class="text-input"
            value={manualTitle.value}
            onInput={(e) => (manualTitle.value = (e.target as HTMLInputElement).value)}
            placeholder="e.g. Mistborn: The Final Empire"
            style={{ marginBottom: 12 }}
          />

          <div class="field-label">AUTHORS (COMMA-SEPARATED)</div>
          <input
            class="text-input"
            value={manualAuthors.value}
            onInput={(e) => (manualAuthors.value = (e.target as HTMLInputElement).value)}
            placeholder="e.g. Brandon Sanderson"
            style={{ marginBottom: 12 }}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div class="field-label">PAGES</div>
              <input
                class="text-input"
                type="number"
                min={0}
                value={manualTotalPages.value}
                onInput={(e) => (manualTotalPages.value = (e.target as HTMLInputElement).value)}
                style={{ fontSize: 13, padding: 10 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div class="field-label">YEAR</div>
              <input
                class="text-input"
                type="number"
                value={manualPublishedYear.value}
                onInput={(e) => (manualPublishedYear.value = (e.target as HTMLInputElement).value)}
                style={{ fontSize: 13, padding: 10 }}
              />
            </div>
          </div>

          <div class="btn-row">
            <div class="btn btn-primary" onClick={() => void submitManualEntry()}>
              ADD TO LIST
            </div>
            <div class="btn btn-outline" onClick={closeManualEntry}>
              CANCEL
            </div>
          </div>
        </div>
      )}
    </>
  );
}
