# Project Goals: Blueyard Galaxy Portfolio Website Recreation

## Primary Objective

Transform the existing Next Galaxy visualization into a working personal portfolio website that faithfully recreates the original Blueyard Galaxy Website experience while adding modern enhancements. The project serves as both a technical showcase and an interactive portfolio piece demonstrating advanced web development capabilities.

## Core Features to Implement

### 1. **Locations Feature**
**Goal**: Implement a navigation system allowing users to visit predefined locations/sectors within the galaxy using smooth camera movements.

**Current State**: Camera presets already exist in `app/galaxy/location_presets.ts` with 7 predefined viewpoints (Overview, Top Down, Side View, Close Up, Distant, Angled, Big Bang).

**Requirements**:
- Extend existing camera preset system to support location-specific metadata
- Add location identification, descriptions, and visual characteristics
- Implement smooth camera transitions between locations (2-3 seconds duration)
- Create location selection interface (replaces current preset buttons)

### 2. **Location Animations and Control**
**Goal**: Each location should have unique visual effects, animations, and camera behaviors that create distinct experiences.

**Current State**: Visual parameters exist in `app/galaxy/core/createUniforms.ts` including:
- `fdAlpha` (depth-of-field intensity)
- `focalDistance` (focus point)
- `aperture` (blur intensity)
- `nebulaAmp` (particle wiggle intensity)
- `phaseMix` and `dyingMix` (galaxy formation phases)
- Path modes (Base, Spiral, Vortex, etc.)

**Requirements**:
- Define location-specific parameter sets (camera position, target, visual effects)
- Implement automatic parameter transitions when arriving at locations
- Add location-specific shader effects and particle behaviors
- Create smooth parameter interpolation (1-2 seconds) for seamless transitions

### 3. **Location Panels**
**Goal**: Create informational UI "pages" that appear when arriving at specific locations, displaying project information, skills, or portfolio content.

**Current State**: Basic UI panel system exists in `app/galaxy/ui/` with camera info, preset buttons, phase panels, etc.

**Requirements**:
- Design location-specific content panels with rich media (text, images, links)
- Implement panel positioning system that adapts to camera location
- Add panel entrance/exit animations synchronized with camera movement
- Create responsive panel layouts that work across device sizes
- Include close/dismiss functionality

### 4. **Mode System: Fixed vs Free Explore**
**Goal**: Implement two distinct interaction modes for different user experiences.

**Requirements**:
- **Fixed Mode (Default)**: Camera movement restricted to location navigation only
- **Free Explore Mode**: Current behavior allowing mouse-controlled camera movement
- Mode toggle interface (UI button or keyboard shortcut)
- Visual mode indicators and feedback
- Persistent mode state across sessions

### 5. **Mouse Parallax in Fixed Mode**
**Goal**: In Fixed mode, replace camera control with subtle parallax effects that create depth and immersion.

**Current State**: Mouse interaction system exists in `app/galaxy/core/createInteraction.ts` for camera control.

**Requirements**:
- Disable camera orbit controls in Fixed mode
- Implement parallax shader uniforms for mouse position tracking
- Add subtle background element movement based on mouse position
- Create layered parallax effects (near/far elements move at different rates)
- Maintain galaxy as focal point while adding ambient movement

### 6. **Location Spotlight Lighting**
**Goal**: Implement hover-based spotlighting system that highlights specific galaxy sectors while dimming others.

**Current State**: Mouse interaction provides raycasting for position detection.

**Requirements**:
- Extend raycasting to detect galaxy sectors/regions
- Implement shader-based spotlight effect (brightness/opacity modulation)
- Add smooth spotlight transitions (fade in/out over 0.5 seconds)
- Create sector boundary definitions for accurate highlighting
- Maintain performance with efficient shader calculations

## High-Level Architecture

### **Component Structure**

```
GalaxyCanvas (Main Orchestrator)
├── ModeManager (Fixed/Free mode state)
├── LocationManager (Location data and transitions)
│   ├── LocationData (Static location definitions)
│   ├── LocationAnimator (Camera and parameter transitions)
│   └── LocationPanels (UI panel management)
├── InteractionManager (Mouse/keyboard input handling)
│   ├── ParallaxController (Fixed mode parallax)
│   ├── SpotlightController (Location highlighting)
│   └── CameraController (Free mode camera control)
├── ShaderManager (Visual parameter management)
│   ├── UniformController (Parameter interpolation)
│   └── EffectController (Location-specific effects)
└── UIManager (Panel and interface management)
    ├── NavigationUI (Location selection)
    ├── ModeToggle (Fixed/Free mode switch)
    └── InfoPanels (Location content display)
```

### **Data Architecture**

