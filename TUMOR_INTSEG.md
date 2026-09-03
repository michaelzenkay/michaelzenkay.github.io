# Interactive tumor segmentation test page

`tumor-intseg.html` is an isolated, unlinked development harness for the seeded
breast MRI segmentation experiment. It intentionally does not modify
`tumor-seg-demo.html` or add a link from the portfolio home page.

The page:

- stores the selected inference endpoint in browser-local storage;
- checks `<endpoint>/health` and reports browser-to-backend round-trip time;
- embeds the existing tumor viewer with its `api` query parameter set; and
- is marked `noindex, nofollow` while it is experimental.

For local testing, start the inference API on `127.0.0.1:8080` and open the page
through a local static HTTP server. For remote testing, enter the stable HTTPS
hostname assigned to the Cloudflare Tunnel.

This harness currently exercises the existing viewer API contract. The next
implementation step is to replace that upload-session contract with the smaller
fixed-case request (`case_id` plus seed coordinates) after the GPU inference
endpoint is working locally.
