"use client";

import * as React from "react";
import {
  Binary,
  BookOpen,
  Boxes,
  Cpu,
  GitBranch,
  GraduationCap,
  Hash,
  Info,
  Layers,
  ListOrdered,
  Network,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  DetectedStructureDescriptor,
  VisualizationStructureKind,
} from "@/types/visualizer";
import { cn } from "@/lib/utils";

const KIND_ICON_MAP: Record<
  VisualizationStructureKind,
  React.ComponentType<{ className?: string }>
> = {
  array: ListOrdered,
  stack: Layers,
  queue: Layers,
  "linked-list": GitBranch,
  tree: Binary,
  graph: Network,
  heap: Boxes,
  "hash-map": Hash,
  "recursion-memory": Cpu,
  unsupported: Info,
};

interface VisualizerToolbarProps {
  structures: DetectedStructureDescriptor[];
  activeStructureId: string | null;
  onSelectStructure: (id: string) => void;
  learningModeOpen: boolean;
  onToggleLearningMode: () => void;
  showLegend: boolean;
  onToggleLegend: () => void;
  stepNumber?: number;
  lineNumber?: number;
}

export function VisualizerToolbar({
  structures,
  activeStructureId,
  onSelectStructure,
  learningModeOpen,
  onToggleLearningMode,
  showLegend,
  onToggleLegend,
  stepNumber,
  lineNumber,
}: VisualizerToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-1 px-3.5 py-2"
      data-testid="visualizer-toolbar"
    >
      {/* Left: Title & Structure Selector Pills */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        <div className="mr-1 flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md border border-primary/25 bg-primary/12 text-primary">
            <Boxes className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground">
            Data Structure &amp; Memory Visualiser
          </span>
        </div>

        {structures.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-1"
            role="tablist"
            aria-label="Detected data structures"
          >
            {structures.map((desc) => {
              const Icon = KIND_ICON_MAP[desc.kind] ?? Boxes;
              const isSelected = desc.id === activeStructureId;
              return (
                <button
                  key={desc.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectStructure(desc.id)}
                  data-testid={`visualizer-tab-${desc.id}`}
                  className={cn(
                    "inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-all",
                    isSelected
                      ? "border-primary/45 bg-primary/12 text-primary shadow-sm"
                      : "border-border-subtle bg-surface-2/70 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span className="max-w-[140px] truncate">{desc.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Step Pill, Learning Mode Toggle, Legend Toggle */}
      <div className="flex items-center gap-1.5">
        {stepNumber !== undefined && lineNumber !== undefined && (
          <Badge variant="mono" className="hidden px-1.5 py-0 text-[10px] sm:inline-flex">
            Step {stepNumber} · L{lineNumber}
          </Badge>
        )}

        <Button
          type="button"
          variant={learningModeOpen ? "subtle" : "ghost"}
          size="xs"
          onClick={onToggleLearningMode}
          data-testid="visualizer-learning-toggle"
          className={cn(
            "h-6 gap-1 px-2 text-[11px]",
            learningModeOpen && "border border-primary/35 text-primary"
          )}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Learning Mode</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onToggleLegend}
          data-testid="visualizer-legend-toggle"
          className={cn(
            "h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground",
            showLegend && "bg-surface-2 text-foreground"
          )}
          title="Toggle color legend"
        >
          <BookOpen className="h-3 w-3" />
          <span className="hidden xl:inline">Legend</span>
        </Button>
      </div>
    </div>
  );
}

