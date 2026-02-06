# Floorplan - AI-Enabled Floorplan Editor

## Project Overview

A web-based floorplan editing application that allows users to create, edit, and optimize floor plans with AI assistance. Users can upload existing floorplan images/PDFs, trace or auto-extract elements, edit via direct manipulation or natural language chat, and export professional-quality outputs.

**Target Users:** Broad audience from homeowners planning renovations to design professionals needing quick layouts. UI should be simple by default with precision features available.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 16 + React 19 + TypeScript | App Router, server components, unified frontend/backend |
| **Canvas** | Fabric.js 7 | SVG export, object serialization, CAD precedent in industry |
| **State** | Zustand + immer | Simple, performant, undo/redo friendly |
| **AI SDK** | Vercel AI SDK + @ai-sdk/anthropic | Streaming chat, tool calling |
| **AI Models** | Claude 3 Haiku (commands), Claude 3.5 Sonnet (complex reasoning/vision) | Cost-effective tiering |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Rapid iteration, accessible components |
| **Deployment** | Vercel (planned) | Next.js native, edge functions |

---

## Project Structure

```
/src
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing/editor page
│   └── api/               # API routes
│       └── chat/          # AI chat endpoint
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── canvas/            # Fabric.js canvas components
│   │   ├── FloorplanCanvas.tsx
│   │   ├── tools/         # Drawing tools (wall, door, window, furniture)
│   │   └── objects/       # Custom Fabric objects
│   ├── chat/              # Chat interface components
│   ├── toolbar/           # Editor toolbar
│   └── panels/            # Property panels, layers, library
├── store/                 # Zustand stores
│   ├── floorplan-store.ts # Main floorplan state + undo/redo
│   ├── ui-store.ts        # UI state (selected tool, panels)
│   └── chat-store.ts      # Chat history
├── lib/
│   ├── ai/                # AI integration
│   │   ├── extract-floorplan.ts  # Image → floorplan
│   │   └── chat-actions.ts       # Chat command parsing
│   ├── fabric/            # Fabric.js utilities
│   │   ├── serialization.ts      # Save/load floorplan
│   │   └── grid.ts               # Grid snapping
│   └── utils.ts           # General utilities
├── types/
│   └── floorplan.ts       # TypeScript interfaces
└── hooks/                 # Custom React hooks
```

---

## Core Data Model

```typescript
// types/floorplan.ts

interface Floorplan {
  id: string;
  name: string;
  units: 'imperial' | 'metric';
  scale: number; // pixels per foot/meter
  rooms: Room[];
  furniture: FurnitureItem[];
  backgroundImage?: string; // For tracing uploaded images
}

interface Room {
  id: string;
  name: string;
  type: RoomType;
  walls: Wall[];
  doors: Door[];
  windows: Window[];
}

type RoomType = 'bedroom' | 'bathroom' | 'kitchen' | 'living' | 'dining' | 'office' | 'other';

interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number; // Default: 6 inches
}

interface Door {
  id: string;
  wallId: string;
  position: number; // 0-1 along wall
  width: number; // Default: 32 inches
  swingDirection: 'left' | 'right';
  swingInward: boolean;
}

interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
  height: number;
}

interface FurnitureItem {
  id: string;
  type: string; // 'sofa', 'bed-queen', 'dining-table-6', etc.
  position: Point;
  rotation: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}
```

---

## MVP Features (Priority Order)

