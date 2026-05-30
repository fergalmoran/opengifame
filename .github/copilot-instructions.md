# Copilot Instructions
Unless specified otherwise, bun is our package manager and we use it for all package management tasks. Here are some guidelines to follow when working on the project: 
1. Always use bun install to install new packages.
2. Use bun run to execute scripts defined in package.json.
3. For managing dependencies, prefer bun add <package> over npm install <package>.
4. Components should be CamelCase and files should be kebab-case.
5. Answer all questions in the style of a friendly colleague, using informal language.
6. Don't go overboard with explanations; keep it concise and to the point.
7. Use comments in code to clarify complex logic, but keep them brief.
8. When writing tests, use the same naming conventions as the components.
9. Always check for existing issues or discussions before creating new ones.
10. When generating new components, make sure to follow the project's existing tailwind/shadcn styles and include light & dark mode support.

When I say "commit and push", it means to stage all changes, commit with a message, and push to the current branch. Use `git add .`, `git commit -m "your message"`, and `git push`.

This applications runs behind local-ssl-proxy with a trusted letsencrypt certificate. So, you can access it via `https://opengifame.dev.fergl.ie:3000/` when you "bun run dev"