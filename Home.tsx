import { Content, GoogleGenAI, Modality } from '@google/genai';
import {
  LoaderCircle,
  Trash2,
  X,
  Download,
  Brush,
  Palette,
  WandSparkles
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState, MouseEvent, TouchEvent, FormEvent } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Slider } from './components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { cn } from './lib/utils';

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
  WIDTH: 1000,
  HEIGHT: 600,
  LINE_WIDTH: 3,
  BACKGROUND_COLOR: '#FFFFFF',
} as const;

const COLORS = [
  '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471'
] as const;


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
          parts: [{
            text: `Bu çizimin üzerine sadece şunları EKLE (mevcut çizimi değiştirme): ${prompt}.

Kurallar:
- Mevcut çizgilere dokunma, aynen koru.
- Sadece belirtilen yeni öğeleri ekle.
- Çizimin genel yapısını ve tarzını koru.
- Yeni öğeler:
  - Mevcut çizimle aynı çizgi kalınlığında olsun.
  - Mevcut çizimle aynı stil, teknik ve detay seviyesinde olsun.
  - Mevcut çizimle aynı renk paleti, ışık ve gölgede olsun.
  - Mevcut çizimle aynı boyut, konum ve perspektifte olsun.
  - Mevcut kompozisyon, denge ve bütünlük ile uyumlu olsun.
  - Mevcut atmosfer, duygu, tema ve anlatım ile uyumlu olsun.
- Orijinal çizime zarar verme, sadece belirtilen eklentileri yap.`
          }]
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
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <WandSparkles size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">AI Çizim Stüdyosu</h1>
                  <p className="text-sm text-muted-foreground">Yaratıcılığınızı AI ile birleştirin</p>
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={downloadCanvas} variant="outline" size="icon" className="glass-card">
                    <Download size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Çizimi İndir</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row h-screen">
          {/* Sol Panel - Kontroller ve AI (%30) */}
          <div className="w-full lg:w-[30%] bg-gradient-to-br from-slate-50/90 via-blue-50/90 to-indigo-50/90 backdrop-blur-xl border-b lg:border-r lg:border-b-0 border-white/20 flex flex-col max-h-[40vh] lg:max-h-none overflow-y-auto">
            {/* Araçlar Bölümü */}
            <div className="p-6 border-b border-white/20">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold gradient-text mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Çizim Araçları
                  </h3>

                  {/* Renk Seçici */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Renk</span>
                      <div className="relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className={cn(
                                "w-8 h-8 rounded-lg border-2 border-white shadow-lg transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                showColorPicker && "ring-2 ring-primary ring-offset-2"
                              )}
                              onClick={() => setShowColorPicker(!showColorPicker)}
                              style={{ backgroundColor: penColor }}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Renk Paleti</p>
                          </TooltipContent>
                        </Tooltip>

                        {showColorPicker && (
                          <div className="absolute top-10 right-0 z-20 glass-card p-3 rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95">
                            <div className="grid grid-cols-4 gap-2">
                              {COLORS.map((color) => (
                                <Tooltip key={color}>
                                  <TooltipTrigger asChild>
                                    <button
                                      className={cn(
                                        "w-6 h-6 rounded-md border-2 transition-all duration-200 hover:scale-110 focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                        penColor === color
                                          ? "border-primary scale-110 shadow-md"
                                          : "border-white shadow-sm hover:shadow-md"
                                      )}
                                      style={{ backgroundColor: color }}
                                      onClick={() => {
                                        setPenColor(color);
                                        setShowColorPicker(false);
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{color}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fırça Boyutu */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Brush className="w-4 h-4" />
                          Fırça
                        </span>
                        <span className="text-sm font-medium">{brushSize}px</span>
                      </div>
                      <Slider
                        value={[brushSize]}
                        onValueChange={(value) => setBrushSize(value[0])}
                        max={20}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Temizle Butonu */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={clearCanvas} variant="outline" size="sm" className="w-full gap-2">
                          <Trash2 size={14} />
                          Tümünü Temizle
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tüm çizimi temizle</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Prompt Bölümü */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="space-y-4 flex-1 flex flex-col">
                <div>
                  <h3 className="text-lg font-semibold gradient-text mb-2 flex items-center gap-2">
                    <WandSparkles className="w-5 h-5" />
                    AI Büyüsü
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Çiziminizi nasıl dönüştürmek istediğinizi açıklayın
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4">
                  <div className="flex-1 flex flex-col space-y-2">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Çiziminize eklemek istediğiniz şeyleri yazın:
• 'Sarı yapraklar ve 3 arı ekle'
• 'Arka plana mavi gökyüzü ekle' 
• 'Yanına bir kedi çiz'
• 'Etrafına çiçekler ekle'

NOT: Mevcut çiziminiz korunur, sadece yeni öğeler eklenir!"
                      className="flex-1 min-h-[120px] p-3 rounded-lg border border-input bg-white/50 backdrop-blur-sm text-sm resize-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none transition-all duration-200 placeholder:text-muted-foreground"
                      maxLength={500}
                      required
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Detaylı açıklamalar daha iyi sonuçlar verir</span>
                      <span className={cn(
                        "font-medium",
                        prompt.length > 450 && "text-orange-500",
                        prompt.length > 480 && "text-red-500"
                      )}>
                        {prompt.length}/500
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="w-full gap-2 font-semibold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" />
                        AI Çalışıyor...
                      </>
                    ) : (
                      <>
                        <WandSparkles size={18} />
                        Büyülü Dönüşüm
                      </>
                    )}
                  </Button>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="glass-card p-3 rounded-lg border border-blue-200/50 bg-blue-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-blue-700">AI büyüsü çalışıyor...</div>
                          <div className="text-xs text-blue-600">Birkaç saniye sürebilir ✨</div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Sağ Panel - Çizim Alanı (%70) */}
          <div className="flex-1 lg:w-[70%] flex flex-col bg-white">
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="relative max-w-full max-h-full">
                <div className="gradient-border">
                  <div className="bg-white rounded-lg p-4 flex justify-center items-center">
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
                      className="max-w-full max-h-full cursor-crosshair rounded-lg shadow-inner"
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in-0">
            <Card className="max-w-md w-full animate-in zoom-in-95 duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <X className="w-5 h-5" />
                    Bir Sorun Oluştu
                  </CardTitle>
                  <Button
                    onClick={() => setShowErrorModal(false)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {parseError(errorMessage)}
                </p>
                <Button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full"
                >
                  Tamam
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
