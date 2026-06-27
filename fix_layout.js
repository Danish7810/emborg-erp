const fs = require("fs");
let content = fs.readFileSync("app/dashboard/layout.tsx", "utf8");

// Fix the closing: wrap the whole return in a fragment
content = content.replace(
  `      </main>
    </div>
      <ChatWidget />
    </div>
  );
}`,
  `      </main>
      <ChatWidget />
    </div>
  );
}`
);

fs.writeFileSync("app/dashboard/layout.tsx", content, "utf8");
console.log("Fixed. Last 10 lines:");
const lines = content.split("\n");
console.log(lines.slice(-10).join("\n"));
