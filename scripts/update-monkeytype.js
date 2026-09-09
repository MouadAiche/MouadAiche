const fs = require("fs");
const path = require("path");

const API_KEY = process.env.MONKEYTYPE_APE_KEY;

if (!API_KEY) {
  throw new Error("MONKEYTYPE_APE_KEY is missing");
}

const headers = {
  Authorization: `ApeKey ${API_KEY}`,
};

async function fetchJSON(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Monkeytype API error ${response.status}: ${text}`
    );
  }

  return response.json();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
}

function escapeXML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const pbResponse = await fetchJSON(
    "https://api.monkeytype.com/users/personalBests?mode=time&mode2=60"
  );

  const statsResponse = await fetchJSON(
    "https://api.monkeytype.com/users/stats"
  );

  const pbData = pbResponse.data;
  const stats = statsResponse.data;

  let personalBest;

  if (Array.isArray(pbData)) {
    personalBest = pbData.reduce((best, item) => {
      if (!best || Number(item.wpm) > Number(best.wpm)) {
        return item;
      }

      return best;
    }, null);
  } else {
    personalBest = pbData;
  }

  if (!personalBest) {
    throw new Error("No Monkeytype personal best found.");
  }

  const wpm = Math.round(Number(personalBest.wpm));

  const accuracy = Number(personalBest.acc).toFixed(1);

  const completedTests = Number(
    stats.completedTests
  ).toLocaleString("en-US");

  const typingTime = formatTime(
    Number(stats.timeTyping)
  );

  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="760"
  height="260"
  viewBox="0 0 760 260"
  role="img"
  aria-label="Monkeytype typing statistics"
>
  <style>
    .title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 23px;
      font-weight: 700;
      fill: #e2b714;
      letter-spacing: 1px;
    }

    .subtitle {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      fill: #646669;
    }

    .value {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 25px;
      font-weight: 700;
      fill: #d1d0c5;
    }

    .label {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      font-weight: 600;
      fill: #646669;
      letter-spacing: 1px;
    }

    .mode {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      font-weight: 600;
      fill: #e2b714;
      letter-spacing: 1px;
    }
  </style>

  <!-- Card -->
  <rect
    x="1"
    y="1"
    width="758"
    height="258"
    rx="12"
    fill="#323437"
    stroke="#45474b"
    stroke-width="2"
  />

  <!-- Header icon -->
  <rect
    x="32"
    y="31"
    width="36"
    height="27"
    rx="4"
    fill="#e2b714"
  />

  <rect x="38" y="37" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="45" y="37" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="52" y="37" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="59" y="37" width="4" height="4" rx="1" fill="#323437"/>

  <rect x="38" y="44" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="45" y="44" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="52" y="44" width="4" height="4" rx="1" fill="#323437"/>
  <rect x="59" y="44" width="4" height="4" rx="1" fill="#323437"/>

  <rect
    x="42"
    y="51"
    width="18"
    height="3"
    rx="1.5"
    fill="#323437"
  />

  <!-- Header -->
  <text x="82" y="47" class="title">
    MONKEYTYPE
  </text>

  <text x="82" y="66" class="subtitle">
    typing statistics
  </text>

  <!-- Separator -->
  <line
    x1="32"
    y1="91"
    x2="728"
    y2="91"
    stroke="#45474b"
  />

  <!-- WPM -->
  <text
    x="105"
    y="145"
    text-anchor="middle"
    class="value"
  >
    ${escapeXML(wpm)} WPM
  </text>

  <text
    x="105"
    y="170"
    text-anchor="middle"
    class="label"
  >
    PERSONAL BEST
  </text>

  <!-- Accuracy -->
  <text
    x="287"
    y="145"
    text-anchor="middle"
    class="value"
  >
    ${escapeXML(accuracy)}%
  </text>

  <text
    x="287"
    y="170"
    text-anchor="middle"
    class="label"
  >
    ACCURACY
  </text>

  <!-- Tests -->
  <text
    x="470"
    y="145"
    text-anchor="middle"
    class="value"
  >
    ${escapeXML(completedTests)}
  </text>

  <text
    x="470"
    y="170"
    text-anchor="middle"
    class="label"
  >
    TESTS
  </text>

  <!-- Time -->
  <text
    x="653"
    y="145"
    text-anchor="middle"
    class="value"
  >
    ${escapeXML(typingTime)}
  </text>

  <text
    x="653"
    y="170"
    text-anchor="middle"
    class="label"
  >
    TYPING TIME
  </text>

  <!-- Bottom line -->
  <line
    x1="32"
    y1="201"
    x2="728"
    y2="201"
    stroke="#45474b"
  />

  <!-- Mode -->
  <text
    x="728"
    y="228"
    text-anchor="end"
    class="mode"
  >
    TIME • 60 SECONDS
  </text>
</svg>
`.trim();

  const outputDirectory = path.join(
    process.cwd(),
    "assets"
  );

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, {
      recursive: true,
    });
  }

  const outputPath = path.join(
    outputDirectory,
    "monkeytype-stats.svg"
  );

  fs.writeFileSync(outputPath, svg);

  console.log("Monkeytype card generated successfully.");
  console.log(`WPM: ${wpm}`);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`Tests: ${completedTests}`);
  console.log(`Typing time: ${typingTime}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
