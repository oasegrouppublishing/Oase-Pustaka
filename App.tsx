
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  BookCoverForm, 
  GeneratedImage, 
  CoverSize 
} from './types';
import { 
  SIZE_LABELS, 
  STYLE_OPTIONS, 
  GENRE_OPTIONS, 
  TREND_OPTIONS, 
  TEXTURE_OPTIONS, 
  PlusIcon,
  LoadingIcon 
} from './constants';
import { generateBookCover } from './services/geminiService';

/**
 * Komponen untuk mengelola logo yang dapat digeser dan diubah ukurannya
 */
const LogoOverlay = ({ 
  src, 
  initialPos, 
  initialSize,
  containerRef,
  onUpdate 
}: { 
  src: string, 
  initialPos: { x: number, y: number }, 
  initialSize: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
  onUpdate: (pos: { x: number, y: number }, size: number) => void
}) => {
  const [pos, setPos] = useState(initialPos);
  const [size, setSize] = useState(initialSize); // Persentase lebar container
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, startSize: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startRef.current = { 
      x: e.clientX, 
      y: e.clientY, 
      startX: pos.x, 
      startY: pos.y,
      startSize: size
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startRef.current = { 
      x: e.clientX, 
      y: e.clientY, 
      startX: pos.x, 
      startY: pos.y,
      startSize: size
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const dx = ((e.clientX - startRef.current.x) / rect.width) * 100;
        const dy = ((e.clientY - startRef.current.y) / rect.height) * 100;
        
        const newX = Math.max(0, Math.min(100 - size, startRef.current.startX + dx));
        const newY = Math.max(0, Math.min(100, startRef.current.startY + dy));
        
        setPos({ x: newX, y: newY });
      }

      if (isResizing) {
        const dx = ((e.clientX - startRef.current.x) / rect.width) * 100;
        const newSize = Math.max(5, Math.min(50, startRef.current.startSize + dx));
        setSize(newSize);
      }
    };

    const handleMouseUp = () => {
      if (isDragging || isResizing) {
        setIsDragging(false);
        setIsResizing(false);
        onUpdate(pos, size);
      }
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, pos, size, containerRef, onUpdate]);

  return (
    <div 
      className={`absolute cursor-move select-none group/logo border-2 ${isDragging || isResizing ? 'border-indigo-500' : 'border-transparent hover:border-indigo-400/50'}`}
      style={{ 
        left: `${pos.x}%`, 
        top: `${pos.y}%`, 
        width: `${size}%`,
        zIndex: 10
      }}
      onMouseDown={handleMouseDown}
    >
      <img src={src} alt="Logo Overlay" className="w-full h-auto pointer-events-none" />
      
      {/* Resize handle */}
      <div 
        className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full cursor-nwse-resize flex items-center justify-center shadow-lg opacity-0 group-hover/logo:opacity-100 transition-opacity"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-white rotate-45 mb-1 mr-1"></div>
      </div>

      {/* Helper label */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/logo:opacity-100 pointer-events-none whitespace-nowrap">
        Geser & Perbesar Logo
      </div>
    </div>
  );
};

/**
 * Komponen utama untuk menampilkan hasil per gambar
 */
