# Tech Doc Workflow

A React application that uses AI to automate technical documentation authoring through a multi-role [evaluator-optimizer](https://www.anthropic.com/engineering/building-effective-agents#workflow-evaluator-optimizer) workflow.

*Tech Doc Workflow* implements the collaborative writing and review process by using LLMs to replicate the roles typically seen in professional technical writing scenarios:

- a **technical writer** who generates and revises content
- a **technical reviewer** who verifies accuracy against source code
- an **information architect** who reviews structure and organization
- and a **technical editor** who ensures grammar and style consistency.

The workflow continues iteratively until all reviewers approve the document or maximum review cycles are reached.

![Diagram of the draft revision and feedback flow between the technical writer, technical reviewer, information architect, and technical editor workflow roles](media/workflow-diagram.png)

## Features

- **Multi-role AI workflow**: Technical writer, technical reviewer, information architect, and technical editor agents working collaboratively
- **Multiple LLM provider support**: OpenAI, Google Gemini, and Azure OpenAI
- **Document type profiles**: Use the included example templates and guidance for how-to guides and explanation documents or create your own
- **Iterative review process**: Automatic revision cycles with configurable maximum loops per reviewer
- **Real-time workflow tracking**: Live status updates and detailed logging of the authoring process
- **Source code verification**: Technical accuracy validation against optionally provided source code
- **Downloadable outputs**: Final document in Markdown format and complete review logs
- **Customizable settings**: Configurable reviewer guidance, style guides, and workflow parameters

## Prerequisites

- Node.js 18.0+
- npm 8.0+ (bundled with Node.js)
- Your API key from a supported provider:
  - [OpenAI API](https://platform.openai.com/api-keys)
  - [Google Gemini API](https://ai.google.dev/)
  - [Azure OpenAI API](https://learn.microsoft.com/azure/ai-foundry/)
  - Anthropic (not yet implemented)

> [!WARNING]
> This app can cost you real money! You are responsible for any API usage fees incurred by using this application.

## Installation

### 1. Get the code

```shell
git clone https://github.com/mmacy/tech-doc-workflow.git
cd tech-doc-workflow
```

### 2. Install dependencies

```shell
# Install all project dependencies
npm install
```

### 3. Configure environment

No environment variables are required. Configure your API keys through the application's settings interface after launching the application.

### 4. Run the app

```shell
# Start the development server
npm run dev
```

Navigate to the URL shown in the output, for example `http://127.0.0.1:5173`, and the *Tech Doc Workflow* interface should appear in your browser.

![Web browser showing the main page of the Tech Doc Workflow app during a doc authoring and revision run. The Technical Editor role is in the Waiting state while the Technical Writer integrates the Editor's feedback.](media/workflow-ui-01-main-page.png)

## Usage

1. Run the application and navigate to **Settings** to configure your LLM provider API key
2. Select a document type profile (**How-to guide** or **Explanation document**) from the dropdown
3. Paste your draft content (draft text, notes, or existing documentation) into the **Draft content** field
4. Optionally add authoritative **Supporting content** like source code for content generation and technical accuracy verification
5. Select **Start authoring workflow** to begin the multi-agent review process
6. Monitor the real-time progress as the AI roles peform their tasks of writing and reviewing the document
7. Download the final Markdown document and review logs when the workflow completes

## Settings

Except for API keys, Tech Doc Workflow stores its configuration settings in browser local storage and provides the following customization options. API keys are stored ONLY in memory - you must re-enter your key if you close the browser tab or window.

- **Custom reviewer guidance**: Modify the instructions given to each AI reviewer role
- **Global style guides**: Set writing and Markdown formatting standards applied across all document types
- **Document type profiles**: Create custom templates and guidance for specialized document types
- **Review loop limits**: Adjust the maximum number of revision cycles per reviewer role
- **LLM provider settings**: Switch between different AI providers

Access these settings through the **Settings** page using the gear icon in the top-right corner of the main page.

## Security

### API keys

This application prioritizes the security of your API keys:

- **Memory-only storage**: API keys are stored only in browser memory, never in local storage, session storage, or any persistent storage
- **No network transmission**: Keys are used only for direct API calls to your chosen provider (OpenAI, Google, or Azure)
- **Automatic clearing**: Keys are automatically cleared when you close the browser tab or window
- **No logging**: API keys are never written to logs or exported in any downloadable files
- **Masked display**: Keys are shown with masking (••••1234) in the user interface

#### Best practices for API key security

- Never share screenshots of the application showing your API keys
- Use API keys with appropriate usage limits and monitoring enabled at the provider level
- Regularly rotate your API keys following your organization's security policies
- Only run this application in secure, trusted environments

### Content

- All document content and workflow logs remain local to your browser
- No content is transmitted to external servers except for the necessary API calls to your chosen LLM provider
- Downloaded files contain only the document content and workflow feedback, never API keys

## Troubleshooting

**"Failed to initialize LLM provider" error**

- Verify your API key is correctly configured in Settings
- Ensure your API key has sufficient credits/quota with the provider
- Check that you've selected the correct provider type for your API key

**Workflow is slow**

- Lower the maximum review passes per reviewer in **Settings** (fewer passes may result in lower quality output)
- Review the workflow logs to identify recurring feedback patterns and adjust reviewer prompts accordingly
- Provide more accurate and/or clearer supporting material

**Poor or incomplete final document**

- Ensure your draft content provides sufficient detail for the selected document type
- Check that supporting content (if provided) is relevant and complete
- Review custom reviewer guidance settings for overly restrictive criteria
