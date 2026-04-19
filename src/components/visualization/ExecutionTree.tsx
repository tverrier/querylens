"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import type { TreeNode, Bottleneck } from "@/types";

type Props = {
  tree: TreeNode;
  bottlenecks?: Bottleneck[];
  selectedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
};

const NODE_W = 160;
const NODE_H = 64;

const SEVERITY_FILL: Record<string, string> = {
  critical: "rgba(255,71,87,0.12)",
  warning: "rgba(255,165,2,0.12)",
  good: "rgba(46,213,115,0.12)",
};

const SEVERITY_STROKE: Record<string, string> = {
  critical: "#ff4757",
  warning: "#ffa502",
  good: "#2ed573",
};

const SEVERITY_GLOW: Record<string, string> = {
  critical: "rgba(255,71,87,0.35)",
  warning: "rgba(255,165,2,0.25)",
  good: "transparent",
};

function formatCost(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function formatRows(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function ExecutionTree({
  tree,
  bottlenecks,
  selectedNodeId,
  onNodeClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const fitToScreen = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>("g.tree-group");
    if (g.empty()) return;

    const bounds = (g.node() as SVGGElement).getBBox();
    const fullW = svgRef.current.clientWidth || 760;
    const fullH = svgRef.current.clientHeight || 500;
    const padding = 40;

    const scaleX = (fullW - padding * 2) / bounds.width;
    const scaleY = (fullH - padding * 2) / bounds.height;
    const scale = Math.min(scaleX, scaleY, 1.5);

    const tx = fullW / 2 - (bounds.x + bounds.width / 2) * scale;
    const ty = fullH / 2 - (bounds.y + bounds.height / 2) * scale;

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]);
    svg.transition().duration(300).call(
      zoom.transform as unknown as (
        selection: d3.Transition<SVGSVGElement, unknown, null, undefined>,
        transform: d3.ZoomTransform,
      ) => void,
      d3.zoomIdentity.translate(tx, ty).scale(scale),
    );
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const containerW = containerRef.current.clientWidth || 760;
    const containerH = containerRef.current.clientHeight || 500;

    svg.attr("width", containerW).attr("height", containerH);

    const root = d3.hierarchy<TreeNode>(tree, (d) => d.children);
    const layout = d3
      .tree<TreeNode>()
      .nodeSize([NODE_W + 24, NODE_H + 60])
      .separation(() => 1.2);
    layout(root);

    const allNodes = root.descendants() as d3.HierarchyPointNode<TreeNode>[];
    const allLinks = root.links() as d3.HierarchyPointLink<TreeNode>[];

    const g = svg.append("g").attr("class", "tree-group");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });
    svg.call(zoom);

    const defs = svg.append("defs");
    ["critical", "warning"].forEach((sev) => {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${sev}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", "4")
        .attr("result", "blur");
      filter
        .append("feMerge")
        .selectAll("feMergeNode")
        .data(["blur", "SourceGraphic"])
        .join("feMergeNode")
        .attr("in", (d) => d);
    });

    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#2a2a3d")
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(allLinks)
      .join("path")
      .attr(
        "d",
        d3
          .linkVertical<
            d3.HierarchyPointLink<TreeNode>,
            d3.HierarchyPointNode<TreeNode>
          >()
          .x((d) => d.x)
          .y((d) => d.y),
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(allNodes)
      .join("g")
      .attr("class", "tree-node")
      .attr("transform", (d) => `translate(${d.x - NODE_W / 2},${d.y - NODE_H / 2})`)
      .attr("cursor", "pointer")
      .on("click", (_event, d) => {
        onNodeClick?.(d.data.id);
      });

    node
      .append("rect")
      .attr("width", NODE_W)
      .attr("height", NODE_H)
      .attr("rx", 8)
      .attr("fill", (d) => SEVERITY_FILL[d.data.severity] ?? "#1a1a24")
      .attr("stroke", (d) =>
        d.data.id === selectedNodeId
          ? "#4f7cff"
          : (SEVERITY_STROKE[d.data.severity] ?? "#2a2a3d"),
      )
      .attr("stroke-width", (d) => (d.data.id === selectedNodeId ? 2 : 1))
      .attr("filter", (d) =>
        d.data.severity === "critical" || d.data.severity === "warning"
          ? `url(#glow-${d.data.severity})`
          : null,
      );

    node
      .filter((d) => d.data.id === selectedNodeId)
      .append("rect")
      .attr("x", -3)
      .attr("y", -3)
      .attr("width", NODE_W + 6)
      .attr("height", NODE_H + 6)
      .attr("rx", 10)
      .attr("fill", "none")
      .attr("stroke", "var(--accent-glow, rgba(79,124,255,0.25))")
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .attr("x", NODE_W / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "#e8e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("font-family", "var(--font-mono)")
      .text((d) => {
        const label = d.data.nodeType;
        return label.length > 18 ? label.slice(0, 16) + "…" : label;
      });

    node
      .append("text")
      .attr("x", NODE_W / 2)
      .attr("y", 38)
      .attr("text-anchor", "middle")
      .attr("fill", "#8888aa")
      .attr("font-size", "10px")
      .text((d) => {
        if (d.data.relationName) return d.data.relationName;
        if (d.data.joinType) return d.data.joinType;
        return "";
      });

    node
      .append("text")
      .attr("x", NODE_W / 2)
      .attr("y", 54)
      .attr("text-anchor", "middle")
      .attr("fill", "#55556a")
      .attr("font-size", "9px")
      .attr("font-family", "var(--font-mono)")
      .text((d) => {
        const parts: string[] = [];
        parts.push(`Cost:${formatCost(d.data.totalCost)}`);
        parts.push(`Rows:${formatRows(d.data.planRows)}`);
        if (d.data.actualTime != null) {
          parts.push(`${d.data.actualTime.toFixed(1)}ms`);
        }
        return parts.join(" | ");
      });

    node.append("title").text((d) => {
      const lines = [
        d.data.nodeType,
        d.data.relationName ? `relation: ${d.data.relationName}` : null,
        `severity: ${d.data.severity}`,
        `cost: ${d.data.totalCost.toFixed(2)}`,
        `plan rows: ${d.data.planRows}`,
        d.data.actualRows != null ? `actual rows: ${d.data.actualRows}` : null,
        d.data.actualTime != null
          ? `time: ${d.data.actualTime.toFixed(2)} ms`
          : null,
        d.data.indexName ? `index: ${d.data.indexName}` : null,
        d.data.filterCondition ? `filter: ${d.data.filterCondition}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    });

    node
      .attr("opacity", 0)
      .transition()
      .duration(400)
      .delay((_d, i) => i * 50)
      .attr("opacity", 1);

    // Fit to screen after initial render
    requestAnimationFrame(() => {
      const bounds = (g.node() as SVGGElement).getBBox();
      const padding = 40;
      const scaleX = (containerW - padding * 2) / bounds.width;
      const scaleY = (containerH - padding * 2) / bounds.height;
      const scale = Math.min(scaleX, scaleY, 1.5);
      const tx = containerW / 2 - (bounds.x + bounds.width / 2) * scale;
      const ty = containerH / 2 - (bounds.y + bounds.height / 2) * scale;
      svg.call(
        zoom.transform,
        d3.zoomIdentity.translate(tx, ty).scale(scale),
      );
    });
  }, [tree, selectedNodeId, onNodeClick, fitToScreen]);

  return (
    <div ref={containerRef} className="relative h-full min-h-[400px] w-full">
      <svg
        ref={svgRef}
        className="h-full w-full"
        role="img"
        aria-label="SQL execution plan tree"
      />
      <button
        onClick={fitToScreen}
        className="absolute bottom-3 right-3 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
        aria-label="Fit tree to screen"
      >
        Fit to screen
      </button>
    </div>
  );
}