### P0 - Core Editor
- [ ] Canvas with zoom/pan (Fabric.js)
- [ ] Wall drawing tool (click-to-place or drag)
- [ ] Room creation from walls
- [ ] Door placement on walls (with swing arc visualization)
- [ ] Window placement on walls
- [ ] Selection, move, resize, delete
- [ ] Undo/redo (Zustand with state snapshots)
- [ ] Dimensions display on selection
- [ ] Grid snapping (6" / 1' increments, toggleable)

### P1 - Enhanced Editing
- [ ] Furniture library (basic set: beds, sofas, tables, chairs)
- [ ] Drag-and-drop furniture placement
- [ ] Chat interface with Claude integration
- [ ] Natural language commands ("add a 36-inch door to the north wall")
- [ ] Image upload as background layer (for tracing)
- [ ] Export: PNG, SVG, PDF

### P2 - AI Features
- [ ] AI-assisted image extraction (walls, rooms from uploaded image)
- [ ] Layout optimization suggestions
- [ ] Furniture auto-arrangement
- [ ] Clearance/code violation warnings

### Deferred
- User accounts / cloud save
- Real-time collaboration
- DXF export
- 3D view
- Electrical/plumbing layers

---

## Development Commands

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing (to be configured)
npm run test         # Run tests
npm run test:watch   # Watch mode
```

---

## Environment Variables

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Required for AI features
```

---

## Agents

All agent invocations should be logged in `.claude/agent-use.md` for context continuity.

### Global Agents (via Task tool)

#### Development Agents
| Agent | Use When | Tools |
|-------|----------|-------|
| **frontend-developer** | Building React components, UI implementation, web standards | Read, Write, Edit, Bash, Glob, Grep |
| **backend-developer** | API development, server-side logic, security | Read, Write, Edit, Bash, Glob, Grep |
| **fullstack-developer** | End-to-end features spanning database to UI | Read, Write, Edit, Bash, Glob, Grep |
| **ui-designer** | Visual design, design systems, interaction patterns, accessibility | Read, Write, Edit, Bash, Glob, Grep |
| **mobile-developer** | React Native, Flutter, cross-platform mobile | Read, Write, Edit, Bash, Glob, Grep |
| **electron-pro** | Desktop apps with Electron, native OS integration | Read, Write, Edit, Bash, Glob, Grep |

#### Architecture Agents
| Agent | Use When | Tools |
|-------|----------|-------|
| **api-designer** | Designing REST/GraphQL APIs, documentation | Read, Write, Edit, Bash, Glob, Grep |
| **graphql-architect** | GraphQL schemas, federation, subscriptions | Read, Write, Edit, Bash, Glob, Grep |
| **microservices-architect** | Service boundaries, distributed systems | Read, Write, Edit, Bash, Glob, Grep |
| **websocket-engineer** | Real-time communication, WebSocket architecture | Read, Write, Edit, Bash, Glob, Grep |

#### Utility Agents
| Agent | Use When | Tools |
|-------|----------|-------|
| **Explore** | Codebase exploration, file/keyword search. Specify thoroughness: "quick", "medium", "very thorough" | All except Task, Edit, Write |
| **Plan** | Implementation planning, architectural trade-offs, step-by-step design | All except Task, Edit, Write |
| **Bash** | Git operations, command execution, terminal tasks | Bash only |
| **general-purpose** | Complex research, multi-step tasks, web searches, broad exploration | All tools |
| **claude-code-guide** | Questions about Claude Code CLI, Agent SDK, Claude API | Glob, Grep, Read, WebFetch, WebSearch |
| **context-compaction-advisor** | Evaluate whether to compact/summarize conversation context | All tools |

#### When to Use Which Agent
- **Exploring codebase**: Use `Explore` agent with appropriate thoroughness level
- **Planning implementation**: Use `Plan` agent before writing code
- **Building UI components**: Use `frontend-developer` agent
- **Designing APIs**: Use `api-designer` agent
- **Research/web search**: Use `general-purpose` agent
- **Git/terminal operations**: Use `Bash` agent

### Local Agents (Project-Specific)

#### Interior Architect Expert
**Location:** `.claude/agents/interior-architect.md`

Domain expert providing interior design and architecture knowledge. Consult when:
- Deciding default dimensions (room sizes, furniture, clearances)
- Validating features against professional workflows
- Prioritizing features based on real-world utility
- Setting constraints and validation rules

**Invocation pattern:**
> "Consulting interior-architect agent: [specific question]"
> *From agent knowledge:* [relevant guidance]

### Agent Usage Log
**Location:** `.claude/agent-use.md`

Tracks all agent invocations for context continuity across sessions. Log format:
```markdown
### [Agent Name]
**Purpose:** Brief description of why agent was invoked
**Query:** What was asked
**Outcome:** Key findings or actions taken
```

---

## Key Design Decisions

### Canvas Library: Fabric.js over Konva
**Decision:** Use Fabric.js instead of Konva
**Rationale:**
- Native SVG import/export (critical for professional use)
- Built-in object serialization for save/load
- More CAD-specific examples in ecosystem
- Trade-off: Less elegant React integration than react-konva

### AI Strategy: Hybrid Approach
**Decision:** Use Claude for chat interface, defer precision extraction
**Rationale:**
- LLMs have ~35% accuracy on architectural symbol recognition (AECV-bench)
- Claude excels at: natural language commands, generating descriptions, reasoning about layouts
- For MVP: Users upload image as trace layer, manually draw over it
- Future: Specialized CV pipeline for automatic extraction

### State Management: Zustand with Undo/Redo
**Decision:** Zustand + immer + full state snapshots for history
**Rationale:**
- Simple API, minimal boilerplate
- State snapshots work well for undo at ~50KB per snapshot
- Cap at 50 undo levels
- Structure:
  ```typescript
  {
    past: FloorplanState[],
    present: FloorplanState,
    future: FloorplanState[]
  }
  ```

### Grid and Snapping
**Decision:** Grid ON by default, 6" increments
**Rationale (from interior-architect agent):**
- Beginners need alignment help
- Professionals can disable or adjust
- 6" matches common construction increments
- Show grid lines at 1' intervals

---

## Architectural Defaults (from Interior Architect Agent)

### Standard Dimensions
| Element | Default | Range |
|---------|---------|-------|
| Wall thickness | 6" | 4"-12" |
| Interior door | 32" wide | 28"-36" |
| Exterior door | 36" wide | 32"-42" |
| Window (standard) | 36"x48" | varies |
| Hallway width | 36" min | 36"-48" |

### Room Minimums
| Room | Minimum | Comfortable |
|------|---------|-------------|
| Bedroom | 10'x10' | 12'x12' |
| Full bath | 5'x8' | 8'x10' |
| Half bath | 3'x6' | 4'x6' |
| Kitchen | 8'x10' | 10'x12' |

### Clearances
| Context | Minimum |
|---------|---------|
| Door swing | Full arc unobstructed |
| Toilet sides | 15" center to wall |
| Toilet front | 30" clearance |
| Traffic path | 36" |
| Secondary path | 24" |
| Kitchen island | 42" on traffic side |

---

## Code Conventions

### TypeScript
- Strict mode enabled
- Interfaces over types for objects
- Explicit return types on exported functions
- No `any` without justification comment

### React
- Functional components only
- Custom hooks for shared logic
- Props interfaces named `{Component}Props`
- Avoid prop drilling > 2 levels (use Zustand)

### Fabric.js
- Wrap Fabric operations in custom hooks
- Use refs for canvas instance (avoid re-renders)
- Custom objects extend `fabric.Object`
- Serialization via `toJSON` / `loadFromJSON`

### File Naming
- Components: PascalCase (`FloorplanCanvas.tsx`)
- Utilities/hooks: camelCase (`useFloorplan.ts`)
- Types: camelCase file, PascalCase exports

---

## Testing Strategy

- Unit tests: Zustand stores, utility functions
- Component tests: React Testing Library
- Canvas tests: Mock Fabric.js, test state changes
- E2E (future): Playwright for critical flows

---

## Performance Considerations

### Fabric.js Optimization
- Use `objectCaching: true` for complex shapes
- Set `selection: false` on background objects
- Limit canvas re-renders with `requestRenderAll()` batching
- For 500+ objects: consider viewport culling

### React + Canvas
- Canvas lives in a ref, not React state
- Sync Zustand ↔ Fabric via controlled updates
- Debounce dimension calculations

---

## Resources

- [Fabric.js Documentation](http://fabricjs.com/docs/)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
