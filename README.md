# Tech Doc Workflow

Demonstration of using the [evaluator-optimizer workflow](https://www.anthropic.com/engineering/building-effective-agents#workflow-evaluator-optimizer) for technical documentation authoring. Built with Google AI Studio and Claude Code.

![Web browser showing the main page of the Tech Doc Workflow app during a doc authoring and revision run. The Technical Editor role is in the Waiting state while the Technical Writer integrates the Editor's feedback.](./media/workflow-ui-01-main-page.png)

## Prerequisites

- Node.js

## Workflow roles

![Diagram of the draft revision and feedback flow between the technical writer, technical reviewer, information architect, and technical editor workflow roles](./media/workflow-diagram.png)

## Run the app locally

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY=YOUR_KEY_HERE` enivronment variable (replace `YOUR_KEY_HERE` with your Gemini API key)
3. Run the app: `npm run dev`
