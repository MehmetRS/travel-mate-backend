import { Controller, Get, Post, Param, Req, Body } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatResponseDto, CreateMessageDto } from '../dtos/chat.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
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
    return this.chatsService.getChatByTripId(tripId, req.user.sub);
  }

  @Post('messages')
  async createMessage(
    @Param('tripId') tripId: string,
    @Req() req: AuthenticatedRequest,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatsService.createMessage(tripId, req.user.sub, createMessageDto);
  }
}
