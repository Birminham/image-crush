import React from 'react';
import { fmtBytes } from '../utils/compress';

export default function FileList({ files, results, compressing, progress, onRemove, onCompare, onDownload, onClear }) {
  // Map results by index (results order matches files input order from compressAll)
  const resultByIndex = {};
  results.forEach((r, i) => { resultByIndex[i] = r; });

  return (
    <div className="file-list">
      <div className="file-list-header">
        <span className="flh-count">{files.length} 张图片</span>
        {results.length > 0 && (
          <span className="flh-saved green">已节省 {fmtBytes(files.reduce((s,f)=>s+f.size,0) - results.reduce((s,r)=>s+r.newSize,0))}</span>
        )}
        <button className="btn-clear" onClick={onClear}>清空全部</button>
      </div>

      <div className="file-items">
        {files.map((f, i) => {
          const r = resultByIndex[i];
          const isDone = !!r;
          const isProcessing = compressing && !isDone && i >= progress.done;

          return (
            <div key={i} className={`file-item ${isDone ? 'done' : ''} ${isProcessing ? 'processing' : ''}`}>
              <div className="fi-preview">
                <img src={r ? r.newUrl : URL.createObjectURL(f)} alt={f.name} />
              </div>
              <div className="fi-info">
                <div className="fi-name" title={f.name}>{f.name}</div>
                <div className="fi-sizes">
                  <span className="size-orig">{fmtBytes(f.size)}</span>
                  {isDone ? (
                    <>
                      <span className="size-arrow">→</span>
                      <span className={`size-new ${r.newSize < f.size ? 'green' : 'red'}`}>
                        {fmtBytes(r.newSize)}
                      </span>
                      <span className={`size-pct ${r.newSize < f.size ? 'green' : 'red'}`}>
                        ({r.newSize < f.size ? '-' : '+'}{Math.abs(Math.round((1 - r.newSize / f.size) * 100))}%)
                      </span>
                    </>
                  ) : isProcessing ? (
                    <span className="size-loading">压缩中...</span>
                  ) : null}
                </div>
              </div>
              <div className="fi-actions">
                {isDone && (
                  <>
                    <button className="fi-btn compare" onClick={() => onCompare(i)} title="对比">🔍</button>
                    <button className="fi-btn dl" onClick={() => onDownload(r)} title="下载">⬇</button>
                  </>
                )}
                {!compressing && !isDone && (
                  <button className="fi-btn rm" onClick={() => onRemove(i)} title="移除">✕</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
