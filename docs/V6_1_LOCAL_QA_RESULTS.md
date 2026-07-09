# V6.1 Local QA Results

```text
$ node scripts/run-intelligence-core.js
{"level":"info","message":"Decision Intelligence Engine started.","time":"2026-07-09T21:17:49.726Z"}
{"level":"info","message":"Decision Intelligence Engine completed.","raw":3,"active":3,"alerts":2,"incidents":1,"time":"2026-07-09T21:17:49.740Z"}
```

```text
$ node scripts/build-environmental-intelligence.js
{"level":"info","message":"Environmental Intelligence build started.","time":"2026-07-09T21:17:49.808Z"}
{"level":"info","message":"Environmental Intelligence build completed.","weatherRegions":3,"riverEvents":2,"time":"2026-07-09T21:17:49.821Z"}
```

```text
$ node scripts/build-journey-intelligence.js
{"level":"info","message":"Journey Intelligence build started.","time":"2026-07-09T21:17:49.889Z"}
{"level":"info","message":"Journey Intelligence build completed.","journeys":3,"time":"2026-07-09T21:17:49.899Z"}
```

```text
$ node scripts/build-live-intelligence.js
```

```text
$ node scripts/builders/build-status.js
```

```text
$ node scripts/validation/validate-build.js
{"level":"info","message":"Valid JSON","file":"data/intelligence.json","time":"2026-07-09T21:17:50.071Z"}
{"level":"info","message":"Valid JSON","file":"data/alerts.json","time":"2026-07-09T21:17:50.077Z"}
{"level":"info","message":"Valid JSON","file":"data/incidents.json","time":"2026-07-09T21:17:50.078Z"}
{"level":"info","message":"Valid JSON","file":"data/weather.json","time":"2026-07-09T21:17:50.078Z"}
{"level":"info","message":"Valid JSON","file":"data/journey-context.json","time":"2026-07-09T21:17:50.079Z"}
{"level":"info","message":"Valid JSON","file":"data/source-health.json","time":"2026-07-09T21:17:50.079Z"}
{"level":"info","message":"Valid JSON","file":"data/build-status.json","time":"2026-07-09T21:17:50.079Z"}
{"level":"info","message":"Valid JSON","file":"data/environmental-context.json","time":"2026-07-09T21:17:50.080Z"}
{"level":"info","message":"Valid JSON","file":"data/journey-intelligence.json","time":"2026-07-09T21:17:50.080Z"}
{"level":"info","message":"Milestone C validation complete.","time":"2026-07-09T21:17:50.083Z"}
```

```text
$ node tests/run-tests.js
Intelligence core tests passed.
Environmental intelligence tests passed.
Journey intelligence tests passed.
Milestone C tests passed.
```