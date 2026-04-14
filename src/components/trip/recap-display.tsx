"use client";

import { Card, CardContent } from "@/components/ui/card";

interface RecapDisplayProps {
  content: string;
}

export function RecapDisplay({ content }: RecapDisplayProps) {
  return (
    <Card>
      <CardContent className="prose prose-invert prose-sm max-w-none">
        <div
          className="text-text-primary leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
        />
      </CardContent>
    </Card>
  );
}

function formatMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-accent mt-6 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-accent mt-8 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-accent mt-8 mb-4">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-text-secondary">$1</li>')
    .replace(/\n\n/g, '<br/><br/>');
}
