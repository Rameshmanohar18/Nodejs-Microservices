```js
8. JOBS Folder (QUEUES + WORKERS + CRON)
What it does: Background processing for slow tasks
Use Cases:

✅ Send emails (slow, 2 seconds)

✅ Generate PDFs (CPU intensive)

✅ Process image uploads

✅ Sync with external APIs

✅ Daily cleanup tasks




When to use Jobs:

Tasks taking >100ms ✅

Not needed for immediate response ✅

Can be retried if fails ✅

CPU or I/O intensive ✅

Example: Complete job for order processing
```
