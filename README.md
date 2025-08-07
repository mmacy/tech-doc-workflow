# Tech Doc Workflow

Demonstration of using the [evaluator-optimizer workflow](https://www.anthropic.com/engineering/building-effective-agents#workflow-evaluator-optimizer) for technical documentation authoring. Built with Google AI Studio and Claude Code.

![Web browser showing the main page of the Tech Doc Workflow app during a doc authoring and revision run. The Technical Editor role is in the Waiting state while the Technical Writer integrates the Editor's feedback.](./media/workflow-ui-01-main-page.png)

## Prerequisites

- Node.js 18 or later
- npm (bundled with Node.js)

## Workflow roles

![Diagram of the draft revision and feedback flow between the technical writer, technical reviewer, information architect, and technical editor workflow roles](./media/workflow-diagram.png)

## Run the app locally

1. Install dependencies: `npm install`
2. Run the app: `npm run dev`
3. Configure your API keys through the application's settings interface

For detailed setup instructions, see [docs/run-app-locally.md](./docs/run-app-locally.md).
