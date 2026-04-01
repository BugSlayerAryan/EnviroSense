# EnviroMonitor - Design System & Architecture

## 🎨 Design Philosophy

EnviroMonitor implements a **modern glassmorphism + soft neumorphism hybrid design** system that combines premium SaaS aesthetics with environmental monitoring clarity.

### Core Design Principles

1. **Clarity First**: Information hierarchy guides users through the dashboard naturally
2. **Glassmorphism**: Frosted glass effects create depth without visual clutter
3. **Smooth Animations**: Framer Motion ensures every interaction feels premium (not overused)
4. **Accessibility**: Strong color contrast with semantic naming (success, warning, danger)
5. **Responsive**: Mobile-first design that scales seamlessly to desktop

---

## 🎯 Visual Design System

### Color Palette

**Light Mode Base**
- Background: `oklch(0.97 0.005 240)` - Clean, near-white
- Card: `oklch(0.99 0.002 240 / 0.85)` - Subtle transparency
- Foreground: `oklch(0.2 0.02 250)` - Deep navy

**Dark Mode Base**
- Background: `oklch(0.16 0.02 270)` - Premium dark blue
- Card: `oklch(0.2 0.025 270 / 0.75)` - Elevated cards
- Foreground: `oklch(0.93 0.01 240)` - Off-white text

**Environmental Indicators**
- Primary (Green): `oklch(0.55 0.18 160)` - Health & growth
- Orange: `oklch(0.7 0.18 60)` - Warning & sun
- Red: `oklch(0.55 0.22 30)` - Danger & pollution
- Blue: `oklch(0.6 0.15 250)` - Water & weather
- Yellow: `oklch(0.8 0.15 85)` - Sun & energy

### Typography

- **Font**: Inter (system-optimized sans-serif)
- **Font Smoothing**: -webkit-font-smoothing: antialiased
- **Text Rendering**: optimizeLegibility

### Spacing System

- Base unit: 4px (Tailwind)
- Card padding: 1.25rem (5 * base)
- Gap between cards: 1rem (mobile) → 1.25rem (desktop)
- Border radius: 0.75rem (12px standard), 1rem (16px for cards)

---

## 🧩 Component Architecture

### Layout Components

#### **Navbar** (`navbar.tsx`)
- Sticky header with glassmorphic background
- Search functionality with focus states
- Theme toggle with smooth rotation animation
- Notification badge with pulse effect
- User avatar with gradient styling

**Key Features:**
- Animated entrance of logo/search/actions
- Focus ring highlighting on search
- Notification badge scales on mount
- Smooth theme transition

#### **Sidebar** (`sidebar.tsx`)
- Left navigation (hidden on mobile via `lg:flex`)
- Staggered menu item animations
- Active state with gradient background & glow
- Location card with animated MapPin icon
- Live status indicator with pulse animation

**Key Features:**
- Smooth menu transitions on hover
- Active indicator animates on selection
- Location card has subtle Y-axis hover effect
- Status dot pulses continuously

#### **Mobile Nav** (`mobile-nav.tsx`)
- Fixed bottom navigation for touch devices
- Gradient background with blur
- Active state with background highlight
- Icon glow effect when active
- Tap feedback animations

**Key Features:**
- Staggered entrance animations
- Active icon scales continuously
- Hover underline appears on desktop
- Safe area inset for notched phones

### Data Cards

#### **Environment Score Card** (`environment-score.tsx`)
- Hero section with animated background gradients
- Large score display (text gradient: primary → blue)
- Semi-circular gauge visualization
- Recommendation box with animated shield icon
- Trend indicator showing score change

**Animations:**
- Floating background gradients (10s, 12s cycles)
- Number counter effect on mount
- Rotating leaf decoration
- Pulsing shield icon

#### **Air Quality Card** (`aqi-card.tsx`)
- Large AQI value with color-coded badge
- Circular gauge with color progression
- PM2.5 and PM10 detail rows with hover effects
- Live monitoring indicator with pulse

