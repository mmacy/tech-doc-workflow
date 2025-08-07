# Run the Tech Doc Workflow app locally

Spin up the Tech Doc Workflow app on your machine so you can draft and review docs without deploying to the cloud.

## Prerequisites

- Node.js 18 or later
- npm (bundled with Node.js)

## Get the project files

1. Clone the repo or download the source to a folder on your machine

    ```bash
    git clone https://github.com/mmacy/tech-doc-workflow.git
    cd tech-doc-workflow
    ```

2. Install package dependencies

    ```bash
    npm install
    ```

    npm creates a `node_modules/` folder and writes an exact dependency list to `package-lock.json`.

## Start the Vite dev server

1. Launch the Vite dev server

    ```bash
    npm run dev
    ```

    Vite prints a local URL—typically `http://localhost:5173`.

2. Open the URL in your browser. You should see the Tech Doc Workflow UI with three columns: the input form, role status, and workflow log.

## Add API keys

The app can't call a large language model (LLM) until you supply at least one provider key.

1. Select **Settings** in the header.
2. Open **LLM providers**.
3. Pick **Google Gemini**, **OpenAI**, or **Azure OpenAI**.
4. Paste your API key (and any required endpoint or deployment values). The key lives only in browser memory—closing the tab clears it.
5. Select **Test connection**. A green "Connection successful!" message confirms the key works.

## Generate your first document

1. Return to **Main app**.
2. In **Document type profiles**, leave the default *How-to guide* or pick another profile.
3. Paste your rough draft or notes into **Draft content**.
4. (Optional) Paste code or other reference material into **Supporting content**.
5. Select **Start authoring workflow**. The role cards update as writers and reviewers work. When all roles finish, a **Final document ready** card appears.
6. Select **Download markdown** to save the generated `.md` file.

## Clean up

Press `Ctrl+C` (or `Ctrl+Break` on Windows) in the terminal running `npm run dev` to stop the local server. No other resources are created.

## Next steps

- Explore **Settings → Document type profiles** to add custom templates.
- Tweak **Role settings** to change review-loop limits and guidance.
- Build a production bundle with `npm run build`, then serve the files from any static host.
