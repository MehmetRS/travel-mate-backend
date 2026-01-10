import { Expose, Type } from 'class-transformer';
import { IsString, IsNotEmpty } from 'class-validator';

// Note: These DTOs represent the API contract only
// Actual DB schema will be added in a future migration

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MessageDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  senderId: string;

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