#### **Location Definition Structure**
```typescript
interface Location {
  id: string;
  name: string;
  description: string;
  category: 'portfolio' | 'skills' | 'projects' | 'about';

  // Camera positioning
  cameraPreset: CameraPreset;

  // Visual parameters
  visualSettings: {
    fdAlpha: number;
    focalDistance: number;
    aperture: number;
    nebulaAmp: number;
    phaseMix: number;
    dyingMix: number;
    pathMode: PathMode;
    // Additional visual customizations
  };

  // UI content
  panelContent: {
    title: string;
    content: string;
    media?: MediaItem[];
    links?: LinkItem[];
  };

  // Interaction settings
  spotlightRadius?: number;
  parallaxIntensity?: number;
}
```

#### **Mode State Management**
```typescript
interface ModeState {
  currentMode: 'fixed' | 'free';
  lockedCamera: boolean;
  parallaxEnabled: boolean;
  spotlightEnabled: boolean;
}
```

## Implementation Phases

### **Phase 1: Core Infrastructure (Week 1-2)**
1. **Location Data Structure**: Define comprehensive location metadata
2. **Mode State Management**: Implement Fixed/Free mode toggle system
3. **Enhanced Camera System**: Extend existing camera animator for location-specific behavior
4. **Parameter Management**: Create unified system for visual parameter transitions

### **Phase 2: Location System (Week 3-4)**
1. **Location Manager**: Core location navigation and transition logic
2. **Visual Effects Engine**: Location-specific shader parameter application
3. **Camera Animation System**: Smooth transitions between locations with easing
4. **Basic Location Panels**: Simple content display at arrival

### **Phase 3: Advanced Interactions (Week 5-6)**
1. **Parallax System**: Mouse-based parallax effects in Fixed mode
2. **Spotlight Engine**: Sector-based highlighting with smooth transitions
3. **Enhanced Panels**: Rich media content with animations
4. **Navigation UI**: Intuitive location selection interface

### **Phase 4: Polish and Integration (Week 7-8)**
1. **Performance Optimization**: Ensure smooth 60fps across all modes
2. **Responsive Design**: Mobile and tablet adaptations
3. **Accessibility**: WCAG compliance for new UI elements
4. **Testing and Validation**: Comprehensive testing across devices and browsers

## Technical Requirements

### **Dependencies**
- **Existing**: Three.js, GSAP, Next.js, TypeScript
- **New**: Enhanced shader uniforms for spotlight and parallax effects
- **UI Enhancement**: Additional React components for rich content panels

### **Performance Targets**
- **Frame Rate**: Maintain 60fps in both modes
- **Load Time**: <3 seconds for initial load
- **Memory Usage**: <500MB for extended sessions
- **Bundle Size**: <2MB gzipped for fast loading

### **Browser Support**
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **WebGL**: WebGL 2.0 support required

## Success Criteria

### **Functional Requirements**
- [ ] All locations are navigable with smooth camera transitions
- [ ] Fixed and Free modes work correctly with proper state management
- [ ] Mouse parallax creates convincing depth effect in Fixed mode
- [ ] Location spotlighting highlights sectors on hover
- [ ] Location panels display rich content with proper animations

### **User Experience**
- [ ] Intuitive navigation between locations
- [ ] Smooth visual transitions that feel natural
- [ ] Engaging parallax effects that enhance immersion
- [ ] Informative location panels that showcase portfolio content
- [ ] Responsive design works across all target devices

### **Technical Excellence**
- [ ] Performance meets targets across all modes
- [ ] Code follows existing architectural patterns
- [ ] Comprehensive error handling and graceful degradation
- [ ] Maintains accessibility standards (WCAG AA)
- [ ] Clean, maintainable codebase with proper documentation

## Risk Assessment

### **Technical Risks**
- **Shader Performance**: Complex spotlight calculations may impact frame rate
- **Memory Management**: Rich media content could cause memory leaks
- **Browser Compatibility**: WebGL 2.0 features may not work on older devices

### **Design Risks**
- **UI Complexity**: Rich location panels may overwhelm users
- **Motion Sickness**: Parallax effects could cause discomfort for some users
- **Content Balance**: Need to balance technical showcase with portfolio presentation

### **Mitigation Strategies**
- **Progressive Enhancement**: Core features work without advanced effects
- **Performance Monitoring**: Real-time FPS tracking with automatic quality reduction
- **User Preferences**: Option to disable parallax and reduce motion
- **Fallback Content**: Graceful degradation for older browsers

## Future Enhancements

### **Post-Launch Phase**
- **Content Management**: Dynamic location content updates
- **Analytics Integration**: Track user engagement with locations
- **Social Features**: Share specific locations or experiences
- **VR Support**: WebXR integration for immersive experiences
- **Export Features**: Screenshot and video export capabilities

### **Advanced Features**
- **Procedural Locations**: Dynamic location generation
- **Multi-user Experiences**: Shared exploration sessions
- **Audio Integration**: Location-specific ambient soundscapes
- **Interactive Elements**: Clickable objects within locations

---

This project represents an ambitious fusion of cutting-edge web technology and portfolio presentation, creating an immersive experience that showcases both technical prowess and creative vision while honoring the spirit of the original Blueyard Galaxy.
