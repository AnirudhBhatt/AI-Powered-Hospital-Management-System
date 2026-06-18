'use client';

import { useState, useRef } from 'react';

export default function FileUpload({ onFileSelect, accept = '.pdf,.jpg,.jpeg,.png', maxSize = 10 }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }

  function validateFile(file) {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return false;
    }
    setError('');
    return true;
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    }
  }

  function handleChange(e) {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect?.(file);
      }
    }
  }

  function handleRemove() {
    setSelectedFile(null);
    setError('');
    onFileSelect?.(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function getFileIcon(name) {
    if (!name) return '📄';
    const ext = name.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📕';
    return '📄';
  }

  return (
    <div>
      <div
        className={`file-upload-zone${dragActive ? ' drag-active' : ''}${selectedFile ? ' has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        {selectedFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <span style={{ fontSize: '2rem' }}>{getFileIcon(selectedFile.name)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="truncate">{selectedFile.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
            <button className="btn btn-danger btn-xs" onClick={(e) => { e.stopPropagation(); handleRemove(); }}>✕ Remove</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📁</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>Drop file here or click to browse</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supports: PDF, JPG, PNG • Max {maxSize}MB</div>
          </div>
        )}
      </div>
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
