/**
 * Generates server-rendered error pages in Link Vault's dark style
 * (black background, white text, red #ee3a18 accent, Inter font).
 *
 * @param {object} options
 * @param {number} options.statusCode
 * @param {string} options.title
 * @param {string} options.message
 * @returns {string} HTML string
 */
function renderErrorPage({ statusCode, title, message }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${statusCode} - ${title} | Link Vault</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #000;
      --fg: #fff;
      --mut: #8b8b8b;
      --line: #1d1d1d;
      --red: #ee3a18;
      --coral: #f26b7d;
      color-scheme: dark;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      font-family: Inter, system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(238, 58, 24, 0.12);
      border: 1px solid rgba(238, 58, 24, 0.3);
      color: var(--red);
      font-size: 13px;
      font-weight: 600;
      border-radius: 999px;
      margin-bottom: 20px;
      letter-spacing: 0.05em;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(32px, 6vw, 56px);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 1.1;
    }
    p {
      margin: 0 0 32px;
      color: var(--mut);
      font-size: 16px;
      max-width: 440px;
      line-height: 1.5;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      background: var(--red);
      color: #120d0b;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 999px;
      transition: filter 0.2s, transform 0.1s;
    }
    .btn:hover {
      filter: brightness(1.15);
    }
    .btn:active {
      transform: scale(0.98);
    }
  </style>
</head>
<body>
  <div class="badge">HTTP ${statusCode}</div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a class="btn" href="/">Back to Link Vault</a>
</body>
</html>`;
}

module.exports = renderErrorPage;
