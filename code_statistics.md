# Code Line Statistics for video-wallet Repository

## Summary
This repository contains a video wallet application with both frontend (React/TypeScript) and backend (Python) components.

## File Type Breakdown

### Python Files
- **Total Lines**: 538
- **Files**: 1 (main.py)
- **Primary file**: `src/server/main.py` (538 lines)

### TypeScript/TSX Files
- **Total Lines**: 1,264
- **Location**: Primarily in `src/web/src/` directory
- **Framework**: React with TypeScript
- **Key files include**:
  - App.tsx
  - main.tsx
  - Various component files
  - Context files (LanguageContext.tsx)
  - Configuration files (vite.config.ts, tsconfig files)

### JavaScript Files
- **Total Lines**: 0
- **Note**: No standalone JavaScript files found (project uses TypeScript)

### JSON Files
- **Total Lines**: 4,297
- **Includes**:
  - package.json files
  - package-lock.json files
  - Configuration files
  - Locale files (zh-cn.json)
  - Bolt configuration

### HTML Files
- **Total Lines**: 13
- **Files**: 1 (index.html)
- **Location**: `src/web/index.html`

### CSS Files
- **Total Lines**: 3
- **Files**: 1 (index.css)
- **Location**: `src/web/src/index.css`
- **Note**: Project likely uses Tailwind CSS for styling

## Project Structure Analysis

### Frontend (Web)
- **Technology Stack**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Linting**: ESLint
- **Total Frontend Code**: ~1,280 lines (TS/TSX + HTML + CSS)

### Backend (Server)
- **Technology Stack**: Python
- **Total Backend Code**: 538 lines
- **Architecture**: Single main.py file

### Configuration & Dependencies
- **JSON Configuration**: 4,297 lines
- **Package Management**: npm (Node.js ecosystem)
- **Internationalization**: Chinese locale support

## Total Code Statistics

| File Type | Lines | Percentage |
|-----------|-------|------------|
| JSON      | 4,297 | 69.4%      |
| TypeScript/TSX | 1,264 | 20.4% |
| Python    | 538   | 8.7%       |
| HTML      | 13    | 0.2%       |
| CSS       | 3     | 0.05%      |
| **Total** | **6,115** | **100%** |

## Code-Only Statistics (Excluding JSON)

| File Type | Lines | Percentage |
|-----------|-------|------------|
| TypeScript/TSX | 1,264 | 69.5% |
| Python    | 538   | 29.6%      |
| HTML      | 13    | 0.7%       |
| CSS       | 3     | 0.2%       |
| **Total Code** | **1,818** | **100%** |

## Key Observations

1. **Full-Stack Application**: The repository contains both frontend (React/TypeScript) and backend (Python) code
2. **Modern Frontend Stack**: Uses React with TypeScript, Vite for building, and Tailwind for styling
3. **Monolithic Backend**: Single Python file handling server logic
4. **Configuration Heavy**: Large amount of JSON configuration files (package-lock.json contributes significantly)
5. **Internationalization Ready**: Includes Chinese locale support
6. **Development Ready**: Includes proper tooling configuration (ESLint, TypeScript configs, etc.)

Generated on: $(date)