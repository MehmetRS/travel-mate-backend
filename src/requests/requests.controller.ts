import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import {
  CreateTripRequestDto,
  UpdateTripRequestDto,
  TripRequestResponseDto,
} from '../dtos/request.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post('trips/:tripId/requests')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(
    @Param('tripId') tripId: string,
    @Body() dto: CreateTripRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripRequestResponseDto> {
    return this.requestsService.createRequest(tripId, req.user.id, dto);
  }

  @Get('trips/:tripId/requests')
  async getRequestsForTrip(
    @Param('tripId') tripId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripRequestResponseDto[]> {
    return this.requestsService.getRequestsForTrip(tripId, req.user.id);
  }

  @Patch('requests/:requestId')
  async updateRequest(
    @Param('requestId') requestId: string,
    @Body() dto: UpdateTripRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TripRequestResponseDto & { chatId?: string }> {
    return this.requestsService.updateRequest(requestId, req.user.id, dto.action);
  }
}
