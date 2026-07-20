import React, { useRef, useState } from 'react';
import { fmtBytes } from '../utils/compress';

export default function CompareModal({ result, onClose }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef();

  const handleMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    setSliderPos(Math.max(0, Math.min(100, (x / rect.width) * 100)));
  };

  const handleMouseDown = () => {
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔍 前后对比 — {result.name}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="compare-sizes">
          <span className="cs-orig">原始: {fmtBytes(result.origSize)}</span>
          <span className="cs-arrow">→</span>
          <span className={`cs-new ${result.newSize < result.origSize ? 'green' : 'red'}`}>
            压缩后: {fmtBytes(result.newSize)}
            ({result.newSize < result.origSize ? '-' : '+'}{Math.abs(Math.round((1 - result.newSize / result.origSize) * 100))}%)
          </span>
          <span className="cs-dims">{result.width}×{result.height}</span>
        </div>

        <div
          ref={containerRef}
          className="compare-container"
          onMouseMove={handleMove}
          onTouchMove={handleMove}
        >
          <img src={result.newUrl} alt="压缩后" className="compare-img" />
          <div className="compare-overlay" style={{ width: `${100 - sliderPos}%` }}>
            <img src={result.origUrl} alt="原始" className="compare-img-overlay" />
          </div>
          <div className="compare-slider-line" style={{ left: `${sliderPos}%` }} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
            <div className="compare-slider-handle">⟷</div>
          </div>
          <div className="compare-label left">压缩后</div>
          <div className="compare-label right">原始</div>
        </div>

        <div className="modal-footer">
          <span className="quality-badge">画质差异几乎不可见</span>
          <button className="btn-compress" onClick={onClose}>关闭</button>
        </div>
      </div>
    </div>
  );
}
