import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les matériaux d'une session de maintenance
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier si l'utilisateur a accès au pôle maintenance
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Accès au pôle maintenance requis" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "ID de la session requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la session appartient au manager
    const maintenanceSession = await prisma.maintenanceSession.findFirst({
      where: {
        id: sessionId,
        managerId: manager.id,
      },
    });

    if (!maintenanceSession) {
      return new Response(
        JSON.stringify({ error: "Session non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const materials = await prisma.maintenanceMaterial.findMany({
      where: {
        maintenanceSessionId: sessionId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return new Response(JSON.stringify(materials), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des matériaux:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Ajouter un matériau à une session de maintenance
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      name,
      quantity,
      unit,
      unitPrice,
      supplier,
      maintenanceSessionId,
    } = body;

    // Validation des données obligatoires
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le nom du matériau est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return new Response(
        JSON.stringify({ error: "La quantité doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!unit || typeof unit !== "string" || unit.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "L'unité est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!unitPrice || typeof unitPrice !== "number" || unitPrice <= 0) {
      return new Response(
        JSON.stringify({ error: "Le prix unitaire doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!maintenanceSessionId || typeof maintenanceSessionId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID de la session est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la session existe et appartient au manager
    const maintenanceSession = await prisma.maintenanceSession.findFirst({
      where: {
        id: maintenanceSessionId,
        managerId: manager.id,
      },
    });

    if (!maintenanceSession) {
      return new Response(
        JSON.stringify({ error: "Session non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculer le prix total
    const totalPrice = quantity * unitPrice;

    // Créer le matériau et mettre à jour les coûts de la session en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le matériau
      const material = await tx.maintenanceMaterial.create({
        data: {
          name: name.trim(),
          quantity,
          unit: unit.trim(),
          unitPrice,
          totalPrice,
          supplier: supplier?.trim(),
          maintenanceSessionId,
        },
      });

      // Mettre à jour les coûts de la session
      const updatedMaterialsCost = (maintenanceSession.materialsCost || 0) + totalPrice;
      const updatedTotalCost = (maintenanceSession.laborCost || 0) + updatedMaterialsCost;

      await tx.maintenanceSession.update({
        where: { id: maintenanceSessionId },
        data: {
          materialsCost: updatedMaterialsCost,
          totalCost: updatedTotalCost,
        },
      });

      return material;
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du matériau:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un matériau
export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID du matériau requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();

    // Vérifier que le matériau existe et que la session appartient au manager
    const existingMaterial = await prisma.maintenanceMaterial.findFirst({
      where: { id },
      include: {
        maintenanceSession: true,
      },
    });

    if (!existingMaterial || existingMaterial.maintenanceSession.managerId !== manager.id) {
      return new Response(
        JSON.stringify({ error: "Matériau non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unit !== undefined) updateData.unit = body.unit.trim();
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
    if (body.supplier !== undefined) updateData.supplier = body.supplier?.trim();

    // Recalculer le prix total si nécessaire
    const newQuantity = body.quantity !== undefined ? body.quantity : existingMaterial.quantity;
    const newUnitPrice = body.unitPrice !== undefined ? body.unitPrice : existingMaterial.unitPrice;
    const newTotalPrice = newQuantity * newUnitPrice;
    updateData.totalPrice = newTotalPrice;

    // Mettre à jour le matériau et les coûts de la session en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour le matériau
      const material = await tx.maintenanceMaterial.update({
        where: { id },
        data: updateData,
      });

      // Recalculer les coûts totaux des matériaux pour la session
      const allMaterials = await tx.maintenanceMaterial.findMany({
        where: { maintenanceSessionId: existingMaterial.maintenanceSessionId },
      });

      const totalMaterialsCost = allMaterials.reduce((sum, mat) => {
        if (mat.id === id) {
          return sum + newTotalPrice; // Utiliser le nouveau prix
        }
        return sum + mat.totalPrice;
      }, 0);

      const session = existingMaterial.maintenanceSession;
      const updatedTotalCost = (session.laborCost || 0) + totalMaterialsCost;

      await tx.maintenanceSession.update({
        where: { id: existingMaterial.maintenanceSessionId },
        data: {
          materialsCost: totalMaterialsCost,
          totalCost: updatedTotalCost,
        },
      });

      return material;
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du matériau:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un matériau
export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier les permissions
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "maintenance"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(
        JSON.stringify({ error: "ID du matériau requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le matériau existe et que la session appartient au manager
    const existingMaterial = await prisma.maintenanceMaterial.findFirst({
      where: { id },
      include: {
        maintenanceSession: true,
      },
    });

    if (!existingMaterial || existingMaterial.maintenanceSession.managerId !== manager.id) {
      return new Response(
        JSON.stringify({ error: "Matériau non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Supprimer le matériau et mettre à jour les coûts de la session en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer le matériau
      await tx.maintenanceMaterial.delete({
        where: { id },
      });

      // Recalculer les coûts totaux des matériaux pour la session
      const remainingMaterials = await tx.maintenanceMaterial.findMany({
        where: { maintenanceSessionId: existingMaterial.maintenanceSessionId },
      });

      const totalMaterialsCost = remainingMaterials.reduce((sum, mat) => sum + mat.totalPrice, 0);
      const session = existingMaterial.maintenanceSession;
      const updatedTotalCost = (session.laborCost || 0) + totalMaterialsCost;

      await tx.maintenanceSession.update({
        where: { id: existingMaterial.maintenanceSessionId },
        data: {
          materialsCost: totalMaterialsCost,
          totalCost: updatedTotalCost,
        },
      });
    });

    return new Response(
      JSON.stringify({ message: "Matériau supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du matériau:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}