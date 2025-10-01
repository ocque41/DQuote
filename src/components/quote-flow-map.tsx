"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SlideOption {
  id: string;
  name: string;
  nextSlideId?: string;
}

interface QuoteSlide {
  id: string;
  title: string;
  type: "intro" | "choice" | "addon" | "review";
  position: number;
  optionA?: SlideOption;
  optionB?: SlideOption;
}

interface QuoteFlowMapProps {
  slides: QuoteSlide[];
}

interface SlideNode {
  id: string;
  slide: QuoteSlide;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function QuoteFlowMap({ slides }: QuoteFlowMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || slides.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = Math.max(600, slides.length * 150);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate node positions
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 280;
    const verticalSpacing = 120;
    const startX = 50;
    const startY = 50;

    const nodes: SlideNode[] = [];
    const nodeMap = new Map<string, SlideNode>();

    // Position nodes
    slides.forEach((slide, index) => {
      const node: SlideNode = {
        id: slide.id,
        slide,
        x: startX + (index % 3) * horizontalSpacing,
        y: startY + Math.floor(index / 3) * verticalSpacing,
        width: nodeWidth,
        height: nodeHeight,
      };
      nodes.push(node);
      nodeMap.set(slide.id, node);
    });

    // Draw connections
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 2;

    slides.forEach((slide, index) => {
      const currentNode = nodeMap.get(slide.id);
      if (!currentNode) return;

      // Draw default sequential connection
      if (index < slides.length - 1 && !slide.optionA?.nextSlideId && !slide.optionB?.nextSlideId) {
        const nextNode = nodes[index + 1];
        if (nextNode) {
          drawArrow(
            ctx,
            currentNode.x + currentNode.width / 2,
            currentNode.y + currentNode.height,
            nextNode.x + nextNode.width / 2,
            nextNode.y,
            "#888"
          );
        }
      }

      // Draw conditional connections for Option A
      if (slide.optionA?.nextSlideId) {
        const targetNode = nodeMap.get(slide.optionA.nextSlideId);
        if (targetNode) {
          drawArrow(
            ctx,
            currentNode.x + currentNode.width / 4,
            currentNode.y + currentNode.height,
            targetNode.x + targetNode.width / 4,
            targetNode.y,
            "#3b82f6" // blue for option A
          );

          // Label
          ctx.fillStyle = "#3b82f6";
          ctx.font = "12px sans-serif";
          ctx.fillText(
            "A",
            currentNode.x + currentNode.width / 4 - 10,
            currentNode.y + currentNode.height + 15
          );
        }
      }

      // Draw conditional connections for Option B
      if (slide.optionB?.nextSlideId) {
        const targetNode = nodeMap.get(slide.optionB.nextSlideId);
        if (targetNode) {
          drawArrow(
            ctx,
            currentNode.x + (3 * currentNode.width) / 4,
            currentNode.y + currentNode.height,
            targetNode.x + (3 * targetNode.width) / 4,
            targetNode.y,
            "#8b5cf6" // purple for option B
          );

          // Label
          ctx.fillStyle = "#8b5cf6";
          ctx.font = "12px sans-serif";
          ctx.fillText(
            "B",
            currentNode.x + (3 * currentNode.width) / 4 - 10,
            currentNode.y + currentNode.height + 15
          );
        }
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const { slide, x, y, width, height } = node;

      // Node background
      ctx.fillStyle = getNodeColor(slide.type);
      ctx.fillRect(x, y, width, height);

      // Node border
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Slide type badge
      ctx.fillStyle = "#fff";
      ctx.font = "10px sans-serif";
      const badgeText = slide.type.toUpperCase();
      ctx.fillText(badgeText, x + 8, y + 16);

      // Slide title
      ctx.fillStyle = "#000";
      ctx.font = "14px sans-serif";
      const title = slide.title || `Slide ${slide.position + 1}`;
      const truncated = title.length > 20 ? title.substring(0, 17) + "..." : title;
      ctx.fillText(truncated, x + 8, y + 40);

      // Position number
      ctx.fillStyle = "#666";
      ctx.font = "12px sans-serif";
      ctx.fillText(`#${slide.position + 1}`, x + 8, y + 60);

      // Options indicator
      if (slide.optionA || slide.optionB) {
        ctx.fillStyle = "#666";
        ctx.font = "10px sans-serif";
        const optionsText = slide.optionB ? "A/B Options" : "Option";
        ctx.fillText(optionsText, x + width - 70, y + 60);
      }
    });

  }, [slides]);

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  const getNodeColor = (type: string): string => {
    switch (type) {
      case "intro":
        return "#dbeafe"; // blue-100
      case "choice":
        return "#fef3c7"; // amber-100
      case "addon":
        return "#d1fae5"; // green-100
      case "review":
        return "#e9d5ff"; // purple-100
      default:
        return "#f3f4f6"; // gray-100
    }
  };

  if (slides.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Add slides to see the flow visualization</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 border border-gray-300 rounded shrink-0"></div>
          <span>Intro</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-amber-100 border border-gray-300 rounded shrink-0"></div>
          <span>Choice</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 border border-gray-300 rounded shrink-0"></div>
          <span>Add-on</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-100 border border-gray-300 rounded shrink-0"></div>
          <span>Review</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 sm:w-8 h-0.5 bg-gray-400 shrink-0"></div>
          <span>Default</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 sm:w-8 h-0.5 bg-blue-500 shrink-0"></div>
          <span>Option A</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-6 sm:w-8 h-0.5 bg-purple-500 shrink-0"></div>
          <span>Option B</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="w-full overflow-auto border rounded-lg bg-white touch-pan-x touch-pan-y">
        <canvas ref={canvasRef} className="min-w-full" />
      </div>

      {/* Slide List */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide) => (
          <Card key={slide.id} className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {slide.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">#{slide.position + 1}</span>
                </div>
                <p className="font-medium text-sm truncate">
                  {slide.title || `Slide ${slide.position + 1}`}
                </p>
                {(slide.optionA || slide.optionB) && (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {slide.optionA && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-blue-600">A:</span>
                        <span className="truncate">{slide.optionA.name || "Option A"}</span>
                      </div>
                    )}
                    {slide.optionB && (
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-purple-600">B:</span>
                        <span className="truncate">{slide.optionB.name || "Option B"}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
