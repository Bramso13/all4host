import { auth } from "~/lib/auth";
import { PrismaClient } from "~/prisma/generated/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

// GET - Récupérer toutes les factures de blanchisserie
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

    // Vérifier si l'utilisateur a accès au pôle blanchisserie avec permission facturation
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageBilling: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes pour gérer la facturation" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    const status = url.searchParams.get('status');

    const whereClause: any = {};

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (status) {
      whereClause.status = status;
    }

    const invoices = await prisma.laundryInvoice.findMany({
      where: whereClause,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new Response(JSON.stringify(invoices), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// POST - Créer une nouvelle facture de blanchisserie
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

    // Vérifier les permissions pour créer des factures
    const manager = await prisma.poleManagerProfile.findFirst({
      where: {
        userId: session.user.id,
        poleTypes: {
          has: "laundry"
        },
        canManageBilling: true,
      },
    });

    if (!manager) {
      return new Response(
        JSON.stringify({ error: "Permissions insuffisantes pour gérer la facturation" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const {
      clientId,
      subtotal,
      taxRate,
      issueDate,
      dueDate,
      notes,
      status,
    } = body;

    // Validation des données obligatoires
    if (!clientId || typeof clientId !== "string") {
      return new Response(
        JSON.stringify({ error: "L'ID du client est obligatoire" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof subtotal !== "number" || subtotal <= 0) {
      return new Response(
        JSON.stringify({ error: "Le sous-total doit être un nombre positif" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que le client existe
    const client = await prisma.laundryClientProfile.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return new Response(
        JSON.stringify({ error: "Client non trouvé" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Générer un numéro de facture unique
    const invoiceCount = await prisma.laundryInvoice.count();
    const invoiceNumber = `INV-LAU-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculer les montants
    const finalTaxRate = taxRate || 20;
    const taxAmount = (subtotal * finalTaxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.laundryInvoice.create({
      data: {
        invoiceNumber,
        status: status || "draft",
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        subtotal,
        taxRate: finalTaxRate,
        taxAmount,
        totalAmount,
        paidAmount: 0,
        clientId,
        notes: notes?.trim(),
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(invoice), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la facture:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// PUT - Mettre à jour une facture de blanchisserie
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
        canManageBilling: true,
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
      id,
      subtotal,
      taxRate,
      issueDate,
      dueDate,
      notes,
      status,
      paidAmount,
    } = body;

    if (!id || typeof id !== "string") {
      return new Response(
        JSON.stringify({ error: "ID de la facture requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Récupérer la facture existante
    const existingInvoice = await prisma.laundryInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return new Response(
        JSON.stringify({ error: "Facture non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updateData: any = {};

    // Recalculer les montants si le sous-total ou le taux de taxe change
    if (subtotal !== undefined || taxRate !== undefined) {
      const newSubtotal = subtotal !== undefined ? subtotal : existingInvoice.subtotal;
      const newTaxRate = taxRate !== undefined ? taxRate : existingInvoice.taxRate;
      const newTaxAmount = (newSubtotal * newTaxRate) / 100;
      const newTotalAmount = newSubtotal + newTaxAmount;

      updateData.subtotal = newSubtotal;
      updateData.taxRate = newTaxRate;
      updateData.taxAmount = newTaxAmount;
      updateData.totalAmount = newTotalAmount;
    }

    if (issueDate !== undefined) updateData.issueDate = new Date(issueDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes?.trim();
    if (status !== undefined) updateData.status = status;

    // Gérer les paiements
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
      
      const finalTotalAmount = updateData.totalAmount || existingInvoice.totalAmount;
      
      // Si entièrement payé, marquer comme payé
      if (paidAmount >= finalTotalAmount) {
        updateData.status = "paid";
        updateData.paidAt = new Date();
      } else if (updateData.status === "paid") {
        // Si le statut était payé mais le montant payé est insuffisant, repasser en brouillon
        updateData.status = "draft";
        updateData.paidAt = null;
      }
    }

    const invoice = await prisma.laundryInvoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return new Response(JSON.stringify(invoice), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// DELETE - Supprimer une facture de blanchisserie
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
        canManageBilling: true,
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
        JSON.stringify({ error: "ID de la facture requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la facture existe
    const existingInvoice = await prisma.laundryInvoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return new Response(
        JSON.stringify({ error: "Facture non trouvée" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Ne permettre la suppression que si la facture n'est pas payée
    if (existingInvoice.status === "paid" || existingInvoice.paidAmount > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Impossible de supprimer une facture payée" 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await prisma.laundryInvoice.delete({
      where: { id },
    });

    return new Response(
      JSON.stringify({ message: "Facture supprimée avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la facture:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}