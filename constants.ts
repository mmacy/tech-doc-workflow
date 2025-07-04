import { AgentConfig, AgentName, AgentRole, AgentSettings, DocumentTypeProfile } from './types';
import { ProviderConfig } from './types/providers';

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';

export const AGENT_CONFIGURATIONS: ReadonlyArray<AgentConfig> = [
  {
    id: AgentName.TECHNICAL_WRITER,
    role: AgentRole.WRITER,
    description: "Generates and revises content based on inputs and feedback.",
  },
  {
    id: AgentName.TECHNICAL_REVIEWER,
    role: AgentRole.REVIEWER,
    description: "Reviews for technical accuracy against source code.",
    defaultMaxLoops: 2,
  },
  {
    id: AgentName.INFORMATION_ARCHITECT,
    role: AgentRole.REVIEWER,
    description: "Reviews for structure, flow, clarity, and organization.",
    defaultMaxLoops: 3,
  },
  {
    id: AgentName.TECHNICAL_EDITOR,
    role: AgentRole.REVIEWER,
    description: "Reviews for grammar, style, tone, and consistency.",
    defaultMaxLoops: 3,
  },
];

const getDefaultProviderConfig = (): ProviderConfig => {
  // Check for environment variables in order of preference

  // OpenAI
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey) {
    return {
      type: 'openai',
      apiKey: openaiApiKey,
      model: 'gpt-4o'
    };
  }

  // Azure OpenAI
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (azureApiKey && azureEndpoint && azureDeployment) {
    return {
      type: 'azure-openai',
      apiKey: azureApiKey,
      azureEndpoint: azureEndpoint,
      azureDeployment: azureDeployment,
      azureApiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-10-01-preview'
    };
  }

  // Gemini (fallback)
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey) {
    return {
      type: 'gemini',
      apiKey: geminiApiKey
    };
  }

  // Default to Gemini with empty key (requires manual configuration)
  return {
    type: 'gemini',
    apiKey: ''
  };
};

export const INITIAL_AGENT_SETTINGS: AgentSettings = {
  maxLoopsPerReviewer: {
    [AgentName.INFORMATION_ARCHITECT]: AGENT_CONFIGURATIONS.find(a => a.id === AgentName.INFORMATION_ARCHITECT)?.defaultMaxLoops ?? 3,
    [AgentName.TECHNICAL_EDITOR]: AGENT_CONFIGURATIONS.find(a => a.id === AgentName.TECHNICAL_EDITOR)?.defaultMaxLoops ?? 3,
    [AgentName.TECHNICAL_REVIEWER]: AGENT_CONFIGURATIONS.find(a => a.id === AgentName.TECHNICAL_REVIEWER)?.defaultMaxLoops ?? 2,
  },
  reviewerGuidance: {
    [AgentName.INFORMATION_ARCHITECT]: "Focus on a logical flow of information for effective and efficient transfer of information. If existing documentation was provided, ensure the document fits within its information architecture, avoids duplication, and references other documents with Markdown links (even placeholder) if they would aid in understanding or learning the content in the document being authored.",
    [AgentName.TECHNICAL_EDITOR]: "Adhere to standard technical writing best practices (e.g., active voice, consistent terminology, correct grammar and punctuation). Check for overall readability and conciseness. Headers of all levels should be sentence case, list markers should have only one space between the list marker (hyphen or N.) and the list item text, and there should be blank lines surrounding headers, lists, and fenced code blocks. Advise use of Mermaid diagrams where such conent would add to understanding.",
    [AgentName.TECHNICAL_REVIEWER]: "Verify all procedural steps, code examples, and technical claims against the provided source code. Treat source code as authoritative, identifying discrepancies between source code and the document as requiring revision.",
  },
  writingStyleGuide: "",
  markdownStyleGuide: "",
  llmProvider: getDefaultProviderConfig(),
};

