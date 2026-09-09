import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { buildings, floors } from "./src/lib/db/schema";

const standardFloors = [
  { en: "Ground Floor", bn: "নিচতলা" },
  { en: "1st Floor", bn: "১ম তলা" },
  { en: "2nd Floor", bn: "২য় তলা" },
  { en: "3rd Floor", bn: "৩য় তলা" },
  { en: "4th Floor", bn: "৪র্থ তলা" },
  { en: "5th Floor", bn: "৫ম তলা" },
  { en: "6th Floor", bn: "৬ষ্ঠ তলা" },
  { en: "7th Floor", bn: "৭ম তলা" },
  { en: "8th Floor", bn: "৮ম তলা" },
];

async function main() {
  const allBuildings = await db.query.buildings.findMany({
    with: { floors: true }
  });

  let totalInserted = 0;

  for (const b of allBuildings) {
    if (b.floors.length === 0) {
      console.log(`Adding floors to building: ${b.nameEn}`);
      const floorsToInsert = standardFloors.map((f, i) => ({
        buildingId: b.id,
        nameEn: f.en,
        nameBn: f.bn,
        sequenceOrder: i + 1
      }));
      await db.insert(floors).values(floorsToInsert);
      totalInserted++;
    }
  }

  console.log(`Backfill complete. Updated ${totalInserted} buildings.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
