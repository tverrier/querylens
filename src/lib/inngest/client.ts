import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "querylens" });

export type Events = {
  "analyze/query.submitted": {
    data: { analysisId: string; userId: string; rawSql: string };
  };
};
