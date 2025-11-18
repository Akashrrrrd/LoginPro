# LogicLens Pro 🔍

**Camera-Based Matrix Reasoning Puzzle Solver**

An AI-powered visual logic solver that uses computer vision to analyze and solve matrix reasoning puzzles (3x3, 4x4, and 5x5 grids).

## 🚀 Features

- **Camera-Only Scanning**: Real-time camera capture for puzzle analysis
- **Multi-Grid Support**: Handles 3x3, 4x4, and 5x5 matrix puzzles
- **Smart Detection**: Automatic grid size detection
- **Multiple Solving Strategies**:
  - Symmetry Rule (3x3, 5x5)
  - Sudoku Rule (4x4)
  - Series/Progression Rule (3x3, 4x4)
  - Inventory Rule (4x4, 5x5)
- **AR Overlay**: Visual solution overlay on captured images
- **Real-time Processing**: Step-by-step analysis logging

## 📱 Mobile Camera Requirements

### ⚠️ IMPORTANT: HTTPS Required

**Camera access on mobile devices requires HTTPS.** If the camera doesn't work:

1. **Local Development**: Use `localhost` (automatically HTTPS)
2. **Deployment**: Deploy to a platform with HTTPS:
   - ✅ Vercel (automatic HTTPS)
   - ✅ Netlify (automatic HTTPS)
   - ✅ GitHub Pages (with custom domain)
   - ❌ HTTP-only hosting won't work

### Browser Permissions

When you click "SCAN PUZZLE", your browser will ask for camera permission. You must:
- Click "Allow" when prompted
- If blocked, go to browser settings → Site permissions → Camera → Allow

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: React 19 + Tailwind CSS v4
- **Components**: Shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Analytics**: Vercel Analytics

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Akashrrrrd/LoginPro.git
cd LoginPro

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Akashrrrrd/LoginPro)

Or manually:

```bash
npm run build
npm start
```

### Environment Requirements

- Node.js 18+ 
- Modern browser with camera support
- HTTPS connection (for camera access)

## 📖 How to Use

1. **Open the app** on your mobile device or desktop with a camera
2. **Click "SCAN PUZZLE"** button
3. **Allow camera permissions** when prompted
4. **Position your camera** over a printed or digital puzzle matrix
5. **Align the grid** within the frame overlay
6. **Click "CAPTURE"** to analyze
7. **View the solution** with AR overlay and confidence score

## 🎯 Supported Puzzles

- ✅ System-generated matrix puzzles (printed or digital)
- ✅ Clear grid lines and distinct shapes
- ✅ Good lighting conditions
- ❌ Hand-drawn puzzles (not supported)
- ❌ Blurry or low-quality images

## 🧠 Computer Vision Pipeline

1. **Grid Detection**: Identifies puzzle boundaries and size
2. **Cell Extraction**: Isolates individual cells
3. **Symbol Recognition**: Classifies shapes, colors, counts
4. **Logic Solving**: Applies multiple solving strategies
5. **AR Rendering**: Overlays solution on original image

## 🔧 Project Structure

```
LoginPro/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── camera-capture.tsx    # Camera interface
│   ├── grid-analyzer.tsx     # Analysis orchestrator
│   ├── ar-overlay.tsx        # Solution overlay
│   ├── processing-log.tsx    # Step-by-step log
│   └── stats-panel.tsx       # Statistics display
├── lib/
│   ├── vision-engine.ts      # Main CV pipeline
│   ├── grid-detection.ts     # Grid detection algorithms
│   ├── symbol-recognition.ts # Shape/color recognition
│   ├── logic-solver.ts       # Puzzle solving logic
│   └── ar-renderer.tsx       # AR overlay rendering
└── components/ui/            # Shadcn UI components
```

## ⚙️ Configuration

### Camera Settings

Edit `components/camera-capture.tsx` to adjust camera quality:

```typescript
video: { 
  facingMode: 'environment',  // Use back camera
  width: { ideal: 1920 },     // Preferred width
  height: { ideal: 1080 }     // Preferred height
}
```

### Solving Strategies

Edit `lib/logic-solver.ts` to modify or add solving rules.

## 🐛 Troubleshooting

### Camera Not Working on Mobile

**Problem**: "Nothing happens" when clicking SCAN PUZZLE

**Solutions**:
1. ✅ Ensure you're using **HTTPS** (not HTTP)
2. ✅ Check browser permissions: Settings → Site Settings → Camera
3. ✅ Try a different browser (Chrome/Safari recommended)
4. ✅ Close other apps using the camera
5. ✅ Restart your browser

### Low Accuracy

**Problem**: Wrong answers or low confidence

**Solutions**:
- Use better lighting
- Ensure grid lines are clear and straight
- Hold camera steady when capturing
- Use system-generated puzzles (not hand-drawn)

## 📄 License

MIT License - feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.

## 👨‍💻 Author

Created by [Akashrrrrd](https://github.com/Akashrrrrd)

---

**Note**: This is a proof-of-concept demonstrating computer vision and logic solving techniques. For production use, consider implementing more sophisticated ML models for better accuracy.
