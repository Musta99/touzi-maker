import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { floors } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

const floorMap: Record<string, string> = {
  "Ground Floor": "নিচ তলা",
  "1st Floor":    "দ্বিতীয় তলা",
  "2nd Floor":    "তৃতীয় তলা",
  "3rd Floor":    "চতুর্থ তলা",
  "4th Floor":    "পঞ্চম তলা",
  "5th Floor":    "ষষ্ঠ তলা",
  "6th Floor":    "সপ্তম তলা",
  "7th Floor":    "অষ্টম তলা",
  "8th Floor":    "নবম তলা",
};

async function main() {
  console.log("Updating Bengali floor names...");
  let updated = 0;

  for (const [nameEn, nameBn] of Object.entries(floorMap)) {
    const result = await db.update(floors)
      .set({ nameBn })
      .where(eq(floors.nameEn, nameEn));
    console.log(`  ✓ ${nameEn} → ${nameBn}`);
    updated++;
  }

  console.log(`\nDone! Updated ${updated} floor name patterns.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
