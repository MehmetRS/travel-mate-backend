import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatResponseDto } from '../dtos/chat.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getChatByTripId(tripId: string, userId: string): Promise<ChatResponseDto> {
    // First verify the trip exists and user is a participant
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true }, // Only select what we need
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // For now, only the trip creator (driver) can access the chat
    // This will be expanded to include passengers in the future
    if (trip.userId !== userId) {
      throw new ForbiddenException('You are not a participant in this trip');
    }

    // Find chat in database
    const chat = await this.prisma.chat.findUnique({
      where: { tripId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!chat) {
      return { exists: false };
    }

    return {
      exists: true,
      chatId: chat.id,
      messages: chat.messages,
    };
  }

  async createMessage(tripId: string, userId: string, content: string): Promise<ChatResponseDto> {
    // First verify the trip exists and user is the owner
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { userId: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // For now, only the trip owner (driver) can send messages
    if (trip.userId !== userId) {
      throw new ForbiddenException('You are not authorized to send messages for this trip');
    }

    // Get or create chat
    let chat = await this.prisma.chat.findUnique({
      where: { tripId }
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          tripId
        }
      });
    }

    // Create new message
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        content,
        senderId: userId
      }
    });

    // Return updated chat with messages
    const updatedChat = await this.prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!updatedChat) {
      throw new Error('Failed to retrieve updated chat');
    }

    return {
      exists: true,
      chatId: updatedChat.id,
      messages: updatedChat.messages
    };
  }
}
