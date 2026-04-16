"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ExecutionNode } from "@/lib/sql/execution-tree";

type Props = {
  tree: ExecutionNode;
  width?: number;
  height?: number;
};

export default function ExecutionTree({ tree, width = 760, height = 480 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 24, right: 120, bottom: 24, left: 120 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const root = d3.hierarchy<ExecutionNode>(tree, (d) => d.children);
    const layout = d3.tree<ExecutionNode>().size([innerH, innerW]);
    layout(root);

    const allNodes = root.descendants() as d3.HierarchyPointNode<ExecutionNode>[];
    const allLinks = root.links() as d3.HierarchyPointLink<ExecutionNode>[];

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const maxCost = d3.max(allNodes, (d) => d.data.totalCost ?? 0) ?? 1;
    const costScale = d3
      .scaleLinear<string>()
      .domain([0, maxCost])
      .range(["#1e293b", "#dc2626"]);

    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(allLinks)
      .join("path")
      .attr(
        "d",
        d3
          .linkHorizontal<d3.HierarchyPointLink<ExecutionNode>, d3.HierarchyPointNode<ExecutionNode>>()
          .x((d) => d.y)
          .y((d) => d.x),
      );

    const node = g
      .append("g")
      .selectAll("g")
      .data(allNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("r", 6)
      .attr("fill", (d) => costScale(d.data.totalCost ?? 0))
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d) => (d.children ? -10 : 10))
      .attr("text-anchor", (d) => (d.children ? "end" : "start"))
      .attr("fill", "#e2e8f0")
      .attr("font-size", "11px")
      .text((d) => {
        const rel = d.data.relation ? ` on ${d.data.relation}` : "";
        return `${d.data.name}${rel}`;
      });

    node
      .append("title")
      .text((d) => {
        const lines = [
          d.data.name,
          d.data.relation ? `relation: ${d.data.relation}` : null,
          d.data.totalCost != null ? `cost: ${d.data.totalCost.toFixed(2)}` : null,
          d.data.planRows != null ? `plan rows: ${d.data.planRows}` : null,
          d.data.actualRows != null ? `actual rows: ${d.data.actualRows}` : null,
          d.data.actualTimeMs != null ? `time: ${d.data.actualTimeMs.toFixed(2)} ms` : null,
        ].filter(Boolean);
        return lines.join("\n");
      });
  }, [tree, width, height]);

  return <svg ref={svgRef} className="h-auto w-full" />;
}
