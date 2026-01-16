import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatResponseDto, CreateMessageDto, MessageType } from '../dtos/chat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getChatByTripId(tripId: string, userId: string): Promise<ChatResponseDto> {
    this.logger.log(`User ${userId} requesting chat for trip ${tripId}`);

    // Verify the trip exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Find chat in database
    const chat = await this.prisma.chat.findUnique({
      where: { tripId },
      include: {
        members: {
          where: { userId },
          select: { userId: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      return { exists: false };
    }

    // Check if user is a member of the chat
    if (chat.members.length === 0) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    // Map Prisma MessageType to DTO MessageType and handle metadata
    const mappedMessages = chat.messages.map(message => ({
      ...message,
      messageType: message.messageType as unknown as MessageType,
      metadata: message.metadata as Record<string, any> | null,
    }));

    return {
      exists: true,
      chatId: chat.id,
      messages: mappedMessages,
    };
  }

  async createMessage(
    tripId: string,
    userId: string,
    dto: CreateMessageDto,
  ): Promise<ChatResponseDto> {
    this.logger.log(`User ${userId} sending message to trip ${tripId} chat`);

    // Verify the trip exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Get chat
    const chat = await this.prisma.chat.findUnique({
      where: { tripId },
      include: {
        members: {
          where: { userId },
          select: { userId: true },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found for this trip');
    }

    // Check if user is a member
    if (chat.members.length === 0) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    // Create new message
    await this.prisma.message.create({
      data: {
        chatId: chat.id,
        content: dto.content,
        senderId: userId,
        messageType: dto.messageType || 'TEXT',
        metadata: dto.metadata || undefined,
      },
    });

    this.logger.log(`Message created in chat ${chat.id}`);

    // Return updated chat with messages
    const updatedChat = await this.prisma.chat.findUnique({
      where: { id: chat.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!updatedChat) {
      throw new Error('Failed to retrieve updated chat');
    }

    // Map Prisma MessageType to DTO MessageType and handle metadata
    const mappedMessages = updatedChat.messages.map(message => ({
      ...message,
      messageType: message.messageType as unknown as MessageType,
      metadata: message.metadata as Record<string, any> | null,
    }));

    return {
      exists: true,
      chatId: updatedChat.id,
      messages: mappedMessages,
    };
  }
}
