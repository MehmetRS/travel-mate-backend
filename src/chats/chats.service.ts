import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatResponseDto } from '../dtos/chat.dto';

// Note: This is a temporary in-memory store until DB migration
// Will be replaced with proper Prisma models in the future
interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
}

interface Chat {
  id: string;
  tripId: string;
  messages: Message[];
}

@Injectable()
export class ChatsService {
  // Temporary in-memory storage
  private chats: Map<string, Chat> = new Map();

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

    // Check if chat exists in our temporary store
    const chat = this.chats.get(tripId);
    if (!chat) {
      return { exists: false };
    }

    // Return chat data
    return {
      exists: true,
      chatId: chat.id,
      messages: chat.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
      })),
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

    // Get or create chat for this trip
    let chat = this.chats.get(tripId);
    if (!chat) {
      // Create new chat
      chat = {
        id: `chat-${tripId}`, // Temporary ID generation
        tripId: tripId,
        messages: [],
      };
      this.chats.set(tripId, chat);
    }

    // Add new message
    const newMessage: Message = {
      id: `msg-${Date.now()}`, // Temporary ID generation
      content: content,
      senderId: userId,
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);

    // Return updated chat
    return {
      exists: true,
      chatId: chat.id,
      messages: chat.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
      })),
    };
  }
}