export const INITIAL_DOCUMENT_TYPE_PROFILES: DocumentTypeProfile[] = [
  {
    id: 'profile_howto_default',
    name: "How-to guide",
    description: "Provides step-by-step instructions to achieve a specific task.",
    docTypeDescription: `# How-to guides

How-to guides take the reader through the steps required to solve a real-world problem.

They are recipes, directions to achieve a specific end - for example: *how to create a web form*; *how to plot a three-dimensional data-set*; *how to enable LDAP authentication*.

They are wholly **goal-oriented**.

**How-to guides are wholly distinct from tutorials** and must not be confused with them:

- A tutorial is what you decide a beginner needs to know.
- A how-to guide is an answer to a question that only a user with some experience could even formulate.

In a how-to guide, you can assume some knowledge and understanding. You can assume that the user already knows how to do basic things and use basic tools.

Unlike tutorials, how-to guides in software documentation tend to be done fairly well. They're also fun and easy to write.

## Analogy from cooking

Think about a recipe, for preparing something to eat.

A recipe has a clear, defined end. It addresses a specific question. It shows someone - who can be assumed to have some basic knowledge already - how to achieve something.

Someone who has never cooked before can't be expected to follow a recipe with success, so a recipe is not a substitute for a cooking lesson. At the same time, someone who reads a recipe would be irritated to find that it tries to teach basics that they know already, or contains irrelevant discussion of the ingredients.

## How to write good how-to guides

### Provide a series of steps

**How-to guides must contain a list of steps, that need to be followed in order** (just like tutorials do). You don't have to start at the very beginning, just at a reasonable starting point. How-to guides should be reliable, but they don't need to have the cast-iron repeatability of a tutorial.

### Focus on results

**How-to guides must focus on achieving a practical goal.** Anything else is a distraction. As in tutorials, detailed explanations are out of place here.

### Solve a particular problem

**A how-to guide must address a specific question or problem**: *How do I …?*

This is one way in which how-to guides are distinct from tutorials: when it comes to a how-to guide, the reader can be assumed to know *what* they should achieve, but don't yet know *how* - whereas in the tutorial, *you* are responsible for deciding what things the reader needs to know about.

### Don't explain concepts

**A how-to guide should not explain things.** It's not the place for discussions of that kind; they will simply get in the way of the action. If explanations are important, link to them.

### Allow for some flexibility

**A how-to guide should allow for slightly different ways of doing the same thing.** It needs just enough flexibility in it that the user can see how it will apply to slightly different examples from the one you describe, or understand how to adapt it to a slightly different system or configuration from the one you're assuming. Don't be so specific that the guide is useless for anything except the exact purpose you have in mind.

### Leave things out

**Practical usability is more valuable than completeness.** Tutorials need to be complete, end-to-end guides; how-to guides do not. They can start and end where it seems appropriate to you. They don't need to mention everything that there is to mention either, just because it is related to the topic. A bloated how-to guide doesn't help the user get speedily to their solution.

### Name guides well

**The title of a how-to document should tell the user exactly what it does.** *How to create a class-based view* is a good title. *Creating a class-based view* or worse, *Class-based views*, are not.

## Example from documentation

Each how-to guide is an answer to a question, or problem: *how do I...?* Each title can clearly be preceded by the words "How to". Each one is a recipe, that takes you through the steps required to complete a specific task.

Although both the tutorials and the how-to guides serve the needs of the user, the tutorials are led by the author who knows what the user needs to know, while the how-to guides are led by the user who asks the questions.`,
    template: `<!-- You MUST replace all PLACE_HOLDERS -->
# TITLE_THAT_STARTS_WITH_VERB

<!-- You MUST provide an introduction of 2-4 sentences. -->
<!-- You MUST start the first sentence with a verb. -->

## Prerequisites

<!-- You MUST specify anything the developer must have in place before starting - anything they need to "bring to the table." -->
<!-- You MAY omit this section if there are no prerequisites. -->
<!-- You MUST use an unordered list for each requirement if there are two or more requirements. -->
<!-- You MUST NOT use a list if there is only one requirement. -->
<!-- You MUST NOT include calls-to-action or procedural guidance. -->
<!-- You MAY link to other documents or websites that DO contain procedures the developer can follow to satisfy a requirement. -->

## VERB_BASED_PROCEDURE_HEADER_WITH_NO_GERUNDS

<!-- You MUST provide the step(s) a developer must complete to accomplish the goal of the how-to. -->
<!-- You MAY introduce the procedure with a sentence or two about what it accomplishes and why. -->
<!-- You MUST use a sequentially numbered (ordered) list for the procedure's steps. -->
<!-- You MAY include optional steps prefixed with "(Optional)". -->
<!-- You SHOULD include output if a step or the procedure produces any to show the developer what success looks like. -->

## ANOTHER_VERB_BASED_PROCEDURE_HEADER_WITH_NO_GERUNDS

<!-- You SHOULD include additional procedural sections as needed to accomplish the goal of the how-to. -->
<!-- You SHOULD use additional procedure sections to split long procedures into digestible "chunks" to help keep developers on track. -->
<!-- You MAY omit additional procedure sections if a single procedure accomplishes the goal of the how-to. -->

## Clean up

<!-- You SHOULD provide the steps that help the developer clean up (delete, stop, etc.) any resources they no longer need once they've completed the procedures in the how-to. -->
<!-- You SHOULD warn the developer if there are consequences of NOT cleaning up, especially if they are fiduciary in nature. -->
<!-- You MUST warn the developer if there are security risks of NOT cleaning up. -->
<!-- You MUST warn the developer if there are data-loss risks if they DO clean up. -->
<!-- You MAY omit this section if no resources were created during the how-to that can or should be cleaned up. -->

## Next steps <!-- or alternate header "Recap" (see below) -->

<!-- You SHOULD include a one- or two-sentence summary of what the developer accomplished and why. -->
<!-- You SHOULD include an unordered list of one to three links with brief descriptions that direct the developer to the logical next steps their learning or task journey, if any. -->
<!-- You MAY omit the links and provide only the one- or two-sentence summary of what the developer accomplished and why. -->
<!-- You SHOULD prefer the one- or two-sentence summary over a list of links if you are not 100% certain the links are valid and contain relevant information. -->
<!-- You MUST use "Recap" for this section's header (instead of "Next steps") if you include only the summary and no links in this section. -->
`
  },
  {
    id: 'profile_explanation_default',
    name: "Explanation document",
    description: "Explains a concept, system, or process in detail.",
    docTypeDescription: `# Explanation documents

Explanation documents provide background and context. They discuss a particular topic in depth.

They are for understanding, not for direct action. For example: *Understanding the Django request-response cycle*; *The MVT application architecture*.

They are **knowledge-oriented**.

## Analogy from teaching

Think of an explanation as a lecture or a chapter in a textbook. It's designed to build understanding of a subject. It's not a lab session or a workbook exercise. It provides the "why" behind the "how".

## How to write good explanation documents

### Focus on clarity and comprehension
The primary goal is to make a topic understandable. Use clear language, analogies, and examples.

### Structure logically
Start with a high-level overview and then drill down into details. Use headings to create a clear hierarchy of information.

### Use diagrams
Visual aids like Mermaid diagrams are extremely useful for illustrating concepts, architectures, and processes.

### Don't include instructions
Avoid providing step-by-step instructions. If a user needs to perform a task based on the knowledge, link to a relevant how-to guide or tutorial.

### Be comprehensive (but not exhaustive)
Cover the topic thoroughly, but avoid getting lost in tangents. Stick to the core concepts relevant to the document's purpose.

### Name documents well
The title should reflect the topic being explained. *A guide to authentication in Django* is good. *Authentication* is less descriptive.`,
    template: `---
title: "{{TITLE}}"
date: {{DATE}}
tags: [explanation, concept]
---

# {{TITLE}}

Provide a high-level overview of the concept being explained.

## Core concepts

Brief intro or list of core concepts.

## {{CONCEPT_1_TITLE}}

Detailed explanation of the first core concept.

Include Mermaid diagrams if they would aid in understanding the concept.

## {{CONCEPT_2_TITLE}}

Detailed explanation of the second core concept.

Include Mermaid diagrams if they would aid in understanding the concept.

## Architecture (if applicable)

Describe the system architecture.

## How it works

Explain the process or workflow.

## Key takeaways

List the key benefits or advantages.

## Further reading

- Link to related document 1
- Link to related document 2
`
  }
];


