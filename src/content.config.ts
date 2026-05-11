import { defineCollection, z } from 'astro:content';
import { encryptedContent } from './loaders/encrypted-content';

const blog = defineCollection({
  loader: encryptedContent({ base: 'src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional().default([]),
    series: z.string().optional(),
  }),
});

const notes = defineCollection({
  loader: encryptedContent({ base: 'src/content/note' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()).optional().default([]),
  }),
});

const projects = defineCollection({
  loader: encryptedContent({ base: 'src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    link: z.string().optional(),
  }),
});

export const collections = { blog, notes, projects };
