import { describe, it, expect } from "vitest";
import { buildExecutionTree } from "@/lib/sql/execution-tree";

const SEQ_SCAN_FIXTURE = [
  {
    Plan: {
      "Node Type": "Seq Scan",
      "Relation Name": "orders",
      "Alias": "orders",
      "Startup Cost": 0.0,
      "Total Cost": 1834.0,
      "Plan Rows": 150000,
      "Actual Rows": 148320,
      "Actual Total Time": 42.5,
      "Filter": "(status = 'pending'::text)",
      "Rows Removed by Filter": 1680,
    },
  },
];

const HASH_JOIN_FIXTURE = [
  {
    Plan: {
      "Node Type": "Hash Join",
      "Join Type": "Inner",
      "Startup Cost": 12.5,
      "Total Cost": 2456.8,
      "Plan Rows": 50000,
      "Actual Rows": 49800,
      "Actual Total Time": 85.3,
      Plans: [
        {
          "Node Type": "Seq Scan",
          "Relation Name": "orders",
          "Alias": "o",
          "Startup Cost": 0.0,
          "Total Cost": 1834.0,
          "Plan Rows": 150000,
          "Actual Rows": 148320,
          "Actual Total Time": 42.5,
        },
        {
          "Node Type": "Hash",
          "Startup Cost": 8.2,
          "Total Cost": 8.2,
          "Plan Rows": 200,
          "Actual Rows": 200,
          "Actual Total Time": 0.5,
          Plans: [
            {
              "Node Type": "Seq Scan",
              "Relation Name": "customers",
              "Alias": "c",
              "Startup Cost": 0.0,
              "Total Cost": 8.2,
              "Plan Rows": 200,
              "Actual Rows": 200,
              "Actual Total Time": 0.3,
            },
          ],
        },
      ],
    },
  },
];

const INDEX_SCAN_FIXTURE = [
  {
    Plan: {
      "Node Type": "Index Scan",
      "Relation Name": "products",
      "Index Name": "products_category_idx",
      "Startup Cost": 0.42,
      "Total Cost": 8.44,
      "Plan Rows": 1,
      "Actual Rows": 1,
      "Actual Total Time": 0.05,
    },
  },
];

describe("buildExecutionTree", () => {
  it("returns null for null input", () => {
    expect(buildExecutionTree(null)).toBeNull();
  });

  it("returns null for empty object", () => {
    expect(buildExecutionTree({})).toBeNull();
  });

  it("parses seq scan with critical severity for high row count", () => {
    const tree = buildExecutionTree(SEQ_SCAN_FIXTURE);
    expect(tree).not.toBeNull();
    expect(tree!.nodeType).toBe("Seq Scan");
    expect(tree!.relationName).toBe("orders");
    expect(tree!.severity).toBe("critical");
    expect(tree!.planRows).toBe(150000);
    expect(tree!.actualRows).toBe(148320);
    expect(tree!.actualTime).toBe(42.5);
    expect(tree!.filterCondition).toBe("(status = 'pending'::text)");
    expect(tree!.children).toHaveLength(0);
  });

  it("parses hash join with nested children", () => {
    const tree = buildExecutionTree(HASH_JOIN_FIXTURE);
    expect(tree).not.toBeNull();
    expect(tree!.nodeType).toBe("Hash Join");
    expect(tree!.joinType).toBe("Inner");
    expect(tree!.children).toHaveLength(2);

    const seqScan = tree!.children[0];
    expect(seqScan.nodeType).toBe("Seq Scan");
    expect(seqScan.relationName).toBe("orders");
    expect(seqScan.severity).toBe("critical");

    const hash = tree!.children[1];
    expect(hash.nodeType).toBe("Hash");
    expect(hash.children).toHaveLength(1);
    expect(hash.children[0].nodeType).toBe("Seq Scan");
    expect(hash.children[0].relationName).toBe("customers");
    expect(hash.children[0].severity).toBe("good");
  });

  it("parses index scan with good severity", () => {
    const tree = buildExecutionTree(INDEX_SCAN_FIXTURE);
    expect(tree).not.toBeNull();
    expect(tree!.nodeType).toBe("Index Scan");
    expect(tree!.indexName).toBe("products_category_idx");
    expect(tree!.severity).toBe("good");
    expect(tree!.totalCost).toBe(8.44);
    expect(tree!.children).toHaveLength(0);
  });

  it("assigns unique ids to all nodes", () => {
    const tree = buildExecutionTree(HASH_JOIN_FIXTURE);
    expect(tree).not.toBeNull();
    const ids = new Set<string>();
    const collect = (node: NonNullable<typeof tree>) => {
      ids.add(node.id);
      node.children.forEach(collect);
    };
    collect(tree!);
    expect(ids.size).toBe(4);
  });

  it("marks seq scan with >10k rows as warning", () => {
    const fixture = [
      {
        Plan: {
          "Node Type": "Seq Scan",
          "Relation Name": "products",
          "Startup Cost": 0.0,
          "Total Cost": 200.0,
          "Plan Rows": 50000,
          "Actual Rows": 50000,
          "Actual Total Time": 12.0,
        },
      },
    ];
    const tree = buildExecutionTree(fixture);
    expect(tree!.severity).toBe("warning");
  });

  it("marks high actualRows/planRows ratio as critical", () => {
    const fixture = [
      {
        Plan: {
          "Node Type": "Nested Loop",
          "Startup Cost": 0.5,
          "Total Cost": 100.0,
          "Plan Rows": 10,
          "Actual Rows": 150,
          "Actual Total Time": 50.0,
        },
      },
    ];
    const tree = buildExecutionTree(fixture);
    expect(tree!.severity).toBe("critical");
  });
});
