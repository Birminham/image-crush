import React, { useRef, useCallback } from 'react';

export default function UploadZone({ onFiles, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }, [onFiles, disabled]);

  const handleChange = (e) => {
    if (disabled) return;
    const files = Array.from(e.target.files);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  return (
    <div
      className={`upload-zone ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <div className="upload-icon">📁</div>
      <div className="upload-text">拖拽图片到这里</div>
      <div className="upload-sub">或点击选择文件</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
