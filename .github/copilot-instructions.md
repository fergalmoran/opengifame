# Copilot Instructions
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