**Animations:**
- Glow effect around gauge (2s scale pulse)
- Number appears with scale-in animation
- Detail rows slide in with stagger
- Hover state lifts row up 4px

#### **Weather Card** (`weather-card.tsx`)
- Animated weather icon (bounces vertically)
- Temperature display with gradient text
- Three weather metrics (humidity, wind, rainfall)
- "Feels like" secondary temperature

**Animations:**
- Icon bobs up/down (4s cycle)
- Metrics slide in on mount with stagger
- Hover effects lift row background

#### **UV Index Card** (`uv-card.tsx`)
- Large UV value with color-coded severity
- Circular gauge with animated sun icon
- Sunlight hours and radiation metrics
- Sun protection warning banner

**Animations:**
- Sun icon spins and scales (3s cycle)
- Gauge has outer glow pulse
- Warning banner slides in on mount

### Chart Components

#### **AQI Trend Chart** (`aqi-trend-chart.tsx`)
- Area chart with gradient fill (Recharts)
- 7-day historical data visualization
- Custom tooltip with reveal animation
- Footer stats with hover lift effect
- Trend badge with animated rotation

**Features:**
- Smooth line drawing animation (1.5s)
- Grid styling matches theme
- Responsive height (192px fixed)
- Statistics show average and highest AQI

### Widget Components

#### **Health Tip Card** (`health-tip-card.tsx`)
- Alert-style notification with animated background
- Icon with hover rotation/scale
- Call-to-action button with gradient
- Close button with 90° rotation on hover
- Animated background glow field

**Animations:**
- Background glow drifts in smooth loop
- Icon scales on hover + rotates
- Button has gradient background + shadow
- Close button rotates 90° on hover

---

## ✨ Animation Patterns

### Entrance Animations
```
Initial: opacity 0, y: 20px
Animate: opacity 1, y: 0
Duration: 500-600ms
Easing: ease-out (default)
Stagger: 50-100ms between children
```

### Hover Effects
- **Scale**: Most cards scale 1.02-1.05 on hover
- **Lift**: Cards translate -Y 2-4px with shadow increase
- **Glow**: Primary color shadow (alpha 0.2-0.35) appears on hover

### Continuous Animations (Loops)
- **Pulse**: 2-3 second scale cycles (status dots, icons)
- **Float**: 10-12 second X/Y drift (background gradients)
- **Rotate**: Sun icons spin 360° in 3s
- **Bob**: Weather icon Y translation ±4px in 4s

---

## 📱 Responsive Design

### Breakpoints

- **Mobile** (`< 640px`):
  - Stacked card layout (1 column)
  - Hidden sidebar
  - Bottom navigation visible
  - Compact navbar
  - 16px padding sides

- **Tablet** (`640px - 1024px`):
  - 2-column grid for cards
  - Sidebar remains hidden
  - Bottom navigation still visible
  - Standard padding

- **Desktop** (`≥ 1024px`):
  - 3-column grid for main cards
  - Sidebar always visible (52-56px width)
  - Bottom navigation hidden
  - Chart layout switches to 2-column
  - Increased padding & gaps

### Mobile Optimizations

1. **Safe Area**: `pb-[env(safe-area-inset-bottom)]` for notched phones
2. **Touch Targets**: Minimum 44px buttons (10px button + 17px padding)
3. **Scrolling**: Custom scrollbar styling with `dashboard-scroll` class
4. **Bottom Padding**: 96px on mobile (24px * 4 for nav), 32px on desktop

---

## 🎨 Utility Classes

### Glass Effects
- `.glass` - Standard frosted glass (blur-xl)
- `.glass-strong` - Enhanced opacity blur (blur-2xl)
- `.glass-subtle` - Light glass for overlays

### Gradient Utilities
- `.gradient-primary` - Green to blue gradient
- `.gradient-success` - Growth indicator gradient
- `.gradient-warm` - Sun/temperature gradient
- `.text-gradient` - Text color gradients

