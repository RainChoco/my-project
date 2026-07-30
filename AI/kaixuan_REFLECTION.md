# AI Usage Reflection

## 1. How did AI tools assist in your development process?
The AI tool (Claude Code) served as an advanced pair-programmer. Instead of writing boilerplate code, I used it to accelerate the implementation of the Strategic Rankings Dashboard. It helped me set up a clean, modular architecture (Controller -> Service -> Repository) and generated the React frontend (Vite, React Query, Recharts). 

## 2. What challenges did you face when using AI?
The main challenge was ensuring the AI didn't overwrite or assume the implementations of my teammates (Zheng Hong, Jerrold, etc.). Initially, AI tends to write monolithic code. I had to explicitly instruct the AI to use the "Repository Pattern" and create temporary "Mock Repositories." This ensured my dashboard could be built and tested in isolation without waiting for my teammates to finish their database models. Another challenge was dealing with Git tracking errors (e.g., node_modules accidentally being staged by the AI), which I had to catch and fix via explicit commands.

## 3. What did you learn about software engineering from this experience?
I learned that defining strict interface contracts (`INTERFACE_CONTRACT.md`) is more important than writing the code itself in a team project. By defining exactly what data my dashboard expects from the Tender and Evaluation modules (like Enums, pagination limits, and required fields), integration becomes a predictable process rather than a guessing game. I also learned the value of verifying AI-generated code independently; AI can claim tests passed, but a developer must always pull down the repo, run the build, and verify the console outputs themselves.