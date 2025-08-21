import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer tous les produits de blanchisserie
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

    // Vérifier si l'utilisateur a accès au pôle blanchisserie
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Accès au pôle blanchisserie requis" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const products = await prisma.laundryProduct.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
    });

    return new Response(JSON.stringify(products), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer un nouveau produit de blanchisserie
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

    // Vérifier les permissions pour créer des produits
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageClients: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes pour gérer les produits" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { name, description, price, stock, category, isActive } = body;

    // Validation des données
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Le nom du produit est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!description || typeof description !== "string") {
      return new Response(
        JSON.stringify({ error: "La description du produit est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof price !== "number" || price <= 0) {
      return new Response(
        JSON.stringify({ error: "Le prix doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const product = await prisma.laundryProduct.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price,
        stock: stock || 0,
        category: category?.trim(),
        isActive: isActive ?? true,
      },
    });

    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du produit:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour un produit de blanchisserie
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
          has: "laundry"
        },
        canManageClients: true,
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
    const { id, name, description, price, stock, category, isActive } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID du produit requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le produit existe
    const existingProduct = await prisma.laundryProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return new Response(
        JSON.stringify({ error: "Produit non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {};
    
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Le nom du produit ne peut pas être vide" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return new Response(
          JSON.stringify({ error: "La description doit être une chaîne" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.description = description.trim();
    }

    if (price !== undefined) {
      if (typeof price !== "number" || price <= 0) {
        return new Response(
          JSON.stringify({ error: "Le prix doit être un nombre positif" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.price = price;
    }

    if (stock !== undefined) updateData.stock = stock;
    if (category !== undefined) updateData.category = category?.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const product = await prisma.laundryProduct.update({
      where: { id },
      data: updateData,
    });

    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer un produit de blanchisserie (soft delete)
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
          has: "laundry"
        },
        canManageClients: true,
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
    const { id } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID du produit requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le produit existe
    const existingProduct = await prisma.laundryProduct.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return new Response(
        JSON.stringify({ error: "Produit non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier s'il y a des commandes en cours avec ce produit
    const activeOrderItems = await prisma.laundryOrderItem.findMany({
      where: {
        productId: id,
        order: {
          status: {
            notIn: ["completed", "cancelled"]
          }
        }
      }
    });

    if (activeOrderItems.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Impossible de supprimer un produit utilisé dans des commandes actives"
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Soft delete - marquer comme inactif
    await prisma.laundryProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return new Response(
      JSON.stringify({ message: "Produit supprimé avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du produit:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}