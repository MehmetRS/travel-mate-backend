import { Expose, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

// Enum matching Prisma schema
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LOCATION = 'LOCATION',
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MessageDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  senderId: string;

  @Expose()
  messageType: MessageType;

  @Expose()
  metadata: Record<string, any> | null;

  @Expose()
  createdAt: Date;
}

export class ChatResponseDto {
  @Expose()
  exists: boolean;

  @Expose()
  chatId?: string;

  @Expose()
  @Type(() => MessageDto)
  messages?: MessageDto[];
}
