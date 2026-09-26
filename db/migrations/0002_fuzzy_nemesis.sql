CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate" text NOT NULL,
	"version" integer NOT NULL,
	"input_hash" text NOT NULL,
	"source" text NOT NULL,
	"reason" text,
	"verdict" jsonb NOT NULL,
	"answers" jsonb,
	"model" text,
	"usd_micros" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"learner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "decisions_gate_idx" ON "decisions" USING btree ("gate","created_at");--> statement-breakpoint
CREATE INDEX "decisions_learner_idx" ON "decisions" USING btree ("learner_id","created_at");