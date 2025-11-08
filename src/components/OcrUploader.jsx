import React, { useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState.js';
import { getMessages } from '../utils/i18n.js';

const defaultParams = {
  taskType: 'default',
  maxTokens: 16000,
  temperature: 0.1,
  topP: 0.6,
  repetitionPenalty: 1.2,
  pages: [null],
};

async function callTyphoonOCR({ file, apiKey }) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task_type', defaultParams.taskType);
  formData.append('max_tokens', defaultParams.maxTokens.toString());
  formData.append('temperature', defaultParams.temperature.toString());
  formData.append('top_p', defaultParams.topP.toString());
  formData.append('repetition_penalty', defaultParams.repetitionPenalty.toString());
  formData.append('pages', JSON.stringify(defaultParams.pages));

  const response = await fetch('https://api.opentyphoon.ai/v1/ocr', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const result = await response.json();
  const extracted = [];
  for (const pageResult of result.results || []) {
    if (pageResult.success && pageResult.message) {
      let content = pageResult.message.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        content = parsed.natural_text || content;
      } catch {
        // use original string
      }
      extracted.push({ filename: pageResult.filename || 'page', content, error: false });
    } else {
      extracted.push({
        filename: pageResult.filename || 'page',
        content: pageResult.error || 'Unknown error',
        error: true,
      });
    }
  }
  return extracted;
}

function OcrUploader({ title, helper, onExtract }) {
  const envKey = (import.meta.env.VITE_TYPHOON_API_KEY || '').replace(/['"]/g, '').trim();
  const [apiKey, setApiKey] = usePersistentState('ktb.ocr.apiKey', envKey);
  const [settings] = usePersistentState('ktb.settings', {});
  const t = getMessages(settings.language);
  const effectiveKey = envKey || apiKey;
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('กรุณาเลือกไฟล์');
      return;
    }
    if (!effectiveKey.trim()) {
      setError('กรุณาระบุ Typhoon API Key');
      return;
    }
    setError('');
    setIsLoading(true);
    setResults([]);
    try {
      const extracted = await callTyphoonOCR({ file, apiKey: effectiveKey });
      setResults(extracted);
      const successItems = extracted.filter((item) => !item.error);
      if (successItems.length && onExtract) {
        onExtract(successItems);
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดระหว่างการประมวลผล');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ocr-inline card">
      <form className="ocr-inline-form" onSubmit={handleSubmit}>
        <div>
          <h3>{title}</h3>
          {helper && <p>{helper}</p>}
        </div>
        <div className="ocr-inline-inputs">
          <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {!envKey && (
            <input
              type="password"
              placeholder="Typhoon API Key (เก็บไว้ครั้งเดียว)"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
            />
          )}
          <button className="primary small" type="submit" disabled={isLoading}>
            {isLoading ? 'กำลัง OCR...' : t.buttons.scan}
          </button>
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>
      {!!results.length && (
        <div className="ocr-inline-results">
          {results.map((item, index) => (
            <article key={`${item.filename}-${index}`} className={item.error ? 'error' : ''}>
              <header>
                <strong>{item.filename}</strong>
                {!item.error && (
                  <button className="ghost small" type="button" onClick={() => handleCopy(item.content)}>
                    คัดลอก
                  </button>
                )}
              </header>
              <textarea readOnly value={item.content} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default OcrUploader;
