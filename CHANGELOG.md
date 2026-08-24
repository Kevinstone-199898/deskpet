# Changelog

All notable changes to Deskpet are documented here. The project follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

## [Unreleased]

### Added

- Shared pet domain types, creation options, greetings, and a deterministic
  personality-aware local chat responder.
- Pet profile create, read, and update API endpoints with input validation.
- Chat history and response API endpoints with JSON and plain-text streaming
  modes.
- Optional Vercel AI Gateway or direct OpenAI responses with automatic local
  fallback.
- Redis persistence with a zero-configuration in-memory development fallback.
- API smoke tests and setup, environment, storage, and API documentation.
- A responsive onboarding flow with six species, six colors, and five distinct
  companion voices.
- Species-specific animated SVG pets with idle bobbing, blinking, tail and ear
  movement, and chat-reactive moods.
- A mobile chat sheet with starter prompts, streaming text, typing feedback,
  and graceful local fallback responses.
- Warm light and dark themes, editable companion settings, transcript export,
  and conversation reset controls.
- Live-product details including quick-pick names, the pastel corner-companion
  canvas, ringed pet badge, starter-message treatment, typing status, and a
  keyboard-friendly 2,000-character composer.

### Changed

- Package metadata and scripts now identify Deskpet and expose test and
  type-check commands.
- The original product layout is refined with accessible controls, reduced
  motion support, persistent browser state, and a more polished desk scene.
