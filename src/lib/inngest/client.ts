import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "querylens" });

export type Events = {
  "query/analyze.requested": {
    data: { analysisId: string; userId: string; rawSql: string };
  };
};
