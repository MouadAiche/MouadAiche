const fs = require("fs");

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
    throw new Error(`Monkeytype API error ${response.status}: ${text}`);
  }

  return response.json();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}h ${minutes}m`;
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
      if (!best || item.wpm > best.wpm) {
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

  const wpm = Math.round(personalBest.wpm);
  const accuracy = Number(personalBest.acc).toFixed(1);

  const completedTests =
    Number(stats.completedTests).toLocaleString("en-US");

  const typingTime = formatTime(Number(stats.timeTyping));

  const monkeytypeSection = `<!-- MONKEYTYPE:START -->
⚡ **Personal Best:** ${wpm} WPM  
🎯 **Accuracy:** ${accuracy}%  
🔥 **Tests Completed:** ${completedTests}  
⏱️ **Time Typing:** ${typingTime}
<!-- MONKEYTYPE:END -->`;

  const readmePath = "README.md";
  const readme = fs.readFileSync(readmePath, "utf8");

  const updatedReadme = readme.replace(
    /<!-- MONKEYTYPE:START -->[\s\S]*?<!-- MONKEYTYPE:END -->/,
    monkeytypeSection
  );

  fs.writeFileSync(readmePath, updatedReadme);

  console.log("Monkeytype stats updated");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
