# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- **Install dependencies**: `npm install`
- **Run development server**: `npm run dev`
- **Build production**: `npm run build`
- **Preview production build**: `npm run preview`

## Environment setup

Set the `GEMINI_API_KEY` environment variable with your Gemini API key before running the app.

## Architecture overview

This is a React + TypeScript application built with Vite that implements an evaluator-optimizer workflow for technical documentation authoring using Google's Gemini API.

### Core workflow system

The app implements a multi-role author-review-revise workflow:

1. **Technical Writer** (WRITER role) - Generates initial draft and revises it based on feedback
2. **Technical Reviewer** (REVIEWER role) - Reviews technical accuracy against source code
3. **Information Architect** (REVIEWER role) - Reviews structure, flow, and organization
4. **Technical Editor** (REVIEWER role) - Reviews grammar, style, and consistency

The workflow follows this pattern:

1. Technical Writer creates initial document
2. Each reviewer role evaluates the document in sequence
3. If a reviewer requests changes, the Technical Writer revises and the review cycle repeats
4. Process continues until all reviewers approve or max loops are reached

### Key components

- **App.tsx**: Main application component managing workflow state and orchestration
- **types.ts**: Core TypeScript definitions for roles, workflow state, and document profiles
- **constants.ts**: Role configurations, initial settings, document type profiles, and prompt templates
- **services/geminiService.ts**: Gemini API integration for text generation and review decisions
- **components/**: UI components for document input, role status, workflow logs, and settings

### Document type profiles

The system uses configurable document type profiles that define:

- Document purpose and description
- Markdown templates with placeholders
- Specific authoring guidance for each document type
- Currently includes "How-to guide" and "Explanation document" profiles

### Agent settings and customization

- Max revision loops per reviewer agent (configurable)
- Custom guidance for each reviewer type
- Global writing and Markdown style guides
- All settings persist in component state and can be managed through the Settings UI

### Review decision system

Reviewers return structured decisions:

- `CONTINUE`: Document approved, proceed to next reviewer
- `REVISE: [feedback]`: Document needs revision with specific feedback
- `ERROR`: Unexpected response or processing error

The system tracks review feedback and provides downloadable logs of the entire workflow process.
