import prisma from '../db';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './auditService';

export class SupplierService {
  static async listSuppliers() {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers.map(s => ({
      id: s.id,
      name: s.name,
      contactPerson: s.contactPerson,
      email: s.email,
      phone: s.phone,
      address: s.address,
      leadTime: s.leadTime,
      productCount: s._count.products,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  static async createSupplier(
    data: {
      name: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      leadTime?: number;
    },
    userId: string,
    ipAddress?: string
  ) {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new AppError('Supplier name is required.', 400, 'VALIDATION_ERROR');
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: trimmedName,
        contactPerson: data.contactPerson?.trim() || '',
        email: data.email?.trim() || '',
        phone: data.phone?.trim() || '',
        address: data.address?.trim() || '',
        leadTime: Number(data.leadTime) || 0,
      },
    });

    await AuditService.log({
      userId,
      action: 'SUPPLIER_CREATE',
      entity: 'SUPPLIER',
      entityId: supplier.id,
      details: { name: supplier.name },
      ipAddress,
    });

    return supplier;
  }

  static async updateSupplier(
    id: string,
    data: {
      name?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      address?: string;
      leadTime?: number;
    },
    userId: string,
    ipAddress?: string
  ) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new AppError('Supplier not found.', 404, 'NOT_FOUND');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson.trim();
    if (data.email !== undefined) updateData.email = data.email.trim();
    if (data.phone !== undefined) updateData.phone = data.phone.trim();
    if (data.address !== undefined) updateData.address = data.address.trim();
    if (data.leadTime !== undefined) updateData.leadTime = Number(data.leadTime);

    const updated = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    await AuditService.log({
      userId,
      action: 'SUPPLIER_UPDATE',
      entity: 'SUPPLIER',
      entityId: id,
      details: { changes: updateData },
      ipAddress,
    });

    return updated;
  }

  static async deleteSupplier(id: string, userId: string, ipAddress?: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      throw new AppError('Supplier not found.', 404, 'NOT_FOUND');
    }

    await prisma.supplier.delete({ where: { id } });

    await AuditService.log({
      userId,
      action: 'SUPPLIER_DELETE',
      entity: 'SUPPLIER',
      entityId: id,
      details: { name: supplier.name },
      ipAddress,
    });

    return { message: 'Supplier deleted successfully.' };
  }
}
