import { type ZodSchema, z } from 'zod';

type TriggerEvent =
    | {
          type: 'async';
          name: string;
          description: string;
      }
    | {
          type: 'sync';
          name: string;
          description: string;
          outputSchema: ZodSchema;
      };

export type AgentConfig = {
    id: string;
    name: string;
    description: string;
    triggerEvents: TriggerEvent[];
    config: {
        appId: string;
        accountId: string;
        widgetKey: string;
    };
};

// Define output schema for Web Search Agent results
const WebSearchResultSchema = z.object({
    results: z.array(
        z.object({
            title: z.string(),
            url: z.string(),
            snippet: z.string(),
            domain: z.string().optional(),
            publishedDate: z.string().optional()
        })
    ),
    query: z.string(),
    totalResults: z.number().optional()
});

export const AGENT_CONFIGS: AgentConfig[] = [
    {
        id: '154a49c9-3b4a-470c-8317-85f308acba1b',
        name: 'Web Search Agent',
        description:
            'An AI agent designed to efficiently search and retrieve information from the web, tailored to specific queries and domains.',
        triggerEvents: [
            {
                type: 'sync',
                name: 'search the web searchbox',
                description:
                    'When enter any query from user then should be input for agent "Web Search Agent" and provide output in app',
                outputSchema: WebSearchResultSchema
            }
        ],
        config: {
            appId: 'sagar-test',
            accountId: '03eb9ecc-c83e-4471-a489-9ae04ba4c012',
            widgetKey: '3hM6TZxBPiMSKE2eCqY2YXwL5bnVR8WkMfQnG4qL'
        }
    }
];
