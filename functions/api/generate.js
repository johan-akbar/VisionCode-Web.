export async function onRequestPost(context) {
  try {
    const apiKey = context.env.OPENAI_API_KEY;
    if (!apiKey) return json({ error: "Server is missing OPENAI_API_KEY. Add it in your hosting environment variables." }, 500);

    const body = await context.request.json();
    if (!Array.isArray(body.images) || body.images.length === 0) return json({ error: "Please upload an image or video." }, 400);
    if (body.images.length > 4) return json({ error: "Maximum 4 reference frames are allowed." }, 400);

    const content = [{
      type: "text",
      text: `Analyze the supplied website screenshot or video frames and recreate the visible interface as closely as possible. Return ONLY valid JSON with exactly these string fields: html, css, js. The html field must contain only body markup (no html/head/body wrapper). The css field must contain all styling. The js field must contain front-end interactions only. Use responsive design, semantic accessible HTML, and no external dependencies unless essential. Do not claim to reproduce backend functionality that is not visible. Additional user instructions: ${String(body.instructions || "None").slice(0, 2000)}`
    }];

    for (const image of body.images) {
      if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > 8_000_000) {
        return json({ error: "Invalid or oversized image frame. Please use a smaller image/video." }, 400);
      }
      content.push({ type: "image_url", image_url: { url: image, detail: "high" } });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: context.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "user", content }],
        response_format: { type: "json_object" },
        max_tokens: 7000
      })
    });

    const result = await response.json();
    if (!response.ok) {
      return json({ error: result?.error?.message || `OpenAI request failed (${response.status}). Check API billing and key permissions.` }, response.status);
    }
    const raw = result.choices?.[0]?.message?.content;
    if (!raw) return json({ error: "The AI returned an empty response. Please try again." }, 502);
    const parsed = JSON.parse(raw);
    return json({
      html: String(parsed.html || ""),
      css: String(parsed.css || ""),
      js: String(parsed.js || "")
    });
  } catch (error) {
    return json({ error: error.message || "Unexpected server error." }, 500);
  }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
