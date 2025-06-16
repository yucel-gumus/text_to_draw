# 🎨 AI Çizim Stüdyosu

Modern, minimalist ve kullanıcı dostu AI destekli çizim uygulaması. Google Gemini AI ile çizimlerinizi geliştirin ve yaratıcılığınızı keşfedin.

## ✨ Özellikler

- 🖌️ **Sezgisel Çizim Arayüzü**: Hem fare hem de dokunmatik ekran desteği
- 🎨 **Akıllı Renk Paleti**: 12 önceden seçilmiş renk ve kolay renk değiştirme
- 📏 **Ayarlanabilir Fırça**: 1-20 piksel arası fırça boyutu kontrolü
- 🤖 **AI Destekli Geliştirme**: Google Gemini AI ile çizimlerinizi otomatik geliştirin
- 📱 **Tam Responsive**: Tüm cihazlarda mükemmel çalışır
- ⚡ **Hızlı ve Optimize**: Modern React 19 ve TypeScript ile geliştirildi
- 🎯 **Minimalist Tasarım**: Temiz, odaklanmış ve dikkat dağıtmayan arayüz
- 💾 **Kolay İndirme**: Çizimlerinizi tek tıkla PNG formatında indirin

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** (v18 veya üzeri)
- **npm** veya **yarn**
- **Google Gemini API Anahtarı**

### Kurulum

1. **Projeyi klonlayın:**
   ```bash
   git clone https://github.com/your-username/gemini-co-drawing.git
   cd gemini-co-drawing
   ```

2. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre değişkenlerini ayarlayın:**
   
   Proje kök dizininde `.env.local` dosyası oluşturun:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Uygulamayı başlatın:**
   ```bash
   npm run dev
   ```

5. **Tarayıcınızda açın:**
   
   http://localhost:5173 adresine gidin

## 🎯 Nasıl Kullanılır

### Temel Çizim
1. **Renk Seçin**: Üst panelden istediğiniz rengi seçin
2. **Fırça Boyutunu Ayarlayın**: Kaydırıcı ile fırça boyutunu belirleyin
3. **Çizim Yapın**: Canvas üzerinde fare veya parmağınızla çizin
4. **Temizle**: İhtiyaç halinde "Temizle" butonuyla baştan başlayın

### AI ile Geliştirme
1. **Çiziminizi Yapın**: Önce temel çiziminizi oluşturun
2. **Prompt Yazın**: Alt kısımdaki metin kutusuna ne istediğinizi yazın
   - ✅ **İyi örnekler**: 
     - "Bir kedi ekle ve sevimli yap"
     - "Gökkuşağı renklerinde boyama yap"
     - "Fantastik bir orman manzarası oluştur"
     - "Çizimi daha detaylı ve renkli hale getir"
3. **Oluştur**: "Oluştur" butonuna tıklayın ve AI'ın sihirini izleyin
4. **İndir**: Beğendiğiniz sonucu PNG formatında indirin

## 🛠️ Teknoloji Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Vanilla CSS (Minimalist yaklaşım)
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Canvas**: HTML5 Canvas API

## 📁 Proje Yapısı

```
gemini-co-drawing/
├── Home.tsx              # Ana uygulama bileşeni
├── index.tsx             # React uygulaması giriş noktası
├── index.css             # Minimalist CSS stilleri
├── index.html            # HTML template
├── package.json          # Proje bağımlılıkları
├── tsconfig.json         # TypeScript yapılandırması
├── vite.config.ts        # Vite build yapılandırması
└── README.md            # Bu dosya
```

## 🎨 Tasarım Felsefesi

Bu proje **minimalist tasarım** prensiplerini benimser:

- **Temiz Arayüz**: Gereksiz öğeler kaldırıldı, odak çizim deneyiminde
- **Kullanıcı Odaklı**: Her özellik kullanıcı ihtiyacına göre tasarlandı
- **Hızlı Yükleme**: Minimal bağımlılık, maksimum performans
- **Erişilebilirlik**: Tüm kullanıcılar için kolay kullanım

## 🔧 Geliştirme

### Mevcut Komutlar

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Üretim için build al
npm run build

# Build'i önizle
npm run preview

# Tip kontrolü
npm run type-check
```

### Kod Standartları

- **TypeScript**: Tam tip güvenliği
- **Fonksiyonel Bileşenler**: Modern React hooks kullanımı
- **Single Responsibility**: Her fonksiyon tek sorumluluğa sahip
- **Clean Code**: Okunabilir ve sürdürülebilir kod yapısı

## 🚀 Deployment

### Vercel (Önerilen)

1. [Vercel](https://vercel.com) hesabınıza giriş yapın
2. GitHub repository'nizi bağlayın
3. Environment Variables kısmına `GEMINI_API_KEY` ekleyin
4. Deploy edin - otomatik olarak canlıya alınacak

### Netlify

1. `npm run build` ile build alın
2. `dist` klasörünü Netlify'a yükleyin
3. Environment variables ayarlayın

## 🤖 AI Prompt İpuçları

Daha iyi sonuçlar için:

- **Açık olun**: "Kırmızı bir araba çiz" yerine "Parlak kırmızı spor araba çiz"
- **Detay verin**: "Arka planda dağlar olan bir ev çiz"
- **Stil belirtin**: "Çizgi roman tarzında", "Gerçekçi", "Minimalist"
- **Renk belirtin**: "Pastel renklerle", "Canlı renklerle"

## 🆘 Sorun Giderme

### Yaygın Sorunlar

**API Anahtarı Hatası**
- `.env.local` dosyasının doğru konumda olduğundan emin olun
- API anahtarının geçerli olduğunu kontrol edin

**Canvas Çizim Sorunu**
- Tarayıcınızın güncel olduğundan emin olun
- JavaScript'in etkin olduğunu kontrol edin

**Yavaş AI Yanıtı**
- İnternet bağlantınızı kontrol edin
- Gemini API limitlerini kontrol edin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🔮 Gelecek Özellikler

- [ ] Çizim geçmişi ve geri alma
- [ ] Farklı fırça türleri (kalem, marker, suluboya)
- [ ] Katman desteği
- [ ] Çizimi kaydetme/yükleme
- [ ] Çoklu dil desteği
- [ ] Daha fazla AI modeli desteği

---

**⚠️ Not**: Bu uygulama Google Gemini AI API kullanır. API kullanım limitleri ve maliyetleri için [Google AI Studio](https://makersuite.google.com/app/apikey) dokümantasyonunu kontrol edin.

**🎯 Hedef**: Herkesin kolayca kullanabileceği, AI destekli yaratıcı bir çizim deneyimi sunmak.
