# 🌌 Next Galaxy

A stunning, interactive 3D galaxy visualization built with modern web technologies. This project is a complete modernization of the original [Blueyard Galaxy](https://web.archive.org/web/20240919084727/https://blueyard.com/galaxy) website, enhanced with Next.js, TypeScript, and advanced Three.js features.

## ✨ Features

### 🌟 **Visual Excellence**
- **32,768 procedurally generated particles** forming a realistic spiral galaxy
- **Custom GLSL shaders** with advanced particle effects and depth-of-field
- **Smooth camera animations** with 6 preset viewpoints
- **Real-time particle interactions** with mouse/touch controls
- **Glassmorphism loading screen** with elegant animations

### 🎮 **Interactive Controls**
- **Orbital camera controls** with smooth transitions
- **Real-time GUI controls** for all visual parameters
- **Camera position and target tracking** with live updates
- **Depth-of-field controls** with focus distance and aperture settings
- **Particle animation controls** including wiggle intensity and speed

### ⚡ **Performance & UX**
- **Background loading** for seamless user experience
- **Responsive design** that works on all devices
- **Optimized rendering** with efficient particle systems
- **Modern loading animations** with random 3-10 second duration
- **Clean glassmorphism UI** with intuitive controls

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **3D Graphics**: [Three.js](https://threejs.org) with WebGL shaders
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Styling**: Tailwind CSS with custom CSS
- **Animations**: [GSAP](https://greensock.com/gsap) for smooth transitions
- **Development**: [lil-gui](https://lil-gui.georgealways.com) for live controls
- **Build Tool**: Turbopack for fast development

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Logrui/next-galaxy.git
   cd next-galaxy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🎯 Key Components

### **GalaxyCanvas** (`app/galaxy/GalaxyCanvas.tsx`)
The main Three.js scene component featuring:
- 32,768 particle galaxy with realistic physics
- Custom vertex and fragment shaders
- Interactive mouse controls with raycasting
- Real-time GUI parameter controls

### **Camera System** (`app/galaxy/camera_animator.ts`)
Advanced camera animation system with:
- Smooth transitions between 6 preset viewpoints
- GSAP-powered animations with multiple easing options
- Real-time camera position and target tracking
- Orbital movement capabilities

### **Loading Screen** (`app/components/LoadingScreen.tsx`)
Elegant glassmorphism loading experience:
- Random 3-10 second loading duration
- Animated starfield background
- Smooth fade transitions
- Background galaxy loading for instant interaction

### **Location Presets** (`app/galaxy/location_presets.ts`)
Six carefully crafted camera viewpoints:
- **Overview**: Default elevated view
- **Top Down**: Bird's eye perspective
- **Side View**: Profile angle
- **Close Up**: Immersive interior view
- **Distant**: Panoramic galaxy view
- **Angled**: Dramatic corner perspective

## 🎮 Controls & Features

### **Camera Controls**
- **Mouse Drag**: Orbit around the galaxy
- **Mouse Wheel**: Zoom in/out
- **GUI Sliders**: Precise camera positioning
- **Preset Buttons**: Jump to predefined viewpoints

### **Visual Controls**
- **Progress**: Galaxy formation animation
- **fdAlpha**: Depth-of-field intensity
- **Nebula Amp**: Particle wiggle intensity
- **Super Scale**: Particle size multiplier
- **Focal Distance**: Focus point for depth-of-field
- **Aperture**: Blur intensity (0-10,000)

### **Real-time Information**
- **Camera Position**: Live X, Y, Z coordinates
- **Camera Target**: Where the camera is looking
- **Performance**: Smooth 60fps rendering

## 🌐 Deployment

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

### **Netlify**
```bash
npm run build
# Upload the .next folder to Netlify
```

### **GitHub Pages**
```bash
npm run build
npm run export
# Upload the out folder to GitHub Pages
```

## 📁 Project Structure

```
next-galaxy/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   │   └── LoadingScreen.tsx
│   ├── galaxy/            # Galaxy-specific components
│   │   ├── GalaxyCanvas.tsx
│   │   ├── camera_animator.ts
│   │   ├── location_presets.ts
│   │   └── shaders.ts
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── public/                # Static assets
│   ├── textures/          # Galaxy textures
│   └── models/            # 3D models
├── types/                 # TypeScript definitions
└── package.json           # Dependencies
```

## 🎨 Customization

### **Adding New Camera Presets**
Edit `app/galaxy/location_presets.ts`:
```typescript
{
  name: "Your View",
  position: { x: 100, y: 200, z: 300 },
  target: { x: 0, y: 0, z: 0 },
  description: "Your custom viewpoint"
}
```

### **Modifying Particle Behavior**
Edit the shaders in `app/galaxy/shaders.ts` to customize:
- Particle movement patterns
- Color schemes
- Animation timing
- Interaction effects

### **Styling the UI**
Modify `app/globals.css` to customize:
- Loading screen appearance
- GUI styling
- Overall theme

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m "Add feature"`
5. Push to your branch: `git push origin feature-name`
6. Create a Pull Request

## 📄 License

This project is inspired by the original Blueyard Galaxy and is provided as an educational example of modern web development techniques.

## 🙏 Acknowledgments

- **Original Blueyard Galaxy** for the inspiration and particle system foundation
- **Three.js Community** for the excellent 3D graphics library
- **Next.js Team** for the amazing React framework
- **GSAP** for smooth animation capabilities

---

**Made with ❤️ for the cosmic web experience**
