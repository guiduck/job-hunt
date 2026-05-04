import type { JobStage, JobReviewStatus } from "../../api/types"

export const REVIEW_STATUSES: Array<JobReviewStatus | ""> = ["", "unreviewed", "reviewing", "saved", "ignored"]

export const JOB_STAGES: Array<JobStage | ""> = ["", "new", "saved", "applied", "responded", "interview", "rejected", "ignored"]
