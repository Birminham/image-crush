import React, { useState, useRef, useCallback } from 'react';
import UploadZone from './components/UploadZone';
import ControlPanel from './components/ControlPanel';
import FileList from './components/FileList';
import CompareModal from './components/CompareModal';
import { compressAll, supportedFormats } from './utils/compress';
import JSZip from 'jszip';

const SUPPORTED = supportedFormats();

export default function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(80);
  const [scale, setScale] = useState(100);
  const [maxWidth, setMaxWidth] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [compareIdx, setCompareIdx] = useState(-1);

  const handleFiles = useCallback((newFiles) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...imageFiles]);
    setResults([]);
  }, []);

  const handleRemove = useCallback((idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
    setResults(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleClear = () => { setFiles([]); setResults([]); setProgress({ done: 0, total: 0 }); };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setCompressing(true);
    setProgress({ done: 0, total: files.length });
    const opts = { format, quality, scale, maxWidth };
    try {
      const res = await compressAll(files, opts, (done, total) => {
        setProgress({ done, total });
      });
      setResults(res);
    } catch (err) {
      alert('压缩失败: ' + err.message);
    }
    setCompressing(false);
  };

  const handleDownloadOne = (r) => {
    const a = document.createElement('a');
    a.href = r.newUrl;
    a.download = r.name;
    a.click();
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach(r => {
      const blob = r.blob || dataURLtoBlob(r.newUrl);
      zip.file(r.name, blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = 'crushed-images.zip';
    a.click();
  };

  const totalOrig = files.reduce((s, f) => s + f.size, 0);
  const totalNew = results.reduce((s, r) => s + r.newSize, 0);
  const totalSaved = totalOrig - totalNew;

  return (
    <div className="app">
      <header className="topbar">
        <h1>🗜️ 图片压缩器 <span className="sub">Image Crush</span></h1>
        <div className="topbar-right">
          <span className="version">v1.0</span>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <UploadZone onFiles={handleFiles} disabled={compressing} />
          <ControlPanel
            format={format} onFormatChange={setFormat}
            quality={quality} onQualityChange={setQuality}
            scale={scale} onScaleChange={setScale}
            maxWidth={maxWidth} onMaxWidthChange={setMaxWidth}
            disabled={compressing}
            supported={SUPPORTED}
          />
          {files.length > 0 && (
            <button
              className="btn-compress"
              onClick={handleCompress}
              disabled={compressing || files.length === 0}
            >
              {compressing
                ? `压缩中... ${progress.done}/${progress.total}`
                : `🚀 压缩 ${files.length} 张图片`
              }
            </button>
          )}
          {results.length > 0 && (
            <>
              <div className="stats-box">
                <div className="stat-row">
                  <span>原始大小</span><span className="stat-v">{fmtBytes(totalOrig)}</span>
                </div>
                <div className="stat-row">
                  <span>压缩后</span><span className="stat-v green">{fmtBytes(totalNew)}</span>
                </div>
                <div className="stat-row bold">
                  <span>节省</span><span className="stat-v green">{fmtBytes(totalSaved)} ({totalOrig ? Math.round(totalSaved/totalOrig*100) : 0}%)</span>
                </div>
              </div>
              <button className="btn-download-all" onClick={handleDownloadAll}>
                📦 打包下载 ZIP ({results.length}张)
              </button>
            </>
          )}
        </aside>

        <main className="main">
          {files.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🖼️</div>
              <h2>拖拽或点击上传图片</h2>
              <p>支持 PNG / JPEG / WebP / AVIF / BMP</p>
              <p className="hint">支持批量上传 · 所有处理在浏览器完成 · 不传输到服务器</p>
            </div>
          ) : (
            <FileList
              files={files}
              results={results}
              compressing={compressing}
              progress={progress}
              onRemove={handleRemove}
              onCompare={(i) => setCompareIdx(i)}
              onDownload={handleDownloadOne}
              onClear={handleClear}
            />
          )}
        </main>
      </div>

      {compareIdx >= 0 && results[compareIdx] && (
        <CompareModal
          result={results[compareIdx]}
          onClose={() => setCompareIdx(-1)}
        />
      )}
    </div>
  );
}

function dataURLtoBlob(url) {
  const [head, data] = url.split(',');
  const mime = head.match(/:(.*?);/)[1];
  const bin = atob(data);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], { type: mime });
}

function fmtBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
}
