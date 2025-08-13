// import { auth } from "~/lib/auth";
// import { PrismaClient } from "~/prisma/generated/client/edge";
// import { withAccelerate } from "@prisma/extension-accelerate";

// export async function GET(request: Request) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers });
//     if (!session?.user?.id) {
//       return new Response(JSON.stringify({ error: "Non autorisé" }), {
//         status: 401,
//       });
//     }
//     const prisma = new PrismaClient({
//       datasourceUrl: process.env.DATABASE_URL,
//     }).$extends(withAccelerate());
//     const cleaningManager = await prisma.cleaningManager.findFirst({
//       where: { userId: session.user.id },
//       include: {
//         interventionSites: true,
//         siteCleaningSessions: true,
//         cleaningAgents: true,
//         cleaningPlannings: true,
//       },
//     });
//     if (!cleaningManager) {
//       return new Response(JSON.stringify(null), { status: 200 });
//     }
//     return new Response(JSON.stringify(cleaningManager), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Erreur serveur" }), {
//       status: 500,
//     });
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers });
//     if (!session?.user?.id) {
//       return new Response(JSON.stringify({ error: "Non autorisé" }), {
//         status: 401,
//       });
//     }
//     const prisma = new PrismaClient({
//       datasourceUrl: process.env.DATABASE_URL,
//     }).$extends(withAccelerate());
//     const body = await request.json();
//     const cleaningManager = await prisma.cleaningManager.create({
//       data: {
//         userId: session.user.id,
//         ...body,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });
//     return new Response(JSON.stringify(cleaningManager), { status: 201 });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Erreur serveur" }), {
//       status: 500,
//     });
//   }
// }

// export async function PUT(request: Request) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers });
//     if (!session?.user?.id) {
//       return new Response(JSON.stringify({ error: "Non autorisé" }), {
//         status: 401,
//       });
//     }
//     const prisma = new PrismaClient({
//       datasourceUrl: process.env.DATABASE_URL,
//     }).$extends(withAccelerate());
//     const body = await request.json();
//     // Récupérer le cleaningManager du user courant
//     const cleaningManager = await prisma.cleaningManager.findFirst({
//       where: { userId: session.user.id },
//     });
//     if (!cleaningManager) {
//       return new Response(
//         JSON.stringify({ error: "Aucun cleaningManager à mettre à jour" }),
//         { status: 404 }
//       );
//     }
//     const updated = await prisma.cleaningManager.update({
//       where: { id: cleaningManager.id },
//       data: { ...body, updatedAt: new Date() },
//     });
//     return new Response(JSON.stringify(updated), { status: 200 });
//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Erreur serveur" }), {
//       status: 500,
//     });
//   }
// }

// export async function DELETE(request: Request) {
//   try {
//     const session = await auth.api.getSession({ headers: request.headers });
//     if (!session?.user?.id) {
//       return new Response(JSON.stringify({ error: "Non autorisé" }), {
//         status: 401,
//       });
//     }
//     const prisma = new PrismaClient({
//       datasourceUrl: process.env.DATABASE_URL,
//     }).$extends(withAccelerate());
//     await prisma.cleaningManager.deleteMany({
//       where: { userId: session.user.id },
//     });
//     return new Response(
//       JSON.stringify({ message: "CleaningManager supprimé" }),
//       { status: 200 }
//     );
//   } catch (error) {
//     return new Response(JSON.stringify({ error: "Erreur serveur" }), {
//       status: 500,
//     });
//   }
// }
