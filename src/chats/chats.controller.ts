import { Controller, Get, Post, Param, Req, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatResponseDto, CreateMessageDto } from '../dtos/chat.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('trips/:tripId/chat')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Get()
  async getChat(
    @Param('tripId') tripId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChatResponseDto> {
    return this.chatsService.getChatByTripId(tripId, req.user.id);
  }

  @Post('messages')
  async createMessage(
    @Param('tripId') tripId: string,
    @Req() req: AuthenticatedRequest,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatsService.createMessage(tripId, req.user.id, createMessageDto);
  }
}
