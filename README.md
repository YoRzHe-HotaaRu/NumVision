# NumVision AI 🖐️

A real-time hand gesture recognition application that uses the Google Gemini 2.5 Flash API to detect numbers (0-10) shown by your fingers instantly via the webcam.

This guide details exactly how this project was planned, designed, and built, serving as a blueprint for building similar AI-powered computer vision apps.

---

## 📅 Phase 1: Planning & Architecture

Before writing code, we established the core requirements and logic flow.

### 1. The Core Loop
The application relies on a continuous feedback loop:
1.  **Input**: Capture a video frame from the user's webcam.
2.  **Process**: Compress and convert the frame to Base64.
3.  **Intelligence**: Send the frame to **Gemini 2.5 Flash** (optimized for speed).
4.  **Output**: Receive structured JSON (Number detected? Bounding box? Confidence?).
5.  **Render**: Draw overlays on the screen and update UI.
6.  **Repeat**: Do this as fast as possible.

### 2. Tech Stack Selection
*   **Frontend**: React + TypeScript (for type safety with API responses).
*   **Styling**: Tailwind CSS (for rapid UI development and dark mode).
*   **AI Model**: Google Gemini 2.5 Flash (chosen for low latency over "Pro" models).
*   **Icons**: Lucide React.

---

## 🛠️ Phase 2: Project Setup

### 1. Initialization
We use a standard React structure.
```bash
# Conceptually similar to:
npm create vite@latest numvision-ai -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npm install @google/genai lucide-react
```

### 2. Environment Variables
Security is paramount. We access the API key strictly via the process environment.
*   `process.env.API_KEY`: The Google GenAI API Key.

---

## 💻 Phase 3: Implementation Steps

### Step 1: The Landing Page (`LandingPage.tsx`)
**Goal**: Educate the user before asking for camera permissions.
*   **Design**: Dark, modern aesthetic with "Cyberpunk/AI" vibes.
*   **Functionality**: Explains the features and provides a clear "Start" button to mount the main app.

### Step 2: The Service Layer (`services/geminiService.ts`)
**Goal**: Isolate API logic from UI logic.
*   **Structured Output**: We define a `Schema` using `Type` from the SDK. This forces the AI to return JSON, not conversational text.
    ```typescript
    const detectionSchema = {
      type: Type.OBJECT,
      properties: {
        detected: { type: Type.BOOLEAN },
        number: { type: Type.INTEGER },
        boundingBox: { ... } // ymin, xmin, ymax, xmax
      }
    };
    ```
*   **Prompt Engineering**: We use a concise system prompt: *"Identify the number shown (0-10). Keep explanation extremely brief."*

### Step 3: Camera Integration (`HandDetector.tsx`)
**Goal**: Get the video stream.
*   We use `navigator.mediaDevices.getUserMedia` requesting `facingMode: 'user'`.
*   We use a `<video>` element to show the feed and a hidden `<canvas>` to capture frames.

### Step 4: The Optimization Tricks (CRITICAL) 🚀
To make it feel "Real-time", we implemented specific optimizations in `HandDetector.tsx`:

1.  **Image Downscaling**:
    Sending 1080p images is too slow. We create a temporary canvas and resize the frame to **320px width**. This reduces the payload size by ~90% while maintaining enough detail for hand gestures.
    ```typescript
    const targetWidth = 320; // 320px is sufficient for hand detection
    // ... drawImage to tempCanvas ...
    ```

2.  **Reactive Loop**:
    Instead of a fixed `setInterval` (which might stack up requests), we use a reactive effect. As soon as one request finishes, the next one triggers immediately.
    ```typescript
    useEffect(() => {
       if (autoProcess && !isProcessing) {
         setTimeout(processFrame, 10); // 10ms buffer
       }
    }, [autoProcess, isProcessing]);
    ```

### Step 5: Visualizing Results
**Goal**: Draw the bounding box over the hand.
*   **The Mirror Problem**: Webcams are usually mirrored (CSS `scale-x-[-1]`) so moving your right hand moves the right side of the screen.
*   **The Fix**:
    1.  Keep Video CSS mirrored.
    2.  Keep Canvas CSS **normal** (so text remains readable).
    3.  **Mathematically flip** the X-coordinates of the bounding box returned by the AI.
    ```typescript
    const mirroredXMin = 1 - xmax; // Flip coordinate space
    ```

---

## 📂 File Structure Overview

*   **`index.tsx`**: Application entry point.
*   **`App.tsx`**: State manager for switching between Landing Page and Hand Detector.
*   **`components/`**:
    *   **`LandingPage.tsx`**: Marketing and onboarding.
    *   **`HandDetector.tsx`**: The core logic (Camera, Canvas, State).
*   **`services/`**:
    *   **`geminiService.ts`**: Handles the API configuration and network requests.
*   **`types.ts`**: Shared interfaces (prevents "any" types).

---

## 🚀 How to Run

1.  Clone the repository.
2.  Ensure you have a valid Google GenAI API Key.
3.  The application expects the key in `process.env.API_KEY`.
4.  Run the development server.

## 🧠 Key Learnings
*   **Latency is Payload**: Reduces image dimensions before sending to AI.
*   **User Experience**: Mirror the video, but don't mirror the text overlays.
*   **Structured Data**: Always use `responseSchema` with LLMs when building apps, or parsing will be a nightmare.