### Card Utilities
- `.card-base` - Base card styling (glass + rounded + padding + transition)
- `.card-hover` - Card base + hover lift effect

### Badge Utilities
- `.badge-success` - Green success badge
- `.badge-warning` - Orange warning badge
- `.badge-danger` - Red danger badge
- `.badge-info` - Blue info badge

### Hover Effects
- `.hover-lift` - Y translation + shadow on hover
- `.hover-glow` - Primary color glow shadow

### Scrollbars
- `.dashboard-scroll` - Styled scrollbar with primary color thumb

---

## 🔧 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 with custom theme
- **Animations**: Framer Motion 12+
- **Charts**: Recharts 2.15
- **Icons**: Lucide React (24px baseline)
- **Theme**: next-themes with system preference detection
- **Analytics**: Vercel Analytics

---

## 📊 Performance Considerations

1. **CSS**: Using Tailwind's JIT compilation (no unused styles)
2. **Animations**: GPU-accelerated transforms (uses `transform` and `opacity`)
3. **Code Splitting**: Component-based lazy loading potential
4. **Images**: No large raster images, all SVG/CSS
5. **Fonts**: System Inter font, optimized via next/font

---

## 🌓 Light/Dark Mode

### Implementation
- Uses `next-themes` for seamless switching
- Stores preference in localStorage & respects system preference
- CSS custom properties switch on `.dark` class

### Color Adjustments
- All colors have light/dark variants
- Backgrounds shift from light to deep blue/navy
- Text contrast maintained in both modes
- Card transparency adjusted for readability

---

## 🎯 Future Enhancement Opportunities

1. **Advanced Charts**
   - Temperature trends with dual-axis
   - Pollutant breakdowns (pie/bar charts)
   - Historical comparison views

2. **Interactive Features**
   - Location search/autocomplete
   - Multiple city comparison
   - Custom alert thresholds
   - Export data as PDF/CSV

3. **Advanced Animations**
   - Gesture-based mobile interactions
   - Scroll-triggered animations
   - Parallax effects
   - Page transition animations

4. **Performance**
   - Image optimization with next/image
   - Dynamic imports for chart libraries
   - Suspense boundaries for data loading
   - Redis caching for API responses

5. **Accessibility**
   - Full keyboard navigation
   - Screen reader testing
   - ARIA labels audit
   - High contrast mode

---

## 📝 Code Organization

```
components/
  dashboard/
    ├── navbar.tsx           # Top navigation
    ├── sidebar.tsx          # Left menu
    ├── mobile-nav.tsx       # Bottom mobile nav
    ├── background.tsx       # Animated gradients
    ├── environment-score.tsx # Hero card
    ├── aqi-card.tsx         # Air quality metric
    ├── weather-card.tsx     # Weather metric
    ├── uv-card.tsx          # UV metric
    ├── aqi-trend-chart.tsx  # 7-day chart
    ├── health-tip-card.tsx  # Alert/tip card
    └── gauge.tsx            # Gauge utilities
  ui/                        # Shadcn components
    └── [various primitives]
  theme-provider.tsx         # Next.js theme setup

app/
  ├── layout.tsx            # Root layout
  ├── page.tsx              # Dashboard page
  ├── globals.css           # Global styles & design tokens
  └── ...

hooks/
  ├── use-mobile.ts         # Mobile breakpoint hook
  └── use-toast.ts          # Toast notifications

lib/
  └── utils.ts              # Utility functions
```

---

## 🚀 Deployment

The dashboard is production-ready with:
- ✅ Static generation (`npm run build`)
- ✅ Webpack support (no Turbopack issues)
- ✅ Responsive design (mobile + tablet + desktop)
- ✅ Dark mode support
- ✅ Accessibility features
- ✅ Modern animations & interactions

**Build Command**: `npm run build --webpack`  
**Start Command**: `npm start` or `npm run dev --webpack` for local

---

_Last Updated: April 2026 | EnviroMonitor v1.0_
