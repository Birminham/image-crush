import React from 'react';

const FORMAT_LABELS = {
  jpeg: { name: 'JPEG', ext: '.jpg', desc: '通用兼容，体积小' },
  png: { name: 'PNG', ext: '.png', desc: '无损压缩，保持透明' },
  webp: { name: 'WebP', ext: '.webp', desc: '新一代格式，体积最小' },
  avif: { name: 'AVIF', ext: '.avif', desc: '最先进格式，最高压缩比' },
};

export default function ControlPanel({
  format, onFormatChange, quality, onQualityChange,
  scale, onScaleChange, maxWidth, onMaxWidthChange,
  disabled, supported,
}) {
  return (
    <div className="control-panel">
      <h3>⚙️ 压缩设置</h3>

      <div className="ctrl-group">
        <label>输出格式</label>
        <div className="format-grid">
          {Object.entries(FORMAT_LABELS).map(([k, v]) => (
            <button
              key={k}
              className={`fmt-btn ${format === k ? 'active' : ''} ${!supported.includes(k) ? 'unsupported' : ''}`}
              onClick={() => onFormatChange(k)}
              disabled={disabled || !supported.includes(k)}
            >
              <span className="fmt-name">{v.name}</span>
              <span className="fmt-ext">{v.ext}</span>
              {!supported.includes(k) && <span className="fmt-unsup">不支持</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl-group">
        <label>画质 {quality}%</label>
        <input type="range" min={10} max={100} value={quality}
          onChange={e => onQualityChange(+e.target.value)} disabled={disabled} />
        <div className="range-labels"><span>10%·更小</span><span>100%·更高</span></div>
      </div>

      <div className="ctrl-group">
        <label>缩放 {scale}%</label>
        <input type="range" min={10} max={100} value={scale}
          onChange={e => onScaleChange(+e.target.value)} disabled={disabled} />
      </div>

      <div className="ctrl-group">
        <label>最大宽度 (px) <span className="ctrl-hint">0=不限制</span></label>
        <input type="number" min={0} max={8000} step={100} value={maxWidth}
          onChange={e => onMaxWidthChange(+e.target.value)} disabled={disabled}
          className="num-input" />
      </div>
    </div>
  );
}
