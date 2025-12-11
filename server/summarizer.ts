import Anthropic from '@anthropic-ai/sdk';

export type DetailLevel = 'high' | 'medium' | 'detailed';

const PROMPTS: Record<DetailLevel, string> = {
  high: `Summarize this terminal session in 1-2 sentences. Focus on the main goal achieved or attempted. Be concise and speak naturally as if explaining to someone what happened.`,

  medium: `Summarize this terminal session in a short paragraph (3-5 sentences). Include the key commands run and their outcomes. Speak naturally as if briefing someone on what was accomplished.`,

  detailed: `Provide a detailed walkthrough of this terminal session. Explain each significant command and its output. Group related actions together. Speak naturally, as if you're narrating the session to someone watching over their shoulder. Include any errors encountered and how they were resolved.`,
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export async function summarize(transcript: string, level: DetailLevel): Promise<string> {
  // Check if API key is available
  if (!process.env.ANTHROPIC_API_KEY) {
    return getMockSummary(transcript, level);
  }

  try {
    const anthropic = getClient();

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `${PROMPTS[level]}\n\nTerminal session transcript:\n\`\`\`\n${transcript}\n\`\`\``,
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'Unable to generate summary.';
  } catch (error) {
    console.error('Summarization error:', error);
    return getMockSummary(transcript, level);
  }
}

function getMockSummary(transcript: string, level: DetailLevel): string {
  const lines = transcript.split('\n').filter(l => l.trim());
  const lineCount = lines.length;

  switch (level) {
    case 'high':
      return `Terminal session with ${lineCount} lines of output. Commands were executed in the shell.`;
    case 'medium':
      return `This terminal session contains ${lineCount} lines of output. The user ran various shell commands. The session includes command inputs and their corresponding outputs.`;
    case 'detailed':
      return `Detailed transcript analysis:\n\nThis terminal session contains ${lineCount} lines of output. The session started with shell initialization and proceeded through various commands.\n\nNote: For full AI-powered summaries, set the ANTHROPIC_API_KEY environment variable.`;
  }
}

export function isAPIAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