const CoverResult = ({ 
  img, 
  form, 
  onDownload 
}: { 
  img: GeneratedImage, 
  form: BookCoverForm,
  onDownload: (id: string, canvas: HTMLCanvasElement) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [frontLogoState, setFrontLogoState] = useState({ pos: { x: 78, y: 4 }, size: 18 });
  const [backLogoState, setBackLogoState] = useState({ pos: { x: 4, y: 78 }, size: 28 });

  const exportCanvas = async () => {
    if (!containerRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bgImg = new Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = img.url;

    await new Promise((resolve) => { bgImg.onload = resolve; });

    canvas.width = bgImg.width;
    canvas.height = bgImg.height;
    ctx.drawImage(bgImg, 0, 0);

    const drawLogo = async (logoUrl: string, state: { pos: { x: number, y: number }, size: number }) => {
      const lImg = new Image();
      lImg.crossOrigin = "anonymous";
      lImg.src = logoUrl;
      await new Promise((resolve) => { lImg.onload = resolve; });

      const w = canvas.width * (state.size / 100);
      const h = (lImg.height / lImg.width) * w;
      const x = canvas.width * (state.pos.x / 100);
      const y = canvas.height * (state.pos.y / 100);

      ctx.drawImage(lImg, x, y, w, h);
    };

    if (form.size === 'FRONT_COVER' && form.logo) {
      await drawLogo(form.logo, frontLogoState);
    } else if (form.size === 'BACK_COVER' && form.backLogo) {
      await drawLogo(form.backLogo, backLogoState);
    }

    onDownload(img.id, canvas);
  };

  return (
    <div className="group relative bg-white p-4 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all border border-slate-100 overflow-hidden">
      <div 
        ref={containerRef}
        className={`relative overflow-hidden rounded-[2.2rem] bg-slate-50 shadow-inner ${
          form.size === 'SPINE' ? 'aspect-[230/2500]' : 
          form.size === 'CONTENT_LAYOUT' ? 'aspect-[2250/350]' : 'aspect-[2/3]'
        }`}
      >
        <img src={img.url} alt="Cover Background" className="w-full h-full object-cover" />
        
        {form.size === 'FRONT_COVER' && form.logo && (
          <LogoOverlay 
            src={form.logo} 
            initialPos={frontLogoState.pos} 
            initialSize={frontLogoState.size} 
            containerRef={containerRef}
            onUpdate={(pos, size) => setFrontLogoState({ pos, size })}
          />
        )}

        {form.size === 'BACK_COVER' && form.backLogo && (
          <LogoOverlay 
            src={form.backLogo} 
            initialPos={backLogoState.pos} 
            initialSize={backLogoState.size} 
            containerRef={containerRef}
            onUpdate={(pos, size) => setBackLogoState({ pos, size })}
          />
        )}
      </div>
      
      <button 
        onClick={exportCanvas}
        className="absolute top-8 right-8 w-12 h-12 bg-indigo-600 shadow-2xl rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:bg-indigo-700 active:scale-95 z-20"
        title="Download Desain Final"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      <div className="mt-5 px-4 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <span>VARIANT: {img.id.substr(0, 4)}</span>
        <span className="text-indigo-400">Penerbit Oase</span>
      </div>
    </div>
  );
};

export default function App() {
  const [form, setForm] = useState<BookCoverForm>({
    title: '',
    author: '',
    designIdea: '',
    blurb: '',
    size: 'FRONT_COVER',
    style: 'Minimalis',
    genre: 'Literary',
    trend: 'Swiss style',
    texture: 'organic',
    imageCount: 4,
    references: [],
    logo: undefined,
    backLogo: undefined
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backLogoInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setForm(prev => ({
            ...prev,
            references: [...prev.references, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, backLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReference = (index: number) => {
    setForm(prev => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index)
    }));
  };

  const handleDownload = (id: string, canvas: HTMLCanvasElement) => {
    const imageUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `cover-${form.title.replace(/\s+/g, '-').toLowerCase()}-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    setIsGenerating(true);
    setResults([]);
    try {
      const images = await generateBookCover(form);
      setResults(images);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan teknis. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-inner">
              O
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 leading-none">
                Oase <span className="text-indigo-600">Cover AI</span>
              </h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Editor Interaktif</span>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            disabled={isGenerating || !form.title}
            className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-full font-bold transition-all disabled:opacity-50 shadow-lg active:scale-95"
          >
            {isGenerating ? <LoadingIcon /> : <PlusIcon />}
            {isGenerating ? 'Memproses...' : 'Buat Desain'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-md border border-slate-200 space-y-6">
            
            {/* Logo Section Wrapper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Front Logo Upload */}
              <div>
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Logo Cover Depan</label>
                <div className="flex flex-col gap-3">
                  {form.logo ? (
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-indigo-100 bg-indigo-50/10 group">
                      <img src={form.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                      <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, logo: undefined }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                    >
                      <PlusIcon />
                      <span className="text-[10px] font-bold px-2 text-center">Logo Depan</span>
                    </button>
                  )}
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Back Logo Upload */}
              <div>
                <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Logo Cover Belakang</label>
                <div className="flex flex-col gap-3">
                  {form.backLogo ? (
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-indigo-100 bg-indigo-50/10 group">
                      <img src={form.backLogo} alt="Logo Belakang" className="w-full h-full object-contain p-4" />
                      <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, backLogo: undefined }))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => backLogoInputRef.current?.click()}
                      className="w-full aspect-square rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all"
                    >
                      <PlusIcon />
                      <span className="text-[10px] font-bold px-2 text-center">Logo Belakang</span>
                    </button>
                  )}
                  <input type="file" ref={backLogoInputRef} onChange={handleBackLogoChange} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Judul Buku <span className="text-red-500">*</span></label>
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="Masukkan judul buku..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Penulis</label>
                  <input 
                    name="author" 
                    value={form.author} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                    placeholder="Nama penulis..."
                  />
                </div>
              </div>

              {/* Ukuran & Ratio - High Contrast */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Format & Ukuran</label>
                <div className="relative">
                  <select 
                    name="size" 
                    value={form.size} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-400 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-sm cursor-pointer hover:border-indigo-400"
                  >
                    {Object.entries(SIZE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Design Idea & Blurb */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Ide Desain (Konsep Visual)</label>
                <textarea 
                  name="designIdea" 
                  value={form.designIdea} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none shadow-sm"
                  placeholder="Deskripsikan ide visual yang Anda bayangkan..."
                />
              </div>

              {form.size === 'BACK_COVER' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Blurb Buku (Teks Cover Belakang)</label>
                  <textarea 
                    name="blurb" 
                    value={form.blurb} 
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none shadow-sm"
                    placeholder="Tulis sinopsis atau kalimat penggugah..."
                  />
                </div>
              )}

              {/* Design Attributes Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Gaya</label>
                  <select name="style" value={form.style} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-400 bg-white text-slate-900 font-bold text-sm outline-none shadow-sm">
                    {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Jenis</label>
                  <select name="genre" value={form.genre} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-400 bg-white text-slate-900 font-bold text-sm outline-none shadow-sm">
                    {GENRE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Trend</label>
                  <select name="trend" value={form.trend} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-400 bg-white text-slate-900 font-bold text-sm outline-none shadow-sm">
                    {TREND_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tekstur</label>
                  <select name="texture" value={form.texture} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-xl border border-slate-400 bg-white text-slate-900 font-bold text-sm outline-none shadow-sm">
                    {TEXTURE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              {/* Counts & Refs */}
              <div className="pt-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah Varian Gambar: <span className="text-indigo-600">{form.imageCount}</span></label>
                <input 
                  type="range" 
                  name="imageCount" 
                  min="4" 
                  max="8" 
                  value={form.imageCount}
                  onChange={handleInputChange}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Referensi Visual (Opsional)</label>
                <div className="flex flex-wrap gap-2">
                  {form.references.map((ref, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-300 group shadow-sm">
                      <img src={ref} alt="ref" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => removeReference(idx)}
                        className="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all bg-slate-50"
                  >
                    <PlusIcon />
                  </button>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isGenerating || !form.title}
              className="w-full md:hidden flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95"
            >
              {isGenerating ? <LoadingIcon /> : <PlusIcon />}
              {isGenerating ? 'Sedang Memproses...' : 'Buat Desain'}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {results.length === 0 && !isGenerating ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center shadow-inner group">
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Editor Interaktif Oase</h3>
              <p className="text-slate-500 max-sm mx-auto">
                Setelah desain muncul, Anda dapat <strong>menggeser</strong> dan <strong>mengubah ukuran</strong> logo langsung pada gambar sebelum mendownload.
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-slate-900">Editor <span className="text-indigo-600">Output</span></h2>
                <div className="flex items-center gap-2">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100 uppercase tracking-tighter">
                    {results.length} Variasi
                  </span>
                </div>
              </div>

              {isGenerating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Array.from({ length: form.imageCount }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-slate-100 rounded-[2.5rem] animate-pulse border border-slate-200"></div>
                  ))}
                </div>
              )}

              <div className={`grid gap-8 ${
                form.size === 'SPINE' ? 'grid-cols-2 md:grid-cols-4' : 
                form.size === 'CONTENT_LAYOUT' ? 'grid-cols-1' : 'grid-cols-2'
              }`}>
                {results.map((img) => (
                  <CoverResult 
                    key={img.id} 
                    img={img} 
                    form={form} 
                    onDownload={handleDownload} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {isGenerating && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 backdrop-blur-sm text-white px-10 py-6 rounded-full shadow-2xl flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-10">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight">Sedang Menenun Desain...</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em]">Oase Pustaka Intelligence</span>
          </div>
        </div>
      )}
    </div>
  );
}
