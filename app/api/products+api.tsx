import { auth } from "~/lib/auth";
import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

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

    const products = await prisma.product.findMany({
      where: {
        laundryManager: {
          userId: session.user.id,
        },
      },
      include: {
        laundryManager: true,
        orderItems: true,
      },
    });

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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

    const body = await request.json();
    const { name, description, price, stock } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Trouver le laundry manager de l'utilisateur
    const laundryManager = await prisma.laundryManager.findFirst({
      where: { userId: session.user.id },
    });

    if (!laundryManager) {
      return new Response(
        JSON.stringify({ error: "Manager de blanchisserie non trouvé" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        laundryManagerId: laundryManager.id,
      },
    });

    return new Response(JSON.stringify(product), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du produit:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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

    const body = await request.json();
    const { id, name, description, price, stock } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le produit appartient au manager connecté
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        laundryManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingProduct) {
      return new Response(JSON.stringify({ error: "Produit non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const product = await prisma.product.update({
      where: { id: id },
      data: {
        name,
        description,
        price,
        stock,
      },
    });

    return new Response(JSON.stringify(product), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du produit:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

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

    const body = await request.json();
    const { id } = body;

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que le produit appartient au manager connecté
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        laundryManager: {
          userId: session.user.id,
        },
      },
    });

    if (!existingProduct) {
      return new Response(JSON.stringify({ error: "Produit non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer le produit (les relations seront supprimées automatiquement grâce à onDelete: Cascade)
    await prisma.product.delete({
      where: { id: id },
    });

    return new Response(
      JSON.stringify({ message: "Produit supprimé avec succès" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du produit:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
