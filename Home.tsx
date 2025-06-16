import { Content, GoogleGenAI, Modality } from '@google/genai';
import { 
  LoaderCircle, 
  SendHorizontal, 
  Trash2, 
  X, 
  Sparkles, 
  Download,
  Brush
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, MouseEvent, TouchEvent, FormEvent } from 'react';

// Tip tanımlamaları
interface Coordinates {
  x: number;
  y: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  imageData: string | null;
  error?: string;
}

// Sabitler
const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 450,
  LINE_WIDTH: 3,
  BACKGROUND_COLOR: '#FFFFFF',
} as const;

const COLORS = [
  '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', 
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471'
] as const;

const BRUSH_SIZES = [1, 3, 5, 8, 12, 16] as const;

// Yardımcı fonksiyonlar
const parseError = (error: string): string => {
  const regex = /{"error":(.*)}/gm;
  const match = regex.exec(error);
  
  try {
    if (match?.[1]) {
      const errorObj = JSON.parse(match[1]);
      return errorObj.message || error;
    }
    return error;
  } catch {
    return error;
  }
};

const createWhiteBackgroundCanvas = (sourceCanvas: HTMLCanvasElement): string => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sourceCanvas.width;
  tempCanvas.height = sourceCanvas.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) throw new Error('Canvas context oluşturulamadı');
  
  tempCtx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  tempCtx.drawImage(sourceCanvas, 0, 0);
  
  return tempCanvas.toDataURL('image/png').split(',')[1];
};

export default function Home() {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);
  
  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // AI instance
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // Canvas başlatma
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Arka plan resmini canvas'a çizme
  const drawImageToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const backgroundImage = backgroundImageRef.current;
    
    if (!canvas || !backgroundImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  }, []);

  // Koordinat hesaplama
  const getCoordinates = useCallback((e: MouseEvent | TouchEvent): Coordinates => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e.nativeEvent && e.nativeEvent.touches.length > 0) {
      clientX = e.nativeEvent.touches[0].clientX - rect.left;
      clientY = e.nativeEvent.touches[0].clientY - rect.top;
    } else if ('offsetX' in e.nativeEvent) {
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    } else {
      return { x: 0, y: 0 };
    }

    return {
      x: clientX * scaleX,
      y: clientY * scaleY,
    };
  }, []);

  // Çizim başlatma
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    if (e.type === 'touchstart') {
      e.preventDefault();
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getCoordinates]);

  // Çizim
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return;

    if (e.type === 'touchmove') {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, getCoordinates, penColor, brushSize]);

  // Çizim durdurma
  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  // Canvas temizleme
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = CANVAS_CONFIG.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setGeneratedImage(null);
    backgroundImageRef.current = null;
  }, []);

  // Canvas indirme
  const downloadCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `ai-cizim-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  // Fırça boyutu değiştirme
  const handleBrushSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushSize(parseInt(e.target.value));
  }, []);

  // Form gönderme
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas || !prompt.trim()) return;

    setIsLoading(true);

    try {
      const drawingData = createWhiteBackgroundCanvas(canvas);

      const contents: Content[] = drawingData ? [
        {
          role: 'USER',
          parts: [{ inlineData: { data: drawingData, mimeType: 'image/png' } }],
        },
        {
          role: 'USER',
          parts: [{ text: `${prompt}. Aynı minimal çizgi tarzını koru ve yaratıcı ol.` }],
        },
      ] : [
        {
          role: 'USER',
          parts: [{ text: prompt }],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      });

      const data: ApiResponse = {
        success: true,
        message: '',
        imageData: null,
      };

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.text) {
            data.message = part.text;
          } else if (part.inlineData) {
            data.imageData = part.inlineData.data || null;
          }
        }
      }

      if (data.success && data.imageData) {
        const imageUrl = `data:image/png;base64,${data.imageData}`;
        setGeneratedImage(imageUrl);
      } else {
        throw new Error('Görsel oluşturulamadı');
      }
    } catch (error) {
      console.error('Çizim gönderme hatası:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, ai]);

  // Efektler
  useEffect(() => {
    if (generatedImage && canvasRef.current) {
      const img = new Image();
      img.onload = () => {
        backgroundImageRef.current = img;
        drawImageToCanvas();
      };
      img.src = generatedImage;
    }
  }, [generatedImage, drawImageToCanvas]);

  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  useEffect(() => {
    const preventTouchDefault = (e: Event) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', preventTouchDefault, { passive: false });
      canvas.addEventListener('touchmove', preventTouchDefault, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', preventTouchDefault);
        canvas.removeEventListener('touchmove', preventTouchDefault);
      }
    };
  }, [isDrawing]);

  // Click outside handler for color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.color-picker')) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('click', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside as any);
    };
  }, [showColorPicker]);

  return (
    <div>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <Sparkles size={20} />
              </div>
              <h1 className="logo-text">AI Çizim Stüdyosu</h1>
            </div>
            
            <div className="header-actions">
              <button onClick={downloadCanvas} className="btn btn-icon" title="İndir">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Tools Panel */}
          <div className="tools-panel">
            <div className="tools-grid">
              
              {/* Color Picker */}
              <div className="tool-group">
                <span className="tool-label">Renk</span>
                <div className="color-picker">
                  <button
                    className="color-button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    style={{ backgroundColor: penColor }}
                    title="Renk seç"
                  />
                  
                  {showColorPicker && (
                    <div className="color-palette">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          className={`color-swatch ${penColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setPenColor(color);
                            setShowColorPicker(false);
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Brush Size */}
              <div className="tool-group">
                <span className="tool-label">Fırça</span>
                <div className="slider-container">
                  <Brush size={16} />
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={handleBrushSizeChange}
                    className="slider"
                  />
                  <span className="brush-size-display">{brushSize}</span>
                </div>
              </div>

              {/* Clear Button */}
              <button onClick={clearCanvas} className="btn btn-secondary">
                <Trash2 size={16} />
                Temizle
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="canvas-section">
            <div className="canvas-container">
              <canvas
                ref={canvasRef}
                width={CANVAS_CONFIG.WIDTH}
                height={CANVAS_CONFIG.HEIGHT}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="canvas"
              />
            </div>
          </div>

          {/* AI Prompt Section */}
          <div className="prompt-section">
            <div className="prompt-header">
              <h2 className="prompt-title">AI ile Çiziminizi Geliştirin</h2>
              <p className="prompt-subtitle">
                Çiziminizi nasıl dönüştürmek istediğinizi açıklayın
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="prompt-form">
              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Örnek: 'Bir ejder ekle ve ateş nefesi versin', 'Gökkuşağı renklerinde yap', 'Fantastik bir orman manzarası oluştur'..."
                  className="textarea"
                  maxLength={500}
                  required
                />
                <div className="char-count">{prompt.length}/500</div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="btn btn-primary submit-button"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle size={18} className="spinner" />
                    AI Çalışıyor...
                  </>
                ) : (
                  <>
                    <SendHorizontal size={18} />
                    Oluştur
                  </>
                )}
              </button>

              {/* Loading State */}
              {isLoading && (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <div>
                    <div className="loading-text">AI çiziminizi işliyor...</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Bu birkaç saniye sürebilir
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Bir Sorun Oluştu</h3>
              <button
                onClick={() => setShowErrorModal(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {parseError(errorMessage)}
            </div>
            <button
              onClick={() => setShowErrorModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