export const PROMPT_SYSTEM_INSTRUCTION = "You are an expert technical documentation assistant. Follow instructions precisely. Output only Markdown and do not surround it with code fences.";

const getGlobalStyleGuidance = (agentSettings: AgentSettings): string => {
    let guidance = '';
    if (agentSettings.writingStyleGuide?.trim()) {
        guidance += `
Global writing style guide to adhere to:
<global_writing_style_guide>
${agentSettings.writingStyleGuide}
</global_writing_style_guide>`;
    }
    if (agentSettings.markdownStyleGuide?.trim()) {
        guidance += `
Global Markdown style guide to adhere to:
<global_markdown_style_guide>
${agentSettings.markdownStyleGuide}
</global_markdown_style_guide>`;
    }
    return guidance;
}


export const getTechnicalWriterInitialPrompt = (
  profile: DocumentTypeProfile,
  sourceContent: string,
  supportingContent: string,
  agentSettings: AgentSettings
): string => {
  return `You are an expert ${AgentName.TECHNICAL_WRITER}.

Your task is to create a draft of a new technical document.
${getGlobalStyleGuidance(agentSettings)}
Document Profile:

  Name: ${profile.name}

  Description: ${profile.description}

${profile.docTypeDescription.trim() ? `Guidance on writing for this document type:
<doc_type_guidance>
${profile.docTypeDescription}
</doc_type_guidance>
` : ''}
  ${profile.template ? `Template to adhere to while writing or revising this document:

  \`\`\`markdown
  ${profile.template}
  \`\`\`` : "No specific template provided, generate a standard structure for this document type."}

Existing document, draft, or other content serving as the source material for the document:

\`\`\`
${sourceContent}
\`\`\`

Authoritative source code or other content serving as the source of truth against which the document's claims and content should be compared:

\`\`\`
${supportingContent || "No supporting content provided."}
\`\`\`

Based on all the provided information, write or revise a comprehensive, clear, and well-structured document titled appropriately for its content, fitting the profile of a "${profile.name}". Ensure the output is in Markdown format and NOT enclosed in tripel-backtick code fencing.

Focus on fulfilling the purpose of a ${profile.name} as described.

Output ONLY the Markdown content for the document. Do not include any preambles or explanations outside the Markdown and do NOT enclose the document it in code fences.`;
};

