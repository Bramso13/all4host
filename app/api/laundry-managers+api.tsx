import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
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

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // Si un userId est spécifié, récupérer le manager pour cet utilisateur
    if (userId) {
      // Vérifier que l'utilisateur demande ses propres informations ou a les permissions
      if (userId !== session.user.id) {
        // Vérifier si l'utilisateur est un super admin
        const superAdmin = await prisma.superAdminProfile.findFirst({
          where: { userId: session.user.id },
        });

        if (!superAdmin) {
          return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      const manager = await prisma.poleManagerProfile.findFirst({
        where: {
          userId: userId,
          poleTypes: {
            has: "laundry"
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
            },
          },
          superAdmin: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },
      });

      if (!manager) {
        return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(manager), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sinon, récupérer tous les managers du pôle blanchisserie (pour super admin)
    const superAdmin = await prisma.superAdminProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!superAdmin) {
      return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const managers = await prisma.poleManagerProfile.findMany({
      where: {
        superAdminId: superAdmin.id,
        poleTypes: {
          has: "laundry"
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new Response(JSON.stringify(managers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des managers:", error);
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que l'utilisateur est un super admin
    const superAdmin = await prisma.superAdminProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!superAdmin) {
      return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();

    // Vérifier que le pôle blanchisserie est actif
    const poleSubscription = await prisma.poleSubscription.findFirst({
      where: {
        superAdminId: superAdmin.id,
        poleType: "laundry",
        status: "active",
      },
    });

    if (!poleSubscription) {
      return new Response(JSON.stringify({ 
        error: "Le pôle blanchisserie n'est pas actif pour cette entreprise" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Créer d'abord l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: "pole_manager",
        status: "active",
        emailVerified: true,
      },
    });

    // Créer le profil manager
    const manager = await prisma.poleManagerProfile.create({
      data: {
        userId: user.id,
        poleTypes: ["laundry"],
        canViewAnalytics: data.canViewAnalytics ?? true,
        canManageAgents: data.canManageAgents ?? true,
        canManageClients: data.canManageClients ?? true,
        canManageBilling: data.canManageBilling ?? false,
        superAdminId: superAdmin.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(manager), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création du manager:", error);
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await request.json();

    // Récupérer le manager existant
    const existingManager = await prisma.poleManagerProfile.findFirst({
      where: { 
        id,
        poleTypes: {
          has: "laundry"
        },
      },
      include: {
        user: true,
        superAdmin: true,
      },
    });

    if (!existingManager) {
      return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier les permissions (super admin ou le manager lui-même)
    const isSuperAdmin = existingManager.superAdmin.userId === session.user.id;
    const isOwnProfile = existingManager.userId === session.user.id;

    if (!isSuperAdmin && !isOwnProfile) {
      return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mettre à jour l'utilisateur si nécessaire
    if (data.user && (isSuperAdmin || (isOwnProfile && !data.user.status))) {
      await prisma.user.update({
        where: { id: existingManager.userId },
        data: {
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          // Seul le super admin peut changer le statut
          ...(isSuperAdmin && data.user.status && { status: data.user.status }),
        },
      });
    }

    // Mettre à jour le profil manager (seul le super admin peut changer les permissions)
    const updateData: any = {};
    
    if (isSuperAdmin) {
      updateData.canViewAnalytics = data.canViewAnalytics;
      updateData.canManageAgents = data.canManageAgents;
      updateData.canManageClients = data.canManageClients;
      updateData.canManageBilling = data.canManageBilling;
    }

    const manager = await prisma.poleManagerProfile.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        },
      },
    });

    return new Response(JSON.stringify(manager), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du manager:", error);
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

    const prisma = new PrismaClient({
      datasourceUrl: process.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // Vérifier que l'utilisateur est un super admin
    const superAdmin = await prisma.superAdminProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!superAdmin) {
      return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: "ID manquant" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Récupérer le manager
    const existingManager = await prisma.poleManagerProfile.findFirst({
      where: { 
        id,
        superAdminId: superAdmin.id,
        poleTypes: {
          has: "laundry"
        },
      },
    });

    if (!existingManager) {
      return new Response(JSON.stringify({ error: "Manager non trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Vérifier s'il y a des commandes actives gérées par ce manager
    const activeOrders = await prisma.laundryOrder.findMany({
      where: {
        managerId: id,
        status: {
          notIn: ["completed", "cancelled"]
        }
      }
    });

    if (activeOrders.length > 0) {
      return new Response(JSON.stringify({ 
        error: "Impossible de supprimer un manager avec des commandes actives" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Supprimer le profil manager
    await prisma.poleManagerProfile.delete({
      where: { id },
    });

    // Marquer l'utilisateur comme inactif
    await prisma.user.update({
      where: { id: existingManager.userId },
      data: { 
        status: "inactive",
        deletedAt: new Date()
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du manager:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}