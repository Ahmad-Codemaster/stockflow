import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export class CategoryService {
  static async listCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      productCount: c._count.products,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  static async createCategory(
    data: { name: string; description?: string },
    userId: string,
    ipAddress?: string
  ) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new AppError('Category name is required.', 400, 'VALIDATION_ERROR');
    }

    const allCats = await prisma.category.findMany();
    const existing = allCats.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      throw new AppError('A category with this name already exists.', 409, 'DUPLICATE_CATEGORY');
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        description: data.description?.trim() || null,
      },
    });

    await AuditService.log({
      userId,
      action: 'CATEGORY_CREATE',
      entity: 'CATEGORY',
      entityId: category.id,
      details: { name: category.name },
      ipAddress,
    });

    return category;
  }

  static async updateCategory(
    id: string,
    data: { name?: string; description?: string },
    userId: string,
    ipAddress?: string
  ) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError('Category not found.', 404, 'NOT_FOUND');
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        throw new AppError('Category name cannot be empty.', 400, 'VALIDATION_ERROR');
      }

      if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
        const allCats = await prisma.category.findMany();
        const existing = allCats.find(
          c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== id
        );
        if (existing) {
          throw new AppError('A category with this name already exists.', 409, 'DUPLICATE_CATEGORY');
        }
      }
      updateData.name = trimmedName;
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      userId,
      action: 'CATEGORY_UPDATE',
      entity: 'CATEGORY',
      entityId: id,
      details: { changes: updateData },
      ipAddress,
    });

    return updated;
  }

  static async deleteCategory(id: string, userId: string, ipAddress?: string) {
    const activeProducts = await prisma.product.count({
      where: { categoryId: id, isArchived: false },
    });

    if (activeProducts > 0) {
      throw new AppError(
        `Cannot delete category. There are ${activeProducts} active product(s) associated with it.`,
        400,
        'CATEGORY_IN_USE'
      );
    }

    const category = await prisma.category.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'CATEGORY_DELETE',
      entity: 'CATEGORY',
      entityId: id,
      details: { name: category.name },
      ipAddress,
    });

    return { message: 'Category deleted successfully.' };
  }
}