export const getTechnicalWriterRevisionPrompt = (
    profile: DocumentTypeProfile,
    documentToRevise: string,
    feedback: string,
    agentSettings: AgentSettings
): string => {
  return `You are an expert ${AgentName.TECHNICAL_WRITER}. Your task is to revise an existing technical document based on specific feedback.
${getGlobalStyleGuidance(agentSettings)}
Document Profile:

  Name: ${profile.name}

  Description: ${profile.description}

${profile.docTypeDescription.trim() ? `Guidance on writing for this document type:
<doc_type_guidance>
${profile.docTypeDescription}
</doc_type_guidance>
` : ''}

Document to revise:

\`\`\`markdown
${documentToRevise}
\`\`\`

Feedback for revision:

\`\`\`
${feedback}
\`\`\`

Carefully consider the feedback and apply the necessary changes to the document. Ensure the revised output is in Markdown format.

Output ONLY the revised Markdown content for the document. Do not include any preambles or explanations outside the Markdown. Do NOT enclose the document itself in code fencing.`;
};

const getBaseReviewerPrompt = (
  agentName: AgentName,
  profile: DocumentTypeProfile,
  documentContent: string,
  specialization: string,
  agentSettings: AgentSettings,
  sourceContent?: string,
  supportingContent?: string
): string => {
  let context = "";
  if (agentName === AgentName.TECHNICAL_REVIEWER && sourceContent) {
    context += `\n\nOriginal source for cross-referencing:

\`\`\`
${sourceContent}
\`\`\``;
  }

  let globalGuidanceSection = "";
  if (agentName !== AgentName.TECHNICAL_REVIEWER) {
      globalGuidanceSection = getGlobalStyleGuidance(agentSettings);
  }

  let docTypeGuidanceSection = "";
  if (agentName !== AgentName.TECHNICAL_REVIEWER && profile.docTypeDescription.trim()) {
      docTypeGuidanceSection = `\n\nGuidance on writing for the document type "${profile.name}":
<doc_type_guidance>
${profile.docTypeDescription}
</doc_type_guidance>`;
  }

  const customGuidance = agentSettings.reviewerGuidance[agentName as keyof AgentSettings['reviewerGuidance']];
  let guidanceSection = "";
  if (customGuidance && customGuidance.trim() !== "") {
    guidanceSection = `\n\nSpecific review guidance for this task (in addition to your primary specialization):

\`\`\`
${customGuidance}
\`\`\``;
  }

  return `You are an expert ${agentName}. Your specialization is: ${specialization}.${globalGuidanceSection}${docTypeGuidanceSection}${guidanceSection}

You are reviewing a technical document of type '${profile.name}'.

Document content to review:

\`\`\`markdown
${documentContent}
\`\`\`

${context}

CRITICAL INSTRUCTION: You MUST respond in one of the following two formats ONLY:

1. If the document meets all quality standards for your area of expertise and the provided guidance, and requires NO changes:

    CONTINUE

2. If the document requires revisions in your area of expertise or based on the provided guidance:

    REVISE: [Provide very specific, actionable feedback. Clearly state what needs to be changed and why, focusing ONLY on your area of specialization: ${specialization} and the custom guidance provided.]

Do not add any text other than specified".`;
};

export const getInformationArchitectReviewPrompt = (profile: DocumentTypeProfile, documentContent: string, agentSettings: AgentSettings): string => {
  return getBaseReviewerPrompt(AgentName.INFORMATION_ARCHITECT, profile, documentContent, "information architecture (structure, flow, logical organization, clarity of headings, content grouping, navigation, and overall coherence for the intended audience)", agentSettings);
};

export const getTechnicalEditorReviewPrompt = (profile: DocumentTypeProfile, documentContent: string, agentSettings: AgentSettings): string => {
  return getBaseReviewerPrompt(AgentName.TECHNICAL_EDITOR, profile, documentContent, "technical editing (grammar, spelling, punctuation, style, tone, voice, clarity, conciseness, terminology consistency, and adherence to common technical writing best practices)", agentSettings);
};

export const getTechnicalReviewerReviewPrompt = (profile: DocumentTypeProfile, documentContent: string, sourceContent: string, supportingContent: string, agentSettings: AgentSettings): string => {
  return getBaseReviewerPrompt(AgentName.TECHNICAL_REVIEWER, profile, documentContent, "technical accuracy and consistency with the provided source code. Verify claims, procedures, and factual statements against the source code. Treat source code as authoritative, identifying discrepancies between source code and the document as requiring revision.", agentSettings, sourceContent, supportingContent);
};
