import { describe, expect, it } from "vitest";
import { deliveryBatchStatus } from "@/lib/freelance/constants";

describe("deliveryBatchStatus", () => {
  it.each([
    [{ sentCount: 1, failedSendCount: 0 }, "sent"],
    [{ sentCount: 1, failedSendCount: 1 }, "partially_sent"],
    [{ sentCount: 0, failedSendCount: 1 }, "failed"],
    [{ sentCount: 0, failedSendCount: 0 }, "approved"]
  ] as const)("maps %o to %s", (counters, expected) => {
    expect(deliveryBatchStatus(counters)).toBe(expected);
  });
});
