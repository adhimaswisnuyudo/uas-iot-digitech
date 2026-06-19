import { prisma } from "../lib/db";

async function main() {
  const rows = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name
  `;
  console.log("Runtime Prisma OK:", rows.map((row) => row.name).join(", "));

  const testId = `runtime-test-${Date.now()}`;
  await prisma.submitAttempt.create({ data: { id: testId, ip: "runtime-test" } });
  await prisma.submitAttempt.delete({ where: { id: testId } });
  console.log("Runtime Prisma write test: OK");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Runtime Prisma GAGAL:");
  console.error(error);
  process.exit(1);
});
