import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, AlertTriangle, CheckCircle, Shield, X, Loader2, Info } from 'lucide-react';
import gsap from 'gsap';

const App = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'text'
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    gsap.from('.header > *', {
      y: 30,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
      ease: 'power3.out'
    });
    gsap.from('.glass-card', {
      scale: 0.9,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: 'back.out(1.7)'
    });
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      gsap.from(resultRef.current.children, {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }, [result]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    if (activeTab === 'upload') {
      if (!file) {
        setError('Please select a file to upload.');
        setLoading(false);
        return;
      }
      formData.append('file', file);
    } else {
      if (!text.trim()) {
        setError('Please enter some text to analyze.');
        setLoading(false);
        return;
      }
      formData.append('text', text);
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Please try again.');
      }

      const data = await response.json();
      setResult(data[0]?.json || data); // Handle both wrapped and unwrapped response
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'Fake': return <AlertTriangle className="text-danger" size={32} />;
      case 'Suspicious': return <Info className="text-warning" size={32} />;
      case 'Genuine': return <CheckCircle className="text-success" size={32} />;
      default: return <Shield size={32} />;
    }
  };

  return (
    <div className="app-container" ref={containerRef}>
      {/* Premium Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <header className="header">
        <h1 className="logo">DeceptiScan</h1>
        <p className="subtitle">AI-Powered Fraud Detection for Jobs & Offers</p>
      </header>

      <main className="glass-card">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Document
          </button>
          <button 
            className={`tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            Paste Text
          </button>
        </div>

        {activeTab === 'upload' ? (
          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('fileInput').click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              hidden 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <Upload className="upload-icon" />
            <h3 className="text-xl font-bold">{file ? file.name : 'Drop your file here'}</h3>
            <p className="subtitle text-sm">PDF, Word, or Text files up to 10MB</p>
            {file && (
              <button 
                className="mt-2 text-sm text-secondary flex items-center gap-1 mx-auto"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>
        ) : (
          <textarea
            className="text-input"
            placeholder="Paste the job description, email body, or offer letter text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        <button 
          className="btn" 
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} /> Analyzing...
            </span>
          ) : 'Scan for Fraud'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-danger text-sm flex gap-3 items-center">
            <AlertTriangle size={20} /> {error}
          </div>
        )}
      </main>

      {result && (
        <section className="results-section" ref={resultRef}>
          {/* Main Verdict Card */}
          <div className={`verdict-card verdict-${result.final_verdict || result.verdict}`}>
            {getVerdictIcon(result.final_verdict || result.verdict)}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold font-heading">Security Report</h2>
                <span className={`verdict-badge badge-${result.final_verdict || result.verdict}`}>
                  {result.final_verdict || result.verdict}
                </span>
              </div>
              <p className="opacity-90 text-lg">
                Overall Confidence Index: <span className="font-bold">{result.heuristic_confidence_percent || result.hybrid_confidence || result.deception_score * 10 || 0}%</span>
              </p>
            </div>
          </div>

          {/* Analysis Layers Grid */}
          <div className="report-grid mb-8">
            <div className="report-stat-card">
              <span className="stat-label">ML Model</span>
              <span className="stat-value">{result.ml_verdict || 'N/A'}</span>
              <div className="stat-progress">
                <div className="bar" style={{width: `${(result.ml_probability || 0) * 100}%`}}></div>
              </div>
            </div>
            <div className="report-stat-card">
              <span className="stat-label">Heuristic Engine</span>
              <span className="stat-value">{result.rulebased_verdict || result.verdict || 'N/A'}</span>
              <span className="stat-sub">Score: {result.rulebased_score || result.heuristic_score || 0}/10</span>
            </div>
            <div className="report-stat-card">
              <span className="stat-label">AI Agent</span>
              <span className="stat-value">{result.mistral_verdict || 'Analyzed'}</span>
              <span className="stat-sub">Conf: {(result.mistral_confidence || 0) * 100}%</span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="glass-card mb-8">
            <h3 className="mb-6 text-xl font-bold flex items-center gap-3">
              <Shield className="text-accent-primary" size={24} /> 
              Analytical Breakdown
            </h3>
            
            <div className="reasoning-list">
              {(result.reasoning_summary || result.reasoning || []).map((reason, index) => (
                <div key={index} className="reasoning-item">
                  <div className="item-num">{index + 1}</div>
                  <p>{reason}</p>
                </div>
              ))}
            </div>

            {result.alignment_summary && (
              <div className="mt-8 p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl flex gap-3 items-start">
                <Info size={20} className="text-accent-primary mt-1" />
                <p className="text-sm italic opacity-90">{result.alignment_summary}</p>
              </div>
            )}
          </div>

          {/* Final Intelligence Report */}
          {result.final_report && (
            <div className="glass-card border-accent-primary/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-8 bg-accent-primary rounded-full"></div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-accent-primary">Final Intelligence Assessment</h4>
              </div>
              <p className="text-lg leading-relaxed opacity-95 font-medium italic">
                "{result.final_report}"
              </p>
            </div>
          )}
        </section>
      )}
      
      <footer className="mt-12 text-secondary text-sm opacity-50">
        © 2026 DeceptiScan Advanced Security
      </footer>
    </div>
  );
};

export default App;
