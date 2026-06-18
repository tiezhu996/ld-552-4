import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../prisma/selects';
import { UserRole } from '../../constants/enums';

@Injectable()
export class FollowUpsService {
  constructor(private prisma: PrismaService) {}

  findByCandidate(candidateId: number) {
    return this.prisma.followUp.findMany({
      where: { candidateId },
      include: { createdBy: { select: publicUserSelect } },
      orderBy: { contactedAt: 'desc' },
    });
  }

  async create(data: any, userId: number) {
    return this.prisma.followUp.create({
      data: {
        ...data,
        contactedAt: new Date(data.contactedAt),
        createdById: userId,
      },
      include: { createdBy: { select: publicUserSelect } },
    });
  }

  async update(id: number, data: any, user: any) {
    const current = await this.prisma.followUp.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('FollowUp not found');
    if (user.role !== UserRole.HR && user.role !== UserRole.ADMIN && current.createdById !== user.id) {
      throw new ForbiddenException('No permission to edit this follow-up');
    }
    return this.prisma.followUp.update({
      where: { id },
      data: {
        ...data,
        contactedAt: data.contactedAt ? new Date(data.contactedAt) : undefined,
      },
      include: { createdBy: { select: publicUserSelect } },
    });
  }

  async remove(id: number, user: any) {
    const current = await this.prisma.followUp.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('FollowUp not found');
    if (user.role !== UserRole.HR && user.role !== UserRole.ADMIN && current.createdById !== user.id) {
      throw new ForbiddenException('No permission to delete this follow-up');
    }
    return this.prisma.followUp.delete({ where: { id } });
  }
}
