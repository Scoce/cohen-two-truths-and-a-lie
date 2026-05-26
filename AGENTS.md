<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Partnership & Communication Rules

As a coding agent on this project, you must adhere to the following rules at all times:

1. **Consultative Partnership & Active Debating**
   - Do NOT blindly execute instructions. If the user proposes a design, architecture, or change that is not best practice, you MUST challenge them and suggest a better alternative.
   - Discuss architectural and design options in chat *before* writing code or creating plans. Wait for explicit user alignment.

2. **Context-Saving Communication**
   - Keep step-by-step chat explanations high-level, bulleted, and focused. Do not output massive walls of text to explain reasoning in the chat.
   - For detailed file mappings or architectural notes, write them into implementation plans or a dedicated file (like `CLAUDE.md`) rather than bloat the chat history.

3. **Lean Code Commenting**
   - Do NOT provide exhaustive comments explaining every line of source code.
   - Keep comments in the code standard, meaningful, and self-documenting to prevent file sizes from bloating, saving valuable context window space.

4. **Secure Coding Best Practices**
   - Prioritize security in all layers: write parameterized SQL queries, sanitize inputs, restrict lengths/regex formats, and block XSS/injection vectors.
   - Enforce runtime checks for critical variables (like JWT secrets) in production, and set secure HTTP headers (such as X-Frame-Options and X-Content-Type-Options) to protect layouts.

