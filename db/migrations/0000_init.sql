CREATE TABLE "experience_runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"learner_id" uuid NOT NULL,
	"parent_id" uuid,
	"experience" text NOT NULL,
	"engine_version" integer NOT NULL,
	"config" jsonb NOT NULL,
	"seed" text NOT NULL,
	"actions" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learners_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "learning_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"run_id" uuid,
	"type" text NOT NULL,
	"skill" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experience_runs" ADD CONSTRAINT "experience_runs_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_events" ADD CONSTRAINT "learning_events_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "experience_runs_learner_idx" ON "experience_runs" USING btree ("learner_id","created_at");--> statement-breakpoint
CREATE INDEX "learning_events_learner_idx" ON "learning_events" USING btree ("learner_id","created_at");--> statement-breakpoint
CREATE INDEX "learning_events_type_idx" ON "learning_events" USING btree ("type","created_at");