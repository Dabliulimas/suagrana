import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "@/utils/asyncHandler";
import { logger } from "@/utils/logger";

const router = Router();
const prisma = new PrismaClient();

// GET /api/contacts - Listar todos os contatos
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuário não autenticado" 
        });
      }

      const contacts = await prisma.contact.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      logger.info(`Contatos carregados: ${contacts.length}`, { userId });

      res.json({
        success: true,
        contacts: contacts.map(contact => ({
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        })),
      });
    } catch (error) {
      logger.error("Erro ao buscar contatos:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  })
);

// POST /api/contacts - Criar novo contato
router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      const { name, email, phone } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuário não autenticado" 
        });
      }

      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: "Nome e email são obrigatórios",
        });
      }

      // Verificar se já existe um contato com este email
      const existingContact = await prisma.contact.findFirst({
        where: { 
          userId,
          email 
        },
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: "Já existe um contato com este email",
        });
      }

      const contact = await prisma.contact.create({
        data: {
          name,
          email,
          phone: phone || null,
          userId,
        },
      });

      logger.info(`Contato criado: ${contact.name}`, { userId, contactId: contact.id });

      res.status(201).json({
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error("Erro ao criar contato:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  })
);

// PUT /api/contacts/:id - Atualizar contato
router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, email, phone } = req.body;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuário não autenticado" 
        });
      }

      // Verificar se o contato existe e pertence ao usuário
      const existingContact = await prisma.contact.findFirst({
        where: { 
          id,
          userId 
        },
      });

      if (!existingContact) {
        return res.status(404).json({
          success: false,
          message: "Contato não encontrado",
        });
      }

      // Se o email foi alterado, verificar se não existe outro contato com o mesmo email
      if (email && email !== existingContact.email) {
        const duplicateContact = await prisma.contact.findFirst({
          where: { 
            userId,
            email,
            id: { not: id }
          },
        });

        if (duplicateContact) {
          return res.status(400).json({
            success: false,
            message: "Já existe um contato com este email",
          });
        }
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone: phone || null }),
        },
      });

      logger.info(`Contato atualizado: ${contact.name}`, { userId, contactId: contact.id });

      res.json({
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          createdAt: contact.createdAt.toISOString(),
          updatedAt: contact.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      logger.error("Erro ao atualizar contato:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  })
);

// DELETE /api/contacts/:id - Deletar contato
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Usuário não autenticado" 
        });
      }

      // Verificar se o contato existe e pertence ao usuário
      const existingContact = await prisma.contact.findFirst({
        where: { 
          id,
          userId 
        },
      });

      if (!existingContact) {
        return res.status(404).json({
          success: false,
          message: "Contato não encontrado",
        });
      }

      await prisma.contact.delete({
        where: { id },
      });

      logger.info(`Contato deletado: ${existingContact.name}`, { userId, contactId: id });

      res.json({
        success: true,
        message: "Contato deletado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao deletar contato:", error);
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
      });
    }
  })
);

export default router